/**
 * Branded RIDEX Authentication Loading Screen
 * Shown while checking and restoring persistent session
 */

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';

interface AuthLoadingScreenProps {
  message?: string;
}

export const AuthLoadingScreen: React.FC<AuthLoadingScreenProps> = ({
  message = 'Preparing your ride...',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandWrapper}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={styles.title}>RIDEX</Text>
        <Text style={styles.subtitle}>MOTORCYCLE ADVENTURE</Text>
      </View>

      <View style={styles.loaderWrapper}>
        <ActivityIndicator size="small" color={COLORS.primary.DEFAULT} />
        <Text style={styles.statusText}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  brandWrapper: {
    alignItems: 'center',
    marginTop: 140,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: COLORS.background.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary.DEFAULT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: SPACING.md,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: '900',
    color: COLORS.text.primary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
    letterSpacing: 2,
    marginTop: SPACING.xs,
  },
  loaderWrapper: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});

export default AuthLoadingScreen;
