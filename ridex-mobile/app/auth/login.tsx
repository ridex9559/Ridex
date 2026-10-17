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
import { Mail, ArrowRight } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const cleanInput = email.trim().toLowerCase();

    if (!cleanInput) {
      errs.email = 'Email address or callsign is required';
    } else if (cleanInput.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanInput)) {
        errs.email = 'Please enter a valid email address';
      }
    } else {
      if (cleanInput.length < 3) {
        errs.email = 'Callsign must be at least 3 characters';
      }
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    clearError();
    if (!validate()) return;

    const success = await signIn({
      email: email.trim().toLowerCase(),
      password,
    });

    if (success) {
      router.replace('/(tabs)/home');
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandLogo}>⚡</Text>
              <Text style={styles.brandText}>RIDEX</Text>
            </View>
            <Text style={styles.title}>WELCOME BACK</Text>
            <Text style={styles.subtitle}>Your next adventure is waiting</Text>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.serverErrorBox}>
                <Text style={styles.serverErrorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="EMAIL ADDRESS OR CALLSIGN"
              placeholder="e.g. rider@gmail.com or alex_turner"
              value={email}
              onChangeText={text => {
                setEmail(text);
                if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              error={formErrors.email}
              leftIcon={<Mail size={18} color={COLORS.text.secondary} />}
            />

            <PasswordInput
              label="PASSWORD"
              placeholder="••••••••"
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
              }}
              error={formErrors.password}
            />

            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <Button
              title="SIGN IN"
              onPress={handleLogin}
              variant="primary"
              size="lg"
              loading={isLoading}
              fullWidth
              rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
              style={styles.loginBtn}
            />
          </View>

          {/* Signup Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/signup')}>
              <Text style={styles.signupText}>CREATE ACCOUNT</Text>
            </TouchableOpacity>
          </View>

          {/* Onboarding Tour Link */}
          <TouchableOpacity
            style={{ alignItems: 'center', marginTop: SPACING.lg }}
            onPress={() => router.push('/onboarding' as any)}
          >
            <Text style={{ fontSize: 12, color: COLORS.text.muted, fontWeight: '700' }}>
              ✦ View Welcome Tour & Onboarding
            </Text>
          </TouchableOpacity>
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
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surfaceLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 31, 0.3)',
    marginBottom: SPACING.md,
    gap: 6,
  },
  brandLogo: {
    fontSize: 16,
  },
  brandText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 2,
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
    textAlign: 'center',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  loginBtn: {
    marginTop: SPACING.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: 6,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
  },
  signupText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.5,
  },
});
