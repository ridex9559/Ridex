import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LiveRiderLocation } from '../../types/liveRide';

interface RiderMarkerProps {
  rider: LiveRiderLocation;
  isSelf?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
}

export const RiderMarker: React.FC<RiderMarkerProps> = ({
  rider,
  isSelf = false,
  isSelected = false,
  onPress,
}) => {
  const heading = rider.heading ?? 0;
  const speed = Math.round(rider.speedKmh ?? 0);
  const status = rider.presenceStatus || 'LIVE';

  const getStatusColor = () => {
    if (status === 'LIVE') return '#10B981'; // Emerald Green
    if (status === 'STALE') return '#F59E0B'; // Amber
    return '#64748B'; // Slate Grey (Offline)
  };

  const getInitials = (name?: string) => {
    if (!name) return 'RX';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const statusColor = getStatusColor();
  const userName =
    rider.user?.full_name ||
    rider.user?.fullName ||
    rider.user?.name ||
    (isSelf ? 'You' : 'Rider');
  const avatarUri = rider.user?.avatar_url || rider.user?.avatarUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      {/* Tooltip / Speed Bubble */}
      <View style={[styles.bubble, isSelf && styles.selfBubble]}>
        <Text style={styles.bubbleName} numberOfLines={1}>
          {isSelf ? 'YOU' : userName}
        </Text>
        <Text style={styles.bubbleSpeed}>
          {speed > 0 ? `${speed} km/h` : 'PAUSED'}
        </Text>
      </View>

      {/* Main Radar Marker Body */}
      <View style={styles.markerAnchor}>
        {/* Pulsing Status Ring */}
        <View
          style={[
            styles.outerRing,
            { borderColor: statusColor },
            status === 'LIVE' && styles.liveGlow,
          ]}
        >
          {/* Compass Heading Indicator Arrow */}
          <View
            style={[
              styles.headingContainer,
              { transform: [{ rotate: `${heading}deg` }] },
            ]}
          >
            <View style={[styles.headingArrow, { borderBottomColor: statusColor }]} />
          </View>

          {/* Avatar or Initials */}
          <View style={[styles.avatarCircle, isSelf && styles.selfAvatar]}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.initialsText}>
                {getInitials(userName)}
              </Text>
            )}
          </View>
        </View>

        {/* Status Dot */}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  bubble: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  selfBubble: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  bubbleName: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bubbleSpeed: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
  },
  markerAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 46,
    height: 46,
  },
  outerRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveGlow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },
  headingContainer: {
    position: 'absolute',
    top: -9,
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  headingArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selfAvatar: {
    backgroundColor: '#0284C7',
  },
  avatarImage: {
    width: 30,
    height: 30,
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: '#0F172A',
  },
});
