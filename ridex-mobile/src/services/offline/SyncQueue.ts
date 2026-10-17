import { localSyncRepository } from '../database/repositories/LocalSyncRepository';
import { SyncEntityType, SyncOperationType, SyncQueueItem } from '../database/databaseTypes';
import { logger } from '@/utils/logger';

export type SyncErrorCategory =
  | 'NETWORK_ERROR'
  | 'AUTH_ERROR'
  | 'PERMISSION_ERROR'
  | 'VALIDATION_ERROR'
  | 'CONFLICT_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface ClassifiedSyncError {
  category: SyncErrorCategory;
  message: string;
  isRetryable: boolean;
  originalError?: any;
}

export class SyncQueueManager {
  private static readonly MAX_RETRY_COUNT = 5;
  private static readonly BASE_BACKOFF_MS = 1000; // 1 second

  static classifyError(error: any): ClassifiedSyncError {
    const errorString = (error?.message || error?.toString() || '').toLowerCase();
    const status = error?.status || error?.code;

    if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('timeout') || errorString.includes('offline')) {
      return {
        category: 'NETWORK_ERROR',
        message: 'Network connection unavailable or request timed out.',
        isRetryable: true,
        originalError: error,
      };
    }

    if (status === 401 || errorString.includes('jwt') || errorString.includes('unauthorized') || errorString.includes('session expired')) {
      return {
        category: 'AUTH_ERROR',
        message: 'Authentication session expired or invalid.',
        isRetryable: false, // Don't retry in loop without refreshed session
        originalError: error,
      };
    }

    if (status === 403 || errorString.includes('permission') || errorString.includes('row-level security') || errorString.includes('rls')) {
      return {
        category: 'PERMISSION_ERROR',
        message: 'Insufficient permissions for this resource.',
        isRetryable: false,
        originalError: error,
      };
    }

    if (status === 409 || errorString.includes('conflict') || errorString.includes('duplicate key')) {
      return {
        category: 'CONFLICT_ERROR',
        message: 'Data conflict on remote server.',
        isRetryable: true,
        originalError: error,
      };
    }

    if (status >= 500 || errorString.includes('internal server error')) {
      return {
        category: 'SERVER_ERROR',
        message: 'Remote cloud server error.',
        isRetryable: true,
        originalError: error,
      };
    }

    return {
      category: 'UNKNOWN_ERROR',
      message: error?.message || 'An unexpected synchronization error occurred.',
      isRetryable: true,
      originalError: error,
    };
  }

  static getBackoffDelay(retryCount: number): number {
    // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s (max 30s)
    const delay = Math.min(SyncQueueManager.BASE_BACKOFF_MS * Math.pow(2, retryCount), 30000);
    const jitter = Math.random() * 500;
    return delay + jitter;
  }

  static async enqueueOperation(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperationType,
    payload: any
  ): Promise<string> {
    return localSyncRepository.enqueue(entityType, entityId, operation, payload);
  }

  static async getNextBatch(limit: number = 25): Promise<SyncQueueItem[]> {
    return localSyncRepository.getPendingOperations(limit);
  }

  static async markCompleted(queueId: string): Promise<void> {
    await localSyncRepository.removeOperation(queueId);
    logger.info(`[SyncQueueManager] Operation ${queueId} completed and removed from queue.`);
  }

  static async markFailed(queueId: string, error: any, currentRetryCount: number): Promise<void> {
    const classified = SyncQueueManager.classifyError(error);
    const nextRetry = currentRetryCount + 1;

    if (!classified.isRetryable || nextRetry >= SyncQueueManager.MAX_RETRY_COUNT) {
      await localSyncRepository.updateStatus(queueId, 'FAILED', `${classified.category}: ${classified.message}`, true);
      logger.warn(`[SyncQueueManager] Operation ${queueId} marked as permanently FAILED after ${nextRetry} attempts.`);
    } else {
      await localSyncRepository.updateStatus(queueId, 'PENDING', `${classified.category}: ${classified.message}`, true);
      logger.info(`[SyncQueueManager] Operation ${queueId} scheduled for retry #${nextRetry}.`);
    }
  }
}
