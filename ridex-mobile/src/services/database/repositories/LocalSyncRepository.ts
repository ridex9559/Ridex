import { databaseManager } from '../DatabaseManager';
import { SyncQueueItem, SyncMetadata, SyncQueueStatus, SyncEntityType, SyncOperationType } from '../databaseTypes';
import { logger } from '@/utils/logger';
import { generateUUID } from '@/utils/uuid';

export class LocalSyncRepository {
  /**
   * Enqueue a synchronization operation with automatic coalescing.
   * If an uncompleted UPDATE exists for the same entity, it updates the payload rather than accumulating duplicates.
   */
  async enqueue(
    entityType: SyncEntityType,
    entityId: string,
    operation: SyncOperationType,
    payload: any
  ): Promise<string> {
    try {
      const db = await databaseManager.getDatabase();
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const id = generateUUID();

      // Check if existing pending operation for same entity
      const existing = await db.getFirstAsync<SyncQueueItem>(
        "SELECT * FROM sync_queue WHERE entity_type = ? AND entity_id = ? AND status = 'PENDING'",
        [entityType, entityId]
      );

      if (existing) {
        // Coalesce operations:
        // CREATE + UPDATE => CREATE (with newest payload)
        // UPDATE + UPDATE => UPDATE (with newest payload)
        // CREATE + DELETE => Remove operation completely (it was never synced to cloud)
        // UPDATE + DELETE => DELETE
        if (existing.operation === 'CREATE' && operation === 'DELETE') {
          await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [existing.id]);
          logger.info(`[LocalSyncRepository] Coalesced CREATE+DELETE: removed local sync operation ${existing.id}`);
          return existing.id;
        }

        const effectiveOp = existing.operation === 'CREATE' ? 'CREATE' : operation;
        await db.runAsync(
          `UPDATE sync_queue SET 
             operation = ?, payload = ?, updated_at = datetime('now'), retry_count = 0, last_error = NULL
           WHERE id = ?`,
          [effectiveOp, payloadString, existing.id]
        );
        logger.info(`[LocalSyncRepository] Coalesced sync queue operation for ${entityType}:${entityId}`);
        return existing.id;
      }

      // Insert new sync queue entry
      await db.runAsync(
        `INSERT INTO sync_queue (
          id, entity_type, entity_id, operation, payload,
          status, retry_count, last_error, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'PENDING', 0, NULL, datetime('now'), datetime('now'))`,
        [id, entityType, entityId, operation, payloadString]
      );

      logger.info(`[LocalSyncRepository] Enqueued sync operation: ${operation} ${entityType}:${entityId}`);
      return id;
    } catch (error) {
      logger.error('[LocalSyncRepository] enqueue error:', error);
      throw error;
    }
  }

  async getPendingOperations(limit: number = 50): Promise<SyncQueueItem[]> {
    try {
      const db = await databaseManager.getDatabase();
      const rows = await db.getAllAsync<SyncQueueItem>(
        "SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT ?",
        [limit]
      );
      return rows;
    } catch (error) {
      logger.error('[LocalSyncRepository] getPendingOperations error:', error);
      return [];
    }
  }

  async updateStatus(
    id: string,
    status: SyncQueueStatus,
    errorMsg: string | null = null,
    incrementRetry: boolean = false
  ): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      if (incrementRetry) {
        await db.runAsync(
          `UPDATE sync_queue SET 
             status = ?, 
             last_error = ?, 
             retry_count = retry_count + 1, 
             last_attempt_at = datetime('now'),
             updated_at = datetime('now')
           WHERE id = ?`,
          [status, errorMsg, id]
        );
      } else {
        await db.runAsync(
          `UPDATE sync_queue SET 
             status = ?, 
             last_error = ?, 
             last_attempt_at = datetime('now'),
             updated_at = datetime('now')
           WHERE id = ?`,
          [status, errorMsg, id]
        );
      }
    } catch (error) {
      logger.error('[LocalSyncRepository] updateStatus error:', error);
    }
  }

  async removeOperation(id: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    } catch (error) {
      logger.error('[LocalSyncRepository] removeOperation error:', error);
    }
  }

  async getQueueCounts(): Promise<{ pending: number; failed: number; total: number }> {
    try {
      const db = await databaseManager.getDatabase();
      const pendingRow = await db.getFirstAsync<{ count: number }>(
        "SELECT count(*) as count FROM sync_queue WHERE status = 'PENDING'"
      );
      const failedRow = await db.getFirstAsync<{ count: number }>(
        "SELECT count(*) as count FROM sync_queue WHERE status = 'FAILED'"
      );
      const totalRow = await db.getFirstAsync<{ count: number }>(
        'SELECT count(*) as count FROM sync_queue'
      );

      return {
        pending: pendingRow?.count || 0,
        failed: failedRow?.count || 0,
        total: totalRow?.count || 0,
      };
    } catch (error) {
      logger.error('[LocalSyncRepository] getQueueCounts error:', error);
      return { pending: 0, failed: 0, total: 0 };
    }
  }

  async resetFailedOperations(): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        "UPDATE sync_queue SET status = 'PENDING', retry_count = 0, last_error = NULL WHERE status = 'FAILED'"
      );
    } catch (error) {
      logger.error('[LocalSyncRepository] resetFailedOperations error:', error);
    }
  }

  // --- Sync Metadata ---

  async getSyncMetadata(entityType: string): Promise<SyncMetadata | null> {
    try {
      const db = await databaseManager.getDatabase();
      const row = await db.getFirstAsync<SyncMetadata>(
        'SELECT * FROM sync_metadata WHERE entity_type = ?',
        [entityType]
      );
      return row || null;
    } catch (error) {
      logger.error('[LocalSyncRepository] getSyncMetadata error:', error);
      return null;
    }
  }

  async updateSyncMetadata(
    entityType: string,
    lastSyncAt: string,
    lastSuccessfulSyncAt?: string,
    syncCursor?: string
  ): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        `INSERT INTO sync_metadata (entity_type, last_sync_at, last_successful_sync_at, sync_cursor)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(entity_type) DO UPDATE SET
           last_sync_at = excluded.last_sync_at,
           last_successful_sync_at = COALESCE(excluded.last_successful_sync_at, sync_metadata.last_successful_sync_at),
           sync_cursor = COALESCE(excluded.sync_cursor, sync_metadata.sync_cursor)`,
        [entityType, lastSyncAt, lastSuccessfulSyncAt || null, syncCursor || null]
      );
    } catch (error) {
      logger.error('[LocalSyncRepository] updateSyncMetadata error:', error);
    }
  }

  // --- App Metadata ---

  async getAppMetadata(key: string): Promise<string | null> {
    try {
      const db = await databaseManager.getDatabase();
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_metadata WHERE key = ?',
        [key]
      );
      return row ? row.value : null;
    } catch (error) {
      logger.error('[LocalSyncRepository] getAppMetadata error:', error);
      return null;
    }
  }

  async setAppMetadata(key: string, value: string): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();
      await db.runAsync(
        `INSERT INTO app_metadata (key, value, updated_at) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        [key, value]
      );
    } catch (error) {
      logger.error('[LocalSyncRepository] setAppMetadata error:', error);
    }
  }
}

export const localSyncRepository = new LocalSyncRepository();
