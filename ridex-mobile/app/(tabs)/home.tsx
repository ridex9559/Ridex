import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  Compass,
  Radio,
  Bike,
  Users,
  Link2,
  ChevronRight,
  Sparkles,
  MapPin,
  Calendar,
  Flame,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/authStore';
import { useBikeStore } from '@/store/bikeStore';
import { useRideDiscovery } from '@/hooks/useRideDiscovery';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { RideCard } from '@/components/rides/RideCard';
import { JoinRideModal } from '@/components/rides/JoinRideModal';
import { Card, Badge, Avatar, Button } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

const POPULAR_DESTINATIONS = [
  {
    name: 'Tamhini Ghat Twisties',
    distance: '64 km',
    riders: 18,
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80',
    tag: 'TWISTIES',
  },
  {
    name: 'Lavasa Explorer Ride',
    distance: '58 km',
    riders: 24,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80',
    tag: 'SCENIC',
  },
  {
    name: 'Mahabaleshwar Western Ghats',
    distance: '120 km',
    riders: 31,
    image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&q=80',
    tag: 'TOURING',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { motorcycles, activeMotorcycleId } = useBikeStore();
  const activeBike = motorcycles.find((b) => b.id === activeMotorcycleId) || motorcycles[0];

  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { coordinate, refreshLocation } = useCurrentLocation();

  const { rides: upcomingRides, isLoading, refetch } = useRideDiscovery({ limit: 4 });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refreshLocation()]);
    setRefreshing(false);
  };

  const nextRide = upcomingRides[0];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileBox}
          onPress={() => router.push('/(tabs)/profile' as any)}
        >
          <View style={styles.avatarWrap}>
            <Avatar uri={user?.avatarUrl} name={user?.name || 'Rider'} size={42} />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.greetingText}>READY TO RIDE</Text>
            <Text style={styles.riderName} numberOfLines={1}>
              {user?.name || 'Pratik'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.joinCodeHeaderBtn}
          onPress={() => setShowJoinModal(true)}
        >
          <Link2 size={15} color={COLORS.primary.DEFAULT} />
          <Text style={styles.joinCodeHeaderText}>JOIN WITH ID</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary.DEFAULT}
          />
        }
      >
        {/* Live GPS Radar Pill */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.radarPill, !coordinate && styles.radarPillPrompt]}
          onPress={refreshLocation}
        >
          <View style={coordinate ? styles.pulseGreen : styles.pulseYellow} />
          <Text style={styles.radarText}>
            {coordinate ? (
              <>
                <Text style={styles.radarHighlight}>14 SQUAD RIDERS</Text> ACTIVE NEARBY • GPS READY
              </>
            ) : (
              <>
                <Text style={styles.radarHighlight}>📍 TAP TO ALLOW GPS</Text> TO DISCOVER SQUADS NEARBY
              </>
            )}
          </Text>
        </TouchableOpacity>

        {/* Featured Upcoming Ride Hero Banner */}
        {nextRide && (
          <Card variant="glass" style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTagWrap}>
                <View style={styles.liveIndicator} />
                <Text style={styles.heroTagText}>FEATURED GROUP RIDE</Text>
              </View>
              <Badge label={nextRide.category} variant="primary" size="sm" />
            </View>

            <Text style={styles.heroTitle}>{nextRide.title}</Text>

            <View style={styles.heroRouteRow}>
              <MapPin size={14} color="#00E5FF" />
              <Text style={styles.heroRouteText} numberOfLines={1}>
                {nextRide.startLocation?.name} → {nextRide.destination?.name}
              </Text>
            </View>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <Calendar size={13} color={COLORS.text.muted} />
                <Text style={styles.heroMetaText}>
                  {new Date(nextRide.scheduledAt).toLocaleDateString([], {
                    weekday: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.heroMetaItem}>
                <Users size={13} color={COLORS.primary.DEFAULT} />
                <Text style={[styles.heroMetaText, { color: COLORS.primary.DEFAULT, fontWeight: '800' }]}>
                  {nextRide.currentParticipantCount} Riders Joined
                </Text>
              </View>
            </View>

            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.heroConnectBtn}
                onPress={() => router.push(`/rides/live/${nextRide.id}` as any)}
              >
                <Radio size={16} color="#080A0F" />
                <Text style={styles.heroConnectBtnText}>ENTER LIVE RADAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroDetailsBtn}
                onPress={() => router.push(`/rides/${nextRide.id}` as any)}
              >
                <Text style={styles.heroDetailsBtnText}>LOBBY</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Quick Action Rail */}
        <View style={styles.actionRail}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: COLORS.primary.DEFAULT }]}
            onPress={() => router.push('/rides/create' as any)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(255, 107, 0, 0.15)' }]}>
              <Plus size={20} color={COLORS.primary.DEFAULT} />
            </View>
            <Text style={styles.actionTitle}>HOST RIDE</Text>
            <Text style={styles.actionSub}>Create Squad</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowJoinModal(true)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
              <Link2 size={20} color="#00E5FF" />
            </View>
            <Text style={styles.actionTitle}>JOIN WITH ID</Text>
            <Text style={styles.actionSub}>Enter Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/community' as any)}
          >
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(0, 230, 118, 0.15)' }]}>
              <Users size={20} color="#00E676" />
            </View>
            <Text style={styles.actionTitle}>GROUPS</Text>
            <Text style={styles.actionSub}>My Squads</Text>
          </TouchableOpacity>
        </View>

        {/* My Garage Snapshot Card */}
        {activeBike && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.garageCard}
            onPress={() => router.push('/(tabs)/garage' as any)}
          >
            <View style={styles.garageLeft}>
              <View style={styles.garageIconCircle}>
                <Bike size={22} color={COLORS.primary.DEFAULT} />
              </View>
              <View>
                <Text style={styles.garageLabel}>MY GARAGE • PRIMARY BIKE</Text>
                <Text style={styles.garageBikeName}>
                  {activeBike.brand} {activeBike.model}
                </Text>
                <Text style={styles.garageSpecs}>
                  {activeBike.variant || `${activeBike.year} Edition`} • {activeBike.displacementCc || 450}cc • {activeBike.fuelTankCapacityLiters || 17}L Tank
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}

        {/* Upcoming Group Rides Feed */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Flame size={16} color={COLORS.primary.DEFAULT} />
            <Text style={styles.sectionTitle}>UPCOMING GROUP RIDES</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)}>
            <Text style={styles.seeAllText}>SEE ALL &gt;</Text>
          </TouchableOpacity>
        </View>

        {upcomingRides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            onPress={() => router.push(`/rides/${ride.id}` as any)}
          />
        ))}

        {/* Popular Group Destinations */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Compass size={16} color="#00E5FF" />
            <Text style={styles.sectionTitle}>POPULAR MOTORCYCLE ROUTES</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destScroll}
        >
          {POPULAR_DESTINATIONS.map((dest) => (
            <TouchableOpacity
              key={dest.name}
              style={styles.destCard}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/explore' as any)}
            >
              <Image source={{ uri: dest.image }} style={styles.destImage} />
              <View style={styles.destOverlay}>
                <View style={styles.destTag}>
                  <Text style={styles.destTagText}>{dest.tag}</Text>
                </View>
                <Text style={styles.destName}>{dest.name}</Text>
                <Text style={styles.destRiders}>👥 {dest.riders} Riders This Weekend</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Join Ride Modal */}
      <JoinRideModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00E676',
    borderWidth: 2,
    borderColor: COLORS.background.dark,
  },
  greetingText: {
    color: COLORS.text.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  riderName: {
    color: COLORS.text.primary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  joinCodeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  joinCodeHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 90,
    gap: SPACING.md,
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
    gap: 8,
  },
  radarPillPrompt: {
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
    borderColor: 'rgba(255, 176, 32, 0.4)',
  },
  pulseGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
  },
  pulseYellow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFB020',
  },
  radarText: {
    color: COLORS.text.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  radarHighlight: {
    color: '#00E676',
    fontWeight: '900',
  },
  heroCard: {
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.4)',
    gap: 10,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary.DEFAULT,
  },
  heroTagText: {
    color: COLORS.primary.DEFAULT,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  heroRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroRouteText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 2,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: COLORS.text.secondary,
    fontSize: 11,
    fontWeight: '600',
  },
  heroActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  heroConnectBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E676',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    gap: 8,
  },
  heroConnectBtnText: {
    color: '#080A0F',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroDetailsBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background.surfaceLight,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  heroDetailsBtnText: {
    color: COLORS.text.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  actionRail: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.background.surface,
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    alignItems: 'center',
    gap: 4,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionTitle: {
    color: COLORS.text.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionSub: {
    color: COLORS.text.muted,
    fontSize: 9,
  },
  garageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  garageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  garageIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  garageLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.8,
  },
  garageBikeName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginTop: 1,
  },
  garageSpecs: {
    fontSize: 10,
    color: COLORS.text.muted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  seeAllText: {
    color: COLORS.primary.DEFAULT,
    fontSize: 11,
    fontWeight: '800',
  },
  destScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  destCard: {
    width: 220,
    height: 130,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.background.surface,
  },
  destImage: {
    width: '100%',
    height: '100%',
  },
  destOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 10, 15, 0.65)',
    padding: 12,
    justifyContent: 'flex-end',
    gap: 4,
  },
  destTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.primary.DEFAULT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  destTagText: {
    color: '#080A0F',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  destName: {
    color: COLORS.text.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  destRiders: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '700',
  },
});
