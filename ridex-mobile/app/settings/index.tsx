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
  ArrowLeft,
  Moon,
  Compass,
  Database,
  Shield,
  LogOut,
  Info,
  RotateCcw,
} from 'lucide-react-native';
import { Card, Button, Avatar } from '@/components/ui';
import { SignOutModal } from '@/components/auth/SignOutModal';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/store/appStore';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuth();
  const { units, setUnits } = useAppStore();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleConfirmLogout = async () => {
    await signOut();
    setShowSignOutModal(false);
    router.replace('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card variant="glass" style={styles.profileCard}>
          <Avatar
            uri={user?.avatarUrl}
            name={user?.name || 'Rider'}
            size={54}
          />
          <View style={styles.profileMeta}>
            <Text style={styles.profileName}>{user?.name || 'Marcus Vance'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'marcus@ridex.app'}</Text>
          </View>
        </Card>

        {/* Units System Selector */}
        <Text style={styles.sectionHeader}>TELEMETRY & UNITS</Text>
        <Card variant="elevated" style={styles.settingCard}>
          <Text style={styles.settingTitle}>Measurement System</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => setUnits('metric')}
              style={[
                styles.toggleBtn,
                units === 'metric' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  units === 'metric' && styles.toggleTextActive,
                ]}
              >
                METRIC (KM/H, METERS)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUnits('imperial')}
              style={[
                styles.toggleBtn,
                units === 'imperial' && styles.toggleBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  units === 'imperial' && styles.toggleTextActive,
                ]}
              >
                IMPERIAL (MPH, FEET)
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Display & Offline */}
        <Text style={styles.sectionHeader}>APP PREFERENCES</Text>
        <Card variant="elevated" style={styles.listCard}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Moon size={18} color={COLORS.primary.DEFAULT} />
              <Text style={styles.rowTitle}>Theme</Text>
            </View>
            <Text style={styles.rowValue}>Tesla OLED Dark</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Compass size={18} color={COLORS.accent.telemetryCyan} />
              <Text style={styles.rowTitle}>GPS Logging Rate</Text>
            </View>
            <Text style={styles.rowValue}>1.0 Hz High-Precision</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Database size={18} color={COLORS.accent.gold} />
              <Text style={styles.rowTitle}>Offline Storage Cache</Text>
            </View>
            <Text style={styles.rowValue}>48 MB (Clear)</Text>
          </TouchableOpacity>
        </Card>

        {/* About & Version */}
        <Text style={styles.sectionHeader}>ABOUT</Text>
        <Card variant="elevated" style={styles.listCard}>
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Info size={18} color={COLORS.text.secondary} />
              <Text style={styles.rowTitle}>RIDEX Version</Text>
            </View>
            <Text style={styles.rowValue}>v2.0.0 (Step 3 Auth)</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Shield size={18} color={COLORS.status.success} />
              <Text style={styles.rowTitle}>Supabase Auth Session</Text>
            </View>
            <Text style={styles.rowValue}>Encrypted (SecureStore)</Text>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => router.push('/debug/map-diag' as any)}
          >
            <View style={styles.rowLeft}>
              <Compass size={18} color="#00E5FF" />
              <Text style={[styles.rowTitle, { color: '#00E5FF', fontWeight: '800' }]}>
                Map Radar Diagnostic Lab
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: '#00E5FF' }]}>OPEN &gt;</Text>
          </TouchableOpacity>
        </Card>

        {/* Logout & Reset Buttons */}
        <View style={{ marginTop: SPACING.xl, gap: SPACING.sm }}>
          <Button
            title="SIGN OUT OF COCKPIT"
            onPress={() => setShowSignOutModal(true)}
            variant="danger"
            size="lg"
            fullWidth
            leftIcon={<LogOut size={18} color="#FFFFFF" />}
          />

          <Button
            title="START FRESH (RESET ONBOARDING & SIGN OUT)"
            variant="ghost"
            size="sm"
            fullWidth
            leftIcon={<RotateCcw size={14} color={COLORS.accent.gold} />}
            style={{ borderColor: 'rgba(255, 176, 0, 0.3)', borderWidth: 1 }}
            textStyle={{ color: COLORS.accent.gold, fontSize: 11, fontWeight: '800' }}
            onPress={async () => {
              Alert.alert(
                'Reset to First Launch?',
                'This will sign out and reset the onboarding tour so you can experience the first-time sign-up, garage setup, and tour from scratch.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset & Start Fresh',
                    style: 'destructive',
                    onPress: async () => {
                      await useAppStore.getState().setOnboardingCompleted(false);
                      await signOut();
                      router.replace('/onboarding' as any);
                    },
                  },
                ]
              );
            }}
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={isLoading}
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
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  profileMeta: {
    marginLeft: SPACING.md,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '800',
    color: COLORS.text.secondary,
    letterSpacing: 1,
    marginBottom: SPACING.xs + 2,
  },
  settingCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  settingTitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.background.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary.glow,
    borderColor: COLORS.primary.DEFAULT,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.secondary,
  },
  toggleTextActive: {
    color: COLORS.primary.DEFAULT,
  },
  listCard: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  rowTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  rowValue: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border.subtle,
  },
});
