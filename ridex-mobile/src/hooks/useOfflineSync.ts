import { useState, useEffect } from 'react';
import { networkService } from '../services/offline/NetworkService';
import { syncService, SyncResult } from '../services/offline/SyncService';
import { useSyncStatusStore } from '../services/offline/SyncStatusService';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const { isSyncing, pendingCount, failedCount, lastError, lastSyncAt, refreshCounts } = useSyncStatusStore();

  useEffect(() => {
    // Network listener
    const unsubscribe = networkService.subscribe((state) => {
      setIsOnline(state.status === 'ONLINE');
    });

    refreshCounts();

    return () => {
      unsubscribe();
    };
  }, [refreshCounts]);

  const triggerSync = async (): Promise<SyncResult | null> => {
    if (!isOnline || isSyncing) return null;
    return syncService.syncNow();
  };

  return {
    isOnline,
    pendingCount,
    failedCount,
    isSyncing,
    lastError,
    lastSyncAt,
    triggerSync,
    refreshQueueCount: refreshCounts,
  };
}
