import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiveRiderLocation } from '../../types/liveRide';

interface LiveRidersDrawerProps {
  riders: LiveRiderLocation[];
  currentUserId?: string;
  onSelectRider?: (rider: LiveRiderLocation) => void;
  selectedRiderId?: string | null;
}

export const LiveRidersDrawer: React.FC<LiveRidersDrawerProps> = ({
  riders,
  currentUserId,
  onSelectRider,
  selectedRiderId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeRiders = riders.filter((r) => r.presenceStatus === 'LIVE');
  const maxSpeed = riders.reduce(
    (max, r) => Math.max(max, Math.round(r.speedKmh ?? 0)),
    0
  );

  const getInitials = (name?: string) => {
    if (!name) return 'RX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusBadge = (status: LiveRiderLocation['presenceStatus']) => {
    switch (status) {
      case 'LIVE':
        return { label: 'LIVE', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
      case 'STALE':
        return { label: 'STALE', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
      default:
        return { label: 'OFFLINE', color: '#64748B', bg: 'rgba(100, 116, 139, 0.15)' };
    }
  };

  return (
    <View style={[styles.drawer, isExpanded && styles.drawerExpanded]}>
      {/* Drawer Handle / Header Bar */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.handleBar} />

        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.radarIconBox}>
              <Ionicons name="radio" size={16} color="#06B6D4" />
            </View>
            <View>
              <Text style={styles.headerTitle}>SQUAD RADAR</Text>
              <Text style={styles.headerSubtitle}>
                {activeRiders.length} Active • Peak {maxSpeed} km/h
              </Text>
            </View>
          </View>

          <View style={styles.toggleArrow}>
            <Ionicons
              name={isExpanded ? 'chevron-down' : 'chevron-up'}
              size={20}
              color="#94A3B8"
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Roster List */}
      {isExpanded && (
        <ScrollView style={styles.scrollList} contentContainerStyle={styles.listContent}>
          {riders.map((rider) => {
            const isSelf = rider.userId === currentUserId;
            const isSelected = rider.userId === selectedRiderId;
            const statusConfig = getStatusBadge(rider.presenceStatus);
            const speed = Math.round(rider.speedKmh ?? 0);
            const displayName = rider.user?.name || rider.user?.fullName || 'Rider';
            const handle = rider.user?.username || (rider.user as any)?.handle;
            const avatarUrl = rider.user?.avatarUrl || (rider.user as any)?.avatar_url;

            return (
              <TouchableOpacity
                key={rider.userId}
                activeOpacity={0.7}
                style={[
                  styles.riderCard,
                  isSelf && styles.riderCardSelf,
                  isSelected && styles.riderCardSelected,
                ]}
                onPress={() => onSelectRider?.(rider)}
              >
                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>
                        {getInitials(displayName)}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusConfig.color },
                    ]}
                  />
                </View>

                {/* Rider Info */}
                <View style={styles.riderDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.riderName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    {isSelf && (
                      <View style={styles.selfBadge}>
                        <Text style={styles.selfBadgeText}>YOU</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.riderHandle}>
                    {handle ? `@${handle}` : 'Squad Rider'}
                  </Text>
                </View>

                {/* Telemetry Metrics */}
                <View style={styles.telemetryCol}>
                  <Text style={styles.telemetrySpeed}>{speed} km/h</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusConfig.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: statusConfig.color },
                      ]}
                    >
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    backgroundColor: '#0B1120',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  drawerExpanded: {
    maxHeight: 340,
  },
  header: {
    paddingBottom: 8,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#334155',
    alignSelf: 'center',
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radarIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  toggleArrow: {
    padding: 4,
  },
  scrollList: {
    marginTop: 8,
  },
  listContent: {
    gap: 8,
    paddingVertical: 4,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  riderCardSelf: {
    backgroundColor: '#132337',
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  riderCardSelected: {
    borderColor: '#38BDF8',
    backgroundColor: '#1E3A5F',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#334155',
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  riderDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riderName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  selfBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  selfBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  riderHandle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  telemetryCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  telemetrySpeed: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
