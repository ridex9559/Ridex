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
import { Mail, User as UserIcon, Bike, ArrowRight, ArrowLeft, AtSign } from 'lucide-react-native';
import { Input, Button } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuth();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [motorcycle, setMotorcycle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const errs: typeof formErrors = {};
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    if (!cleanUsername) {
      errs.username = 'Callsign / username is required';
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      errs.username = 'Username must be 3-30 chars (letters, numbers, underscores)';
    }

    if (!cleanEmail) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async () => {
    clearError();
    if (!validate()) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    const success = await signUp({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      confirmPassword,
      primaryBike: motorcycle.trim() || undefined,
    });

    if (success) {
      router.replace('/auth/profile-setup' as any);
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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>CREATE ACCOUNT</Text>
            <Text style={styles.subtitle}>Join the global RIDEX motorcycle adventure community</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {error ? (
              <View style={styles.serverErrorBox}>
                <Text style={styles.serverErrorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="FULL NAME"
              placeholder="e.g. Alex Turner"
              value={name}
              onChangeText={text => {
                setName(text);
                if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
              }}
              error={formErrors.name}
              leftIcon={<UserIcon size={18} color={COLORS.text.secondary} />}
            />

            <Input
              label="CALLSIGN / USERNAME"
              placeholder="e.g. alex_turner"
              value={username}
              onChangeText={text => {
                setUsername(text);
                if (formErrors.username) setFormErrors({ ...formErrors, username: undefined });
              }}
              autoCapitalize="none"
              autoCorrect={false}
              error={formErrors.username}
              leftIcon={<AtSign size={18} color={COLORS.text.secondary} />}
              hint="Unique handle visible to other riders on the road"
            />

            <Input
              label="EMAIL ADDRESS"
              placeholder="rider@ridex.app"
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

            <PasswordInput
              label="CONFIRM PASSWORD"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: undefined });
              }}
              error={formErrors.confirmPassword}
            />

            <Input
              label="PRIMARY MOTORCYCLE (OPTIONAL)"
              placeholder="e.g. BMW R 1250 GS / RE Himalayan"
              value={motorcycle}
              onChangeText={setMotorcycle}
              leftIcon={<Bike size={18} color={COLORS.text.secondary} />}
              hint="You can add more bikes to your garage anytime"
            />

            <Button
              title="CREATE ACCOUNT"
              onPress={handleSignup}
              variant="primary"
              size="lg"
              loading={isLoading}
              fullWidth
              rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
              style={styles.submitBtn}
            />
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginText}>SIGN IN</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: SPACING.md,
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
  loginText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '800',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 0.5,
  },
});
