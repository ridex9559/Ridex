import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatusStore, networkService, syncService } from '@/services/offline';

export const SyncStatusBar: React.FC = () => {
  const { isSyncing, pendingCount, failedCount, lastError } = useSyncStatusStore();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = networkService.subscribe((state) => {
      setIsOnline(state.status === 'ONLINE');
    });
    return unsubscribe;
  }, []);

  if (isOnline && !isSyncing && pendingCount === 0 && failedCount === 0 && !lastError) {
    return null; // Silent when everything is synchronized and online
  }

  const handleManualSync = () => {
    syncService.syncNow().catch(() => {});
  };

  if (!isOnline) {
    return (
      <View style={[styles.container, styles.offlineContainer]}>
        <Ionicons name="cloud-offline-outline" size={14} color="#FBBF24" />
        <Text style={styles.offlineText}>
          Offline Mode • {pendingCount > 0 ? `${pendingCount} saved locally` : 'Local Storage Active'}
        </Text>
      </View>
    );
  }

  if (isSyncing) {
    return (
      <View style={[styles.container, styles.syncingContainer]}>
        <ActivityIndicator size="small" color="#38BDF8" style={styles.spinner} />
        <Text style={styles.syncingText}>
          Synchronizing with cloud... {pendingCount > 0 ? `(${pendingCount} remaining)` : ''}
        </Text>
      </View>
    );
  }

  if (failedCount > 0 || lastError) {
    return (
      <TouchableOpacity style={[styles.container, styles.failedContainer]} onPress={handleManualSync}>
        <Ionicons name="warning-outline" size={14} color="#EF4444" />
        <Text style={styles.failedText} numberOfLines={1}>
          Sync pending ({failedCount || pendingCount}) • Tap to retry
        </Text>
        <Ionicons name="refresh-outline" size={14} color="#EF4444" />
      </TouchableOpacity>
    );
  }

  if (pendingCount > 0) {
    return (
      <TouchableOpacity style={[styles.container, styles.pendingContainer]} onPress={handleManualSync}>
        <Ionicons name="cloud-upload-outline" size={14} color="#38BDF8" />
        <Text style={styles.pendingText}>{pendingCount} items waiting to sync • Tap to sync now</Text>
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  offlineContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  offlineText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  syncingContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  syncingText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  failedContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  failedText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 6,
    flex: 1,
    textAlign: 'center',
  },
  pendingContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  pendingText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  spinner: {
    transform: [{ scale: 0.7 }],
  },
});
