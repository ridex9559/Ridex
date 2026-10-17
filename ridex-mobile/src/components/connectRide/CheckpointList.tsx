import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RideCheckpoint } from '../../types/connectRide';

interface CheckpointListProps {
  checkpoints: RideCheckpoint[];
  editable?: boolean;
  onAddStop?: () => void;
  onRemoveStop?: (index: number) => void;
}

export const CheckpointList: React.FC<CheckpointListProps> = ({
  checkpoints,
  editable = false,
  onAddStop,
  onRemoveStop,
}) => {
  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'START':
        return { icon: 'flag' as const, color: '#10B981', label: 'Start Rendezvous' };
      case 'BREAKFAST':
        return { icon: 'cafe' as const, color: '#F59E0B', label: 'Breakfast Stop' };
      case 'LUNCH':
        return { icon: 'restaurant' as const, color: '#FB923C', label: 'Lunch Stop' };
      case 'COFFEE':
      case 'FOOD':
        return { icon: 'pint' as const, color: '#EAB308', label: 'Food / Refreshment' };
      case 'FUEL':
        return { icon: 'flash' as const, color: '#06B6D4', label: 'Fuel Stop' };
      case 'VIEWPOINT':
      case 'SCENIC':
        return { icon: 'camera' as const, color: '#A855F7', label: 'Scenic Viewpoint' };
      case 'REST':
        return { icon: 'bed' as const, color: '#34D399', label: 'Rest Stop' };
      case 'DESTINATION':
        return { icon: 'location' as const, color: '#EF4444', label: 'Final Destination' };
      case 'CUSTOM':
      case 'STOP':
        return { icon: 'pin' as const, color: '#38BDF8', label: 'Route Checkpoint' };
      default:
        return { icon: 'navigate' as const, color: '#38BDF8', label: 'Regroup Point' };
    }
  };

  const hasCheckpoints = Array.isArray(checkpoints) && checkpoints.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Ionicons name="git-commit-outline" size={16} color="#06B6D4" />
          <Text style={styles.headerTitle}>ROUTE CHECKPOINTS & STOPS</Text>
        </View>
        {editable && onAddStop ? (
          <TouchableOpacity style={styles.addBtn} onPress={onAddStop}>
            <Ionicons name="add" size={14} color="#06B6D4" />
            <Text style={styles.addBtnText}>ADD STOP</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!hasCheckpoints ? (
        <View style={styles.emptyStateBox}>
          <Ionicons name="map-outline" size={24} color="#475569" />
          <Text style={styles.emptyStateTitle}>NO ROUTE STOPS ADDED</Text>
          <Text style={styles.emptyStateSubtitle}>
            Direct non-stop squad ride from start meetup to final destination.
          </Text>
          {editable && onAddStop && (
            <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddStop}>
              <Ionicons name="add-circle" size={16} color="#06B6D4" />
              <Text style={styles.emptyAddBtnText}>Add Fuel or Breakfast Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.timeline}>
          {checkpoints.map((cp, idx) => {
            const config = getIcon(cp.type);
            const isLast = idx === checkpoints.length - 1;
            const stopMinutes = cp.estimatedStopMinutes || cp.stopDuration || 0;

            return (
              <View key={cp.id || `cp-row-${idx}`} style={styles.timelineItem}>
                {/* Timeline Indicator Column */}
                <View style={styles.indicatorCol}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${config.color}20`, borderColor: config.color },
                    ]}
                  >
                    <Ionicons name={config.icon} size={14} color={config.color} />
                  </View>
                  {!isLast && <View style={styles.verticalLine} />}
                </View>

                {/* Stop Details Card */}
                <View style={styles.detailsCol}>
                  <View style={styles.stopNameRow}>
                    <Text style={styles.stopName} numberOfLines={1}>
                      {cp.name}
                    </Text>
                    {editable && onRemoveStop && cp.type !== 'START' && cp.type !== 'DESTINATION' && (
                      <TouchableOpacity
                        onPress={() => onRemoveStop(idx)}
                        style={styles.deleteBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
                    {stopMinutes > 0 && cp.type !== 'DESTINATION' && (
                      <Text style={styles.stopTime}>• {stopMinutes} min stop</Text>
                    )}
                    {cp.distanceFromStartKm !== undefined && cp.distanceFromStartKm > 0 && (
                      <Text style={styles.distanceBadge}>• {cp.distanceFromStartKm} km from start</Text>
                    )}
                  </View>

                  {cp.address ? (
                    <Text style={styles.addressText} numberOfLines={1}>
                      {cp.address}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  addBtnText: {
    color: '#06B6D4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  emptyStateBox: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  emptyStateSubtitle: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  emptyAddBtnText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '700',
  },
  timeline: {
    gap: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  indicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalLine: {
    width: 2,
    height: 38,
    backgroundColor: '#1E293B',
    marginVertical: -2,
  },
  detailsCol: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 16,
  },
  stopNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stopName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stopTime: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  distanceBadge: {
    fontSize: 10,
    color: '#06B6D4',
    fontWeight: '700',
  },
  addressText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});
