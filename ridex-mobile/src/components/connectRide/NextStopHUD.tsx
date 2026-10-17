import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RideCheckpoint, CheckpointType } from '../../types/connectRide';

interface NextStopHUDProps {
  checkpoint: RideCheckpoint | null;
  onPress?: (checkpoint: RideCheckpoint) => void;
}

export const NextStopHUD: React.FC<NextStopHUDProps> = ({
  checkpoint,
  onPress,
}) => {
  if (!checkpoint) return null;

  const getCheckpointIcon = (type: CheckpointType) => {
    switch (type) {
      case 'BREAKFAST':
        return { icon: 'cafe' as const, color: '#F59E0B', label: 'FOOD / BREAKFAST' };
      case 'FUEL':
        return { icon: 'flash' as const, color: '#06B6D4', label: 'FUEL STOP' };
      case 'VIEWPOINT':
        return { icon: 'camera' as const, color: '#A855F7', label: 'SCENIC VIEWPOINT' };
      case 'DESTINATION':
        return { icon: 'flag' as const, color: '#10B981', label: 'FINAL DESTINATION' };
      default:
        return { icon: 'location' as const, color: '#38BDF8', label: 'REGROUP POINT' };
    }
  };

  const config = getCheckpointIcon(checkpoint.type);
  const distanceKm = checkpoint.distanceFromUserMeters
    ? (checkpoint.distanceFromUserMeters / 1000).toFixed(1)
    : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.container}
      onPress={() => onPress?.(checkpoint)}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${config.color}20` }]}>
        <Ionicons name={config.icon} size={18} color={config.color} />
      </View>

      <View style={styles.infoCol}>
        <Text style={[styles.typeLabel, { color: config.color }]}>
          NEXT STOP • {config.label}
        </Text>
        <Text style={styles.nameText} numberOfLines={1}>
          {checkpoint.name}
        </Text>
      </View>

      <View style={styles.metaCol}>
        {distanceKm ? (
          <Text style={styles.distanceText}>{distanceKm} KM</Text>
        ) : null}
        {checkpoint.etaMinutes ? (
          <Text style={styles.etaText}>~{checkpoint.etaMinutes} min</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
    zIndex: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  nameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 1,
  },
  metaCol: {
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#38BDF8',
  },
  etaText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 1,
  },
});
