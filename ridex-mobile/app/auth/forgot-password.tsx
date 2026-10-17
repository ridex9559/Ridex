import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react-native';
import { Input, Button, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [isSent, setIsSent] = useState(false);

  const validate = () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(undefined);
    return true;
  };

  const handleResetPassword = async () => {
    clearError();
    if (!validate()) return;

    const cleanEmail = email.trim().toLowerCase();
    const success = await resetPassword(cleanEmail);
    if (success) {
      setIsSent(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          {!isSent ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>RESET PASSWORD</Text>
                <Text style={styles.subtitle}>
                  Enter your registered email address. We'll send you a secure link to reset your password.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {error ? (
                  <View style={styles.serverErrorBox}>
                    <Text style={styles.serverErrorText}>{error}</Text>
                  </View>
                ) : null}

                <Input
                  label="EMAIL ADDRESS"
                  placeholder="rider@ridex.app"
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    if (emailError) setEmailError(undefined);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  error={emailError}
                  leftIcon={<Mail size={18} color={COLORS.text.secondary} />}
                />

                <Button
                  title="SEND RESET LINK"
                  onPress={handleResetPassword}
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  fullWidth
                  rightIcon={<Send size={18} color="#FFFFFF" />}
                  style={styles.submitBtn}
                />
              </View>
            </>
          ) : (
            /* Success State */
            <Card variant="glass" style={styles.successCard}>
              <View style={styles.successIconBadge}>
                <CheckCircle2 size={40} color={COLORS.status.success} />
              </View>

              <Text style={styles.successTitle}>CHECK YOUR EMAIL</Text>
              <Text style={styles.successDesc}>
                If an account exists for <Text style={styles.emailHighlight}>{email.trim()}</Text>, you will receive instructions to securely reset your password.
              </Text>

              <Button
                title="BACK TO SIGN IN"
                onPress={() => router.replace('/auth/login')}
                variant="primary"
                size="md"
                fullWidth
                style={styles.backToLoginBtn}
              />

              <TouchableOpacity
                onPress={() => setIsSent(false)}
                style={styles.resendLink}
              >
                <Text style={styles.resendText}>Didn't receive it? Try another email</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Footer Back Link */}
          {!isSent ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.loginText}>SIGN IN</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  serverErrorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  serverErrorText: {
    color: COLORS.status.error,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
  successCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 204, 113, 0.3)',
    backgroundColor: 'rgba(46, 204, 113, 0.05)',
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '800',
    color: COLORS.text.primary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  successDesc: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  emailHighlight: {
    color: COLORS.primary.DEFAULT,
    fontWeight: '700',
  },
  backToLoginBtn: {
    marginBottom: SPACING.md,
  },
  resendLink: {
    padding: SPACING.xs,
  },
  resendText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    gap: 6,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },
  loginText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.5,
  },
});
