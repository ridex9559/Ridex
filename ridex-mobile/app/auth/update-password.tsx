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
import { KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { Button, Card } from '@/components/ui';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { useAuth } from '@/hooks/useAuth';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { RADIUS } from '@/theme/radius';

export default function UpdatePasswordScreen() {
  const router = useRouter();
  const { updatePassword, isLoading, error, clearError } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [isUpdated, setIsUpdated] = useState(false);

  const validate = () => {
    const errs: typeof formErrors = {};
    if (!newPassword) {
      errs.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      errs.newPassword = 'Password must be at least 6 characters';
    }

    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleUpdatePassword = async () => {
    clearError();
    if (!validate()) return;

    const success = await updatePassword({
      newPassword,
      confirmPassword,
    });

    if (success) {
      setIsUpdated(true);
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
            onPress={() => router.replace('/auth/login')}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={COLORS.text.secondary} />
          </TouchableOpacity>

          {!isUpdated ? (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconHeader}>
                  <KeyRound size={32} color={COLORS.primary.DEFAULT} />
                </View>
                <Text style={styles.title}>NEW PASSWORD</Text>
                <Text style={styles.subtitle}>
                  Create a secure new password for your RIDEX account
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {error ? (
                  <View style={styles.serverErrorBox}>
                    <Text style={styles.serverErrorText}>{error}</Text>
                  </View>
                ) : null}

                <PasswordInput
                  label="NEW PASSWORD"
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={text => {
                    setNewPassword(text);
                    if (formErrors.newPassword) setFormErrors({ ...formErrors, newPassword: undefined });
                  }}
                  error={formErrors.newPassword}
                  hint="Must be at least 6 characters"
                />

                <PasswordInput
                  label="CONFIRM NEW PASSWORD"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={text => {
                    setConfirmPassword(text);
                    if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: undefined });
                  }}
                  error={formErrors.confirmPassword}
                />

                <Button
                  title="UPDATE PASSWORD"
                  onPress={handleUpdatePassword}
                  variant="primary"
                  size="lg"
                  loading={isLoading}
                  fullWidth
                  rightIcon={<ArrowRight size={20} color="#FFFFFF" />}
                  style={styles.submitBtn}
                />
              </View>
            </>
          ) : (
            /* Success State */
            <Card variant="glass" style={styles.successCard}>
              <View style={styles.successBadge}>
                <CheckCircle2 size={40} color={COLORS.status.success} />
              </View>
              <Text style={styles.successTitle}>PASSWORD UPDATED</Text>
              <Text style={styles.successDesc}>
                Your account password has been updated securely. You can now sign in with your new credentials.
              </Text>
              <Button
                title="SIGN IN NOW"
                onPress={() => router.replace('/auth/login')}
                variant="primary"
                size="md"
                fullWidth
              />
            </Card>
          )}
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
    marginBottom: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  iconHeader: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 90, 31, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
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
  successBadge: {
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
});
