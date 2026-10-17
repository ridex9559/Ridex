import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Share2, Home } from 'lucide-react-native';
import { Card, Button } from '@/components/ui';
import { RideRouteMap } from '@/components/maps/RideRouteMap';
import { MOCK_RIDES } from '@/data/rides';
import { Ride } from '@/types/ride';
import { formatDistance, formatDuration, formatSpeed } from '@/utils/formatters';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function RideSummaryScreen() {
  const router = useRouter();
  const { rideId } = useLocalSearchParams<{ rideId: string }>();

  const ride = MOCK_RIDES.find((r: Ride) => r.id === rideId) || MOCK_RIDES[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={styles.iconCircle}>
            <CheckCircle2 size={36} color={COLORS.status.success} />
          </View>
          <Text style={styles.title}>RIDE COMPLETED!</Text>
          <Text style={styles.subtitle}>Telemetry & GPS route successfully saved to local logbook</Text>
        </View>

        {/* Completed Route Map View */}
        <View style={styles.mapCardWrapper}>
          <RideRouteMap rideId={rideId} style={styles.routeMap} />
        </View>

        {/* Ride Card */}
        <Card variant="glass" style={styles.summaryCard}>
          <Text style={styles.rideTitle}>{ride.title || 'Completed Journey'}</Text>
          <Text style={styles.bikeName}>{ride.motorcycleName || 'Motorcycle'}</Text>

          {/* Key Metric Highlights */}
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>DISTANCE</Text>
              <Text style={styles.metricVal}>{formatDistance(ride.distanceKm)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>DURATION</Text>
              <Text style={styles.metricVal}>{formatDuration(ride.durationSeconds)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>MAX LEAN</Text>
              <Text style={[styles.metricVal, { color: COLORS.accent.telemetryCyan }]}>
                {ride.maxLeanAngleDegrees || 48}°
              </Text>
            </View>
          </View>
        </Card>

        {/* Secondary Telemetry */}
        <View style={styles.secondaryGrid}>
          <Card variant="elevated" style={styles.secCard}>
            <Text style={styles.secLabel}>TOP SPEED</Text>
            <Text style={styles.secVal}>{formatSpeed(ride.maxSpeedKmh)}</Text>
          </Card>
          <Card variant="elevated" style={styles.secCard}>
            <Text style={styles.secLabel}>AVG SPEED</Text>
            <Text style={styles.secVal}>{formatSpeed(ride.averageSpeedKmh)}</Text>
          </Card>
          <Card variant="elevated" style={styles.secCard}>
            <Text style={styles.secLabel}>ELEVATION</Text>
            <Text style={styles.secVal}>+{ride.elevationGainMeters}m</Text>
          </Card>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="SHARE TELEMETRY TO FEED"
            onPress={() => router.push('/community/post/create')}
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<Share2 size={18} color="#FFFFFF" />}
          />

          <Button
            title="BACK TO COCKPIT"
            onPress={() => router.replace('/(tabs)/ride')}
            variant="secondary"
            size="lg"
            fullWidth
            leftIcon={<Home size={18} color={COLORS.text.primary} />}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  mapCardWrapper: {
    height: 220,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  routeMap: {
    width: '100%',
    height: '100%',
  },
  summaryCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  rideTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  bikeName: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '900',
    color: COLORS.text.primary,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border.subtle,
  },
  secondaryGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  secCard: {
    flex: 1,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  secLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.text.muted,
    marginBottom: 2,
  },
  secVal: {
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  actions: {
    gap: SPACING.xs,
  },
});
