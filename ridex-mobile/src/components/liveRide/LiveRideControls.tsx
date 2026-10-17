import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LiveRideControlsProps {
  isFollowing: boolean;
  onToggleFollow: () => void;
  onRecenter: () => void;
  isBroadcasting: boolean;
  onToggleBroadcasting: () => void;
  isOrganizer: boolean;
  onEndRide: () => void;
  onLeaveRide: () => void;
  activeRiderCount: number;
  onOpenSos?: () => void;
  onOpenAnnouncement?: () => void;
  activeSosCount?: number;
}

export const LiveRideControls: React.FC<LiveRideControlsProps> = ({
  isFollowing,
  onToggleFollow,
  onRecenter,
  isBroadcasting,
  onToggleBroadcasting,
  isOrganizer,
  onEndRide,
  onLeaveRide,
  activeRiderCount,
  onOpenSos,
  onOpenAnnouncement,
  activeSosCount = 0,
}) => {
  const handleEndOrLeave = () => {
    if (isOrganizer) {
      Alert.alert(
        'End Live Group Ride?',
        'This will conclude the live tracking session for all squad members.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Ride for All', style: 'destructive', onPress: onEndRide },
        ]
      );
    } else {
      Alert.alert(
        'Leave Live Session?',
        'You will stop sharing your live radar coordinates with the squad.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave Ride', style: 'destructive', onPress: onLeaveRide },
        ]
      );
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top Floating Telemetry & Broadcast Bar */}
      <View style={styles.topBar}>
        <View style={styles.squadPill}>
          <View style={styles.livePulseDot} />
          <Text style={styles.squadPillText}>
            {activeRiderCount} {activeRiderCount === 1 ? 'RIDER' : 'RIDERS'} ON RADAR
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onToggleBroadcasting}
          style={[styles.broadcastPill, !isBroadcasting && styles.broadcastPillOff]}
        >
          <Ionicons
            name={isBroadcasting ? 'radio' : 'radio-outline'}
            size={14}
            color={isBroadcasting ? '#10B981' : '#94A3B8'}
          />
          <Text
            style={[styles.broadcastText, !isBroadcasting && styles.broadcastTextOff]}
          >
            {isBroadcasting ? 'BEACON ACTIVE' : 'BEACON MUTED'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Bottom Left Emergency SOS Trigger */}
      {onOpenSos && (
        <View style={styles.bottomLeftRail} pointerEvents="box-none">
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.sosButton, activeSosCount > 0 && styles.sosButtonAlert]}
            onPress={onOpenSos}
          >
            <View style={styles.sosInner}>
              <Ionicons name="warning" size={20} color="#FFFFFF" />
              <Text style={styles.sosBtnText}>SOS</Text>
            </View>
            {activeSosCount > 0 && (
              <View style={styles.sosBadge}>
                <Text style={styles.sosBadgeText}>{activeSosCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Right Action Rail */}
      <View style={styles.rightRail} pointerEvents="box-none">
        {/* Road Captain Announcement Button */}
        {onOpenAnnouncement && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.floatingButton, styles.announcementButton]}
            onPress={onOpenAnnouncement}
          >
            <Ionicons name="megaphone" size={20} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Recenter Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.floatingButton}
          onPress={onRecenter}
        >
          <Ionicons name="locate" size={22} color="#F8FAFC" />
        </TouchableOpacity>

        {/* Follow Mode Toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.floatingButton, isFollowing && styles.floatingButtonActive]}
          onPress={onToggleFollow}
        >
          <Ionicons
            name={isFollowing ? 'navigate' : 'navigate-outline'}
            size={22}
            color={isFollowing ? '#06B6D4' : '#94A3B8'}
          />
        </TouchableOpacity>

        {/* End / Leave Ride Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.floatingButton, styles.endButton]}
          onPress={handleEndOrLeave}
        >
          <Ionicons name="stop" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 16,
    zIndex: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  squadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  squadPillText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  broadcastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    gap: 6,
  },
  broadcastPillOff: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderColor: '#475569',
  },
  broadcastText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  broadcastTextOff: {
    color: '#94A3B8',
  },
  rightRail: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    gap: 12,
    alignItems: 'center',
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingButtonActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: '#06B6D4',
  },
  endButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  announcementButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  bottomLeftRail: {
    position: 'absolute',
    left: 16,
    bottom: 120,
    zIndex: 40,
  },
  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
    position: 'relative',
  },
  sosButtonAlert: {
    backgroundColor: '#EF4444',
    borderColor: '#FFFFFF',
  },
  sosInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sosBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  sosBadgeText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '900',
  },
});
