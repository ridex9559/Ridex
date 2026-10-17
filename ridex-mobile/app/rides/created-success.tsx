import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Copy, Share2, ArrowRight, Sparkles, Shield, Users } from 'lucide-react-native';
import { Button, Card } from '@/components/ui';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function RideCreatedSuccessScreen() {
  const router = useRouter();
  const { rideId, rideCode, title } = useLocalSearchParams<{
    rideId: string;
    rideCode: string;
    title: string;
  }>();

  const code = rideCode || 'RIDEX-7X92K';
  const rideName = title || 'Tamhini Ghat Sunday Ride';

  const handleCopy = () => {
    Alert.alert('Ride ID Copied', `Ride ID "${code}" copied to clipboard. Share it with your squad!`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏍️ Join our motorcycle ride "${rideName}" on RIDEX! Use Ride ID: ${code}`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Celebration Badge */}
        <View style={styles.iconCircle}>
          <Sparkles size={40} color={COLORS.primary.DEFAULT} />
        </View>

        <Text style={styles.celebrateTitle}>🎉 RIDE CREATED</Text>
        <Text style={styles.rideTitle}>{rideName}</Text>
        <Text style={styles.subtitle}>
          Share this unique Ride ID with your friends. Riders can use this code to discover and request to join your squad.
        </Text>

        {/* Unique Ride ID Card */}
        <Card variant="glass" style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR UNIQUE RIDE ID</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{code}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={handleCopy} style={styles.actionBtn}>
              <Copy size={16} color={COLORS.primary.DEFAULT} />
              <Text style={styles.actionBtnText}>COPY ID</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
              <Share2 size={16} color="#00E5FF" />
              <Text style={[styles.actionBtnText, { color: '#00E5FF' }]}>SHARE ID</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Info Pill */}
        <View style={styles.infoPill}>
          <Shield size={14} color="#00E676" />
          <Text style={styles.infoPillText}>
            You will receive instant join requests to approve or reject riders.
          </Text>
        </View>

        <Button
          title="ENTER RIDE LOBBY"
          onPress={() => router.replace(`/rides/${rideId || 'ride-tamhini'}` as any)}
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
          style={{ marginTop: SPACING.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
    borderWidth: 2,
    borderColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  celebrateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 2,
    marginBottom: 4,
  },
  rideTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  codeCard: {
    width: '100%',
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 0, 0.35)',
    marginBottom: SPACING.md,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text.muted,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  codeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.md,
  },
  codeText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.5,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 8,
    marginTop: SPACING.xs,
  },
  infoPillText: {
    fontSize: 11,
    color: '#00E676',
    fontWeight: '600',
    flex: 1,
  },
});
