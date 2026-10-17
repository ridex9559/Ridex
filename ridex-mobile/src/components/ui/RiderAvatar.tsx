import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '@/theme/colors';

interface RiderAvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  status?: 'LIVE' | 'STALE' | 'OFFLINE' | 'SEPARATED';
  showStatus?: boolean;
}

export const RiderAvatar: React.FC<RiderAvatarProps> = ({
  uri,
  name = 'Rider',
  size = 40,
  status = 'LIVE',
  showStatus = true,
}) => {
  const getInitials = (n: string) => {
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  const getStatusColor = () => {
    switch (status) {
      case 'LIVE':
        return '#00E676';
      case 'STALE':
        return '#FFB020';
      case 'SEPARATED':
        return '#FF3B30';
      case 'OFFLINE':
      default:
        return '#64748B';
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: showStatus ? statusColor : COLORS.border.subtle,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
          />
        ) : (
          <Text style={[styles.initials, { fontSize: size * 0.36 }]}>
            {getInitials(name)}
          </Text>
        )}
      </View>
      {showStatus && (
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: statusColor,
              width: Math.max(8, size * 0.22),
              height: Math.max(8, size * 0.22),
              borderRadius: Math.max(4, size * 0.11),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    backgroundColor: COLORS.background.surfaceCard,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: COLORS.background.dark,
  },
});
