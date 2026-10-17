import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, MapPin, Clock, Gauge, Play } from 'lucide-react-native';
import { Card, Badge } from '@/components/ui';
import { MOCK_RIDES } from '@/data/rides';
import { Ride } from '@/types/ride';
import { formatDistance, formatDuration, formatSpeed } from '@/utils/formatters';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';
import { RideReplayModal } from '@/components/rides/RideReplayModal';

export default function RideHistoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [replayRide, setReplayRide] = useState<Ride | null>(null);

  const filtered = MOCK_RIDES.filter((r: Ride) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.motorcycleName && r.motorcycleName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RIDE LOGBOOK</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.text.muted} />
          <TextInput
            placeholder="Search rides, routes, bikes..."
            placeholderTextColor={COLORS.text.muted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.historyCount}>{filtered.length} RIDES LOGGED</Text>

        {filtered.map((ride: Ride) => (
          <Card
            key={ride.id}
            variant="elevated"
            onPress={() => router.push(`/rides/${ride.id}`)}
            style={styles.rideCard}
          >
            <View style={styles.rideHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rideTitle}>{ride.title}</Text>
                <Text style={styles.rideBike}>{ride.motorcycleName}</Text>
              </View>
              <Badge
                label={`${ride.maxLeanAngleDegrees || 48}° LEAN`}
                variant="telemetry"
                size="sm"
              />
            </View>

            <View style={styles.rideStats}>
              <View style={styles.statItem}>
                <MapPin size={14} color={COLORS.primary.DEFAULT} />
                <Text style={styles.statText}>{formatDistance(ride.distanceKm)}</Text>
              </View>
              <View style={styles.statItem}>
                <Clock size={14} color={COLORS.accent.gold} />
                <Text style={styles.statText}>{formatDuration(ride.durationSeconds)}</Text>
              </View>
              <View style={styles.statItem}>
                <Gauge size={14} color={COLORS.accent.telemetryCyan} />
                <Text style={styles.statText}>{formatSpeed(ride.maxSpeedKmh)} max</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>
                {new Date(ride.startTime).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity
                style={styles.replayBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setReplayRide(ride);
                }}
              >
                <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.replayBtnText}>REPLAY RIDE</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      {/* Ride Replay Modal */}
      {replayRide && (
        <RideReplayModal
          visible={!!replayRide}
          onClose={() => setReplayRide(null)}
          rideTitle={replayRide.title}
          routeCoordinates={
            replayRide.routeCoordinates && Array.isArray(replayRide.routeCoordinates)
              ? replayRide.routeCoordinates.map((coord: any) =>
                  Array.isArray(coord)
                    ? { latitude: coord[0], longitude: coord[1] }
                    : { latitude: coord.latitude || 18.5204, longitude: coord.longitude || 73.8567 }
                )
              : []
          }
          totalDistanceKm={replayRide.distanceKm || 45}
          totalDurationMin={Math.round((replayRide.durationSeconds || 3600) / 60)}
          avgSpeedKmh={Math.round((replayRide.maxSpeedKmh || 100) * 0.65)}
          maxSpeedKmh={replayRide.maxSpeedKmh || 112}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surfaceLight,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  historyCount: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  rideCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  rideTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  rideBike: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  rideStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginVertical: SPACING.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  dateText: {
    fontSize: 10,
    color: COLORS.text.muted,
  },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  replayBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
