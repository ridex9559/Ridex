import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings,
  Award,
  History,
  TrendingUp,
  Bike,
  Shield,
  MapPin,
  ChevronRight,
  Edit3,
  LogOut,
  RotateCcw,
} from 'lucide-react-native';
import { Card, Avatar, Badge, Button } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import { useBikeStore } from '@/store/bikeStore';
import { MOCK_ACHIEVEMENTS } from '@/data/achievements';
import { Achievement } from '@/types/achievement';
import { formatDistance } from '@/utils/formatters';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';
import { EditProfileModal } from '@/components/profile/EditProfileModal';
import { EmergencyContactsCard } from '@/components/profile/EmergencyContactsCard';
import { EmergencyContact, User } from '@/types/user';

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);
  const updateUser = useAuthStore(state => state.updateUser);
  const motorcycles = useBikeStore(state => state.motorcycles);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    user?.emergencyContacts || [
      { id: 'ec-1', name: 'Dr. Sarah Verma (Family Doc)', phone: '+919822011223', relationship: 'Doctor', isPrimary: false },
      { id: 'ec-2', name: 'Vikram Joshi (Riding Buddy)', phone: '+919890123456', relationship: 'Riding Buddy', isPrimary: true },
    ]
  );

  const handleSaveProfile = (updated: Partial<User>) => {
    if (updateUser) {
      updateUser(updated);
    }
    Alert.alert('Profile Saved', 'Your rider profile details have been updated.');
  };

  const handleAddContact = (contact: EmergencyContact) => {
    const updated = [...emergencyContacts, contact];
    setEmergencyContacts(updated);
    if (updateUser) {
      updateUser({ emergencyContacts: updated });
    }
    Alert.alert('Contact Added', `${contact.name} added to your emergency squad.`);
  };

  const handleRemoveContact = (id: string) => {
    const updated = emergencyContacts.filter(c => c.id !== id);
    setEmergencyContacts(updated);
    if (updateUser) {
      updateUser({ emergencyContacts: updated });
    }
  };

  const stats = {
    totalDistanceKm: user?.statistics?.totalDistanceKm ?? 0,
    totalRidesCount: user?.statistics?.totalRidesCount ?? 0,
    totalDurationSeconds: user?.statistics?.totalDurationSeconds ?? 0,
    maxSpeedKmh: user?.statistics?.maxSpeedKmh ?? 0,
    elevationGainMeters: user?.statistics?.elevationGainMeters ?? 0,
    maxLeanAngleDegrees: user?.statistics?.maxLeanAngleDegrees ?? 0,
    routesCreatedCount: user?.statistics?.routesCreatedCount ?? 0,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>RIDER PROFILE</Text>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsBtn}
        >
          <Settings size={22} color={COLORS.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Rider Hero Card */}
        <Card variant="glass" style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Avatar
              uri={user?.avatarUrl}
              name={user?.name || 'Rider'}
              size={76}
              hasStory
              isOnline
            />
            <View style={styles.heroMeta}>
              <View style={styles.nameRow}>
                <Text style={styles.heroName}>{user?.name || 'Pratik Sharma'}</Text>
                <Shield size={16} color={COLORS.primary.DEFAULT} />
              </View>
              <Text style={styles.heroHandle}>@{user?.username || user?.email?.split('@')[0] || 'pratik_rider'}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={COLORS.text.muted} />
                <Text style={styles.locationText}>{user?.city || user?.location || 'Pune, India'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editProfileIconBtn}
              onPress={() => setIsEditModalOpen(true)}
            >
              <Edit3 size={16} color="#06B6D4" />
            </TouchableOpacity>
          </View>

          {/* Experience Badges Row */}
          <View style={styles.riderBadgesRow}>
            <View style={styles.expBadge}>
              <Text style={styles.expBadgeText}>
                {user?.ridingExperienceYears || 4} YRS EXPERIENCE
              </Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>
                {user?.ridingLevel || 'INTERMEDIATE'} RIDER
              </Text>
            </View>
          </View>

          <Text style={styles.bioText}>
            {user?.bio || 'Corner carver, touring addict, weekend twisties explorer across Maharashtra.'}
          </Text>
        </Card>

        {/* Emergency Contacts Management */}
        <View style={{ marginBottom: 16 }}>
          <EmergencyContactsCard
            contacts={emergencyContacts}
            onAddContact={handleAddContact}
            onRemoveContact={handleRemoveContact}
            riderName={user?.name || 'Pratik'}
          />
        </View>

        {/* Lifetime Telemetry Grid */}
        <Text style={styles.sectionTitle}>LIFETIME TELEMETRY</Text>
        <View style={styles.statsGrid}>
          <Card variant="elevated" style={styles.statBox}>
            <Text style={styles.statLabel}>DISTANCE</Text>
            <Text style={styles.statNumber}>{formatDistance(stats.totalDistanceKm)}</Text>
            <Text style={styles.statSub}>ALL TIME</Text>
          </Card>

          <Card variant="elevated" style={styles.statBox}>
            <Text style={styles.statLabel}>RIDES</Text>
            <Text style={styles.statNumber}>{stats.totalRidesCount}</Text>
            <Text style={styles.statSub}>COMPLETED</Text>
          </Card>

          <Card variant="elevated" style={styles.statBox}>
            <Text style={styles.statLabel}>MAX LEAN</Text>
            <Text style={[styles.statNumber, { color: COLORS.accent.telemetryCyan }]}>
              {stats.maxLeanAngleDegrees}°
            </Text>
            <Text style={styles.statSub}>CORNERING</Text>
          </Card>

          <Card variant="elevated" style={styles.statBox}>
            <Text style={styles.statLabel}>ELEVATION</Text>
            <Text style={styles.statNumber}>{(stats.elevationGainMeters / 1000).toFixed(1)}k</Text>
            <Text style={styles.statSub}>METERS CLIMBED</Text>
          </Card>
        </View>

        {/* Quick Hub Navigation Cards */}
        <View style={styles.hubLinks}>
          <TouchableOpacity
            onPress={() => router.push('/rides/history')}
            style={styles.hubCard}
          >
            <View style={styles.hubLeft}>
              <View style={[styles.hubIcon, { backgroundColor: 'rgba(255, 90, 31, 0.15)' }]}>
                <History size={20} color={COLORS.primary.DEFAULT} />
              </View>
              <View>
                <Text style={styles.hubTitle}>Ride Logbook</Text>
                <Text style={styles.hubSubtitle}>Full GPS telemetry & route replays</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/rides/analytics')}
            style={styles.hubCard}
          >
            <View style={styles.hubLeft}>
              <View style={[styles.hubIcon, { backgroundColor: 'rgba(0, 229, 255, 0.15)' }]}>
                <TrendingUp size={20} color={COLORS.accent.telemetryCyan} />
              </View>
              <View>
                <Text style={styles.hubTitle}>Telemetry Analytics</Text>
                <Text style={styles.hubSubtitle}>Speed curves, lean distributions & stats</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/garage')}
            style={styles.hubCard}
          >
            <View style={styles.hubLeft}>
              <View style={[styles.hubIcon, { backgroundColor: 'rgba(255, 176, 0, 0.15)' }]}>
                <Bike size={20} color={COLORS.accent.gold} />
              </View>
              <View>
                <Text style={styles.hubTitle}>Digital Garage</Text>
                <Text style={styles.hubSubtitle}>{motorcycles.length} motorcycles registered</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.text.muted} />
          </TouchableOpacity>
        </View>

        {/* Account Session Actions */}
        <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
          <Button
            title="LOG OUT / SWITCH RIDER"
            variant="danger"
            size="md"
            fullWidth
            leftIcon={<LogOut size={16} color="#FFFFFF" />}
            onPress={async () => {
              await useAuthStore.getState().signOut();
              router.replace('/auth/login');
            }}
          />

          <Button
            title="START FROM BEGINNING (RESET ONBOARDING)"
            variant="ghost"
            size="sm"
            fullWidth
            leftIcon={<RotateCcw size={14} color={COLORS.accent.gold} />}
            style={{ borderColor: 'rgba(255, 176, 0, 0.3)', borderWidth: 1 }}
            textStyle={{ color: COLORS.accent.gold, fontSize: 11, fontWeight: '800' }}
            onPress={async () => {
              Alert.alert(
                'Reset to First Launch?',
                'This will sign out your session and reset onboarding so you can test the initial onboarding and signup flow from scratch.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset & Start Fresh',
                    style: 'destructive',
                    onPress: async () => {
                      await useAppStore.getState().setOnboardingCompleted(false);
                      await useAuthStore.getState().signOut();
                      router.replace('/onboarding' as any);
                    },
                  },
                ]
              );
            }}
          />
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={isEditModalOpen}
        user={user}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.subtle,
  },
  topBarTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: 1,
  },
  settingsBtn: {
    padding: SPACING.xs,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  heroCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  heroMeta: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  heroHandle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.text.muted,
  },
  bioText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statBox: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '900',
    color: COLORS.text.primary,
  },
  statSub: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  hubLinks: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  hubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  hubLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  hubIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  hubSubtitle: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 1,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  badgeScroll: {
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  achievementCard: {
    width: 140,
    padding: SPACING.md,
    alignItems: 'center',
  },
  achIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  achTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  achDesc: {
    fontSize: 10,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  achProgress: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent.gold,
    marginTop: 6,
  },
  editProfileIconBtn: {
    padding: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  riderBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  expBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  expBadgeText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  levelBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  levelBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
