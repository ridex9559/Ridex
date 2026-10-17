import { create } from 'zustand';
import { localSyncRepository } from '../database/repositories/LocalSyncRepository';
import { logger } from '@/utils/logger';

export interface SyncStatusState {
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  totalCount: number;
  lastSyncAt: string | null;
  lastError: string | null;
  setSyncing: (isSyncing: boolean) => void;
  setCounts: (pending: number, failed: number, total: number) => void;
  setLastSyncAt: (time: string) => void;
  setLastError: (error: string | null) => void;
  refreshCounts: () => Promise<void>;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  totalCount: 0,
  lastSyncAt: null,
  lastError: null,

  setSyncing: (isSyncing) => set({ isSyncing }),
  setCounts: (pendingCount, failedCount, totalCount) => set({ pendingCount, failedCount, totalCount }),
  setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
  setLastError: (lastError) => set({ lastError }),

  refreshCounts: async () => {
    try {
      const counts = await localSyncRepository.getQueueCounts();
      set({
        pendingCount: counts.pending,
        failedCount: counts.failed,
        totalCount: counts.total,
      });
    } catch (err) {
      logger.error('[SyncStatusStore] Failed to refresh queue counts:', err);
    }
  },
}));

export class SyncStatusService {
  static getStatus() {
    return useSyncStatusStore.getState();
  }

  static setSyncing(isSyncing: boolean) {
    useSyncStatusStore.getState().setSyncing(isSyncing);
  }

  static setLastError(error: string | null) {
    useSyncStatusStore.getState().setLastError(error);
  }

  static setLastSyncAt(time: string) {
    useSyncStatusStore.getState().setLastSyncAt(time);
  }

  static async refreshCounts() {
    await useSyncStatusStore.getState().refreshCounts();
  }
}
