import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users, Navigation, Compass, ShieldAlert } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export type SquadProximityStatus = 'TOGETHER' | 'SPREADING' | 'SPREAD' | 'SEPARATED';

interface GroupStatusHUDProps {
  status?: SquadProximityStatus;
  leadDistanceMeters?: number | null;
  tailDistanceMeters?: number | null;
  activeRiderCount?: number;
}

export const GroupStatusHUD: React.FC<GroupStatusHUDProps> = ({
  status = 'TOGETHER',
  leadDistanceMeters,
  tailDistanceMeters,
  activeRiderCount = 1,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'TOGETHER':
        return {
          label: activeRiderCount <= 1 ? 'SOLO RIDER ACTIVE' : 'GROUP TOGETHER',
          color: '#00E676',
          bg: 'rgba(0, 230, 118, 0.15)',
          border: 'rgba(0, 230, 118, 0.4)',
          desc: 'Squad riding in formation',
        };
      case 'SPREAD':
      case 'SPREADING':
        return {
          label: 'GROUP SPREAD',
          color: '#FFB020',
          bg: 'rgba(255, 176, 32, 0.15)',
          border: 'rgba(255, 176, 32, 0.4)',
          desc: 'Squad spread across 500m - 1.0km',
        };
      case 'SEPARATED':
        return {
          label: 'RIDER SEPARATED',
          color: '#FF3B30',
          bg: 'rgba(255, 59, 48, 0.15)',
          border: 'rgba(255, 59, 48, 0.4)',
          desc: 'Rider >1.0km behind lead pack',
        };
    }
  };


  const config = getStatusConfig();

  const formatDistance = (meters?: number | null, direction: 'Ahead' | 'Behind' = 'Ahead') => {
    if (meters === undefined || meters === null || activeRiderCount <= 1) return '--';
    return meters < 1000 ? `${meters}m ${direction}` : `${(meters / 1000).toFixed(1)}km ${direction}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={styles.topRow}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
          <Text style={[styles.statusTitle, { color: config.color }]}>{config.label}</Text>
        </View>

        <View style={styles.riderCountBox}>
          <Users size={12} color={COLORS.text.secondary} />
          <Text style={styles.riderCountText}>{activeRiderCount} LIVE</Text>
        </View>
      </View>

      <View style={styles.distancesRow}>
        <View style={styles.distItem}>
          <Text style={styles.distLabel}>LEAD PACK</Text>
          <Text style={styles.distValue}>{formatDistance(leadDistanceMeters, 'Ahead')}</Text>
        </View>

        <View style={styles.distDivider} />

        <View style={styles.distItem}>
          <Text style={styles.distLabel}>TAIL RIDER</Text>
          <Text style={styles.distValue}>{formatDistance(tailDistanceMeters, 'Behind')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    gap: 6,
    backdropFilter: 'blur(10px)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  riderCountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  riderCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  distancesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
  },
  distItem: {
    alignItems: 'center',
  },
  distLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 0.8,
  },
  distValue: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 1,
  },
  distDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
