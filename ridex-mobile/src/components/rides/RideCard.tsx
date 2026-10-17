/**
 * RIDEX — Group Ride Card Component
 * Displays title, organizer, departure -> destination, time, difficulty, and capacity.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Users, MapPin, ChevronRight, Radio } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RideEvent } from '../../types/groupRide';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { RADIUS } from '../../theme/radius';

export interface RideCardProps {
  ride: RideEvent;
  onPress: () => void;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onPress }) => {
  const isLive = ride.status === 'LIVE';
  const scheduledDate = new Date(ride.scheduledAt);
  const isToday = new Date().toDateString() === scheduledDate.toDateString();

  const formattedDate = isToday
    ? `Today • ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : `${scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })} • ${scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const maxCapacity = ride.maxParticipants;
  const currentRiders = ride.currentParticipantCount || 1;
  const isFull = typeof maxCapacity === 'number' && currentRiders >= maxCapacity;

  return (
    <Card variant="elevated" style={[styles.card, isLive && styles.cardLive]} onPress={onPress}>
      {/* Top Category & Live Badge */}
      <View style={styles.topRow}>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryText}>{ride.category.replace('_', ' ')}</Text>
          {isLive && (
            <View style={styles.livePulseBadge}>
              <Radio size={12} color="#EF4444" />
              <Text style={styles.livePulseText}>LIVE RADAR ACTIVE</Text>
            </View>
          )}
        </View>

        <Badge
          label={ride.difficulty || 'INTERMEDIATE'}
          variant={
            ride.difficulty === 'EXPERT'
              ? 'error'
              : ride.difficulty === 'ADVANCED'
              ? 'warning'
              : 'success'
          }
          size="sm"
        />
      </View>

      {/* Ride Title */}
      <Text style={styles.title} numberOfLines={1}>
        {ride.title}
      </Text>

      {/* Organizer Row */}
      <Text style={styles.organizerText}>
        Lead Captain: <Text style={styles.organizerName}>{ride.organizer?.callsign || ride.organizer?.fullName || 'RIDEX Rider'}</Text>
      </Text>

      {/* Departure -> Destination Route */}
      <View style={styles.routeRow}>
        <MapPin size={14} color={COLORS.primary.DEFAULT} />
        <Text style={styles.routeText} numberOfLines={1}>
          {ride.startLocation.name} ➔ {ride.destination.name}
        </Text>
      </View>

      {/* Bottom Telemetry & Participant Capacity Ribbon */}
      <View style={styles.bottomRibbon}>
        <View style={styles.dateItem}>
          <Calendar size={13} color="#94A3B8" />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        <View style={styles.capacityItem}>
          <Users size={13} color={isFull ? '#EF4444' : '#00E5FF'} />
          <Text style={[styles.capacityText, isFull && styles.capacityFullText]}>
            {currentRiders} {maxCapacity ? `/ ${maxCapacity}` : 'Riders'}
          </Text>
        </View>

        <ChevronRight size={16} color="#94A3B8" />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardLive: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 1,
  },
  livePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  livePulseText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.base + 1,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  organizerText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#94A3B8',
    marginBottom: SPACING.xs + 2,
  },
  organizerName: {
    color: '#E2E8F0',
    fontWeight: '700',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  routeText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#E2E8F0',
    fontWeight: '600',
    flex: 1,
  },
  bottomRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  capacityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E5FF',
    fontVariant: ['tabular-nums'],
  },
  capacityFullText: {
    color: '#EF4444',
  },
});
