import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Mail, RefreshCw, ExternalLink, ArrowLeft } from 'lucide-react-native';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = params.email || 'your email';

  const { resendVerification, isLoading, error, clearError } = useAuth();
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleOpenEmailApp = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('message://');
      } else if (Platform.OS === 'android') {
        await Linking.openURL('mailto:');
      } else {
        await Linking.openURL('https://mail.google.com');
      }
    } catch {
      await Linking.openURL('mailto:');
    }
  };

  const handleResend = async () => {
    if (!canResend || isLoading) return;
    clearError();
    setResendStatus(null);

    const success = await resendVerification(email);
    if (success) {
      setResendStatus('✓ Verification link resent successfully!');
      setCooldown(60);
      setCanResend(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.replace('/auth/login')}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Back to login"
        >
          <ArrowLeft size={20} color={COLORS.text.secondary} />
        </TouchableOpacity>

        <Card variant="glass" style={styles.card}>
          <View style={styles.iconBadge}>
            <Mail size={44} color={COLORS.primary.DEFAULT} />
          </View>

          <Text style={styles.title}>VERIFY YOUR EMAIL</Text>

          <Text style={styles.description}>
            We've sent a secure activation link to:
          </Text>

          <View style={styles.emailPill}>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          <Text style={styles.subtext}>
            Please check your inbox and tap the link to confirm your account and enter the RIDEX cockpit.
          </Text>

          {error ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{error}</Text>
            </View>
          ) : null}

          {resendStatus ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{resendStatus}</Text>
            </View>
          ) : null}

          <Button
            title="OPEN EMAIL APP"
            onPress={handleOpenEmailApp}
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ExternalLink size={18} color="#FFFFFF" />}
            style={styles.openEmailBtn}
          />

          <Button
            title={canResend ? 'RESEND VERIFICATION EMAIL' : `RESEND IN ${cooldown}s`}
            onPress={handleResend}
            variant="outline"
            size="md"
            fullWidth
            disabled={!canResend || isLoading}
            loading={isLoading}
            leftIcon={<RefreshCw size={16} color={canResend ? COLORS.text.primary : COLORS.text.muted} />}
            style={styles.resendBtn}
          />

          <TouchableOpacity
            onPress={() => router.replace('/auth/login')}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>Already verified? Sign In</Text>
          </TouchableOpacity>
        </Card>
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  iconBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 90, 31, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  emailPill: {
    backgroundColor: COLORS.background.surfaceLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
    marginVertical: SPACING.md,
  },
  emailText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
  subtext: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  serverErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  serverErrorText: {
    color: COLORS.status.error,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    width: '100%',
  },
  successText: {
    color: COLORS.status.success,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    fontWeight: '700',
  },
  openEmailBtn: {
    marginBottom: SPACING.md,
  },
  resendBtn: {
    marginBottom: SPACING.lg,
  },
  loginLink: {
    padding: SPACING.xs,
  },
  loginLinkText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
});
