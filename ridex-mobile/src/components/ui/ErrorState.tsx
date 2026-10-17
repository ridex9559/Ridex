import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryTitle?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something Went Wrong',
  message = 'Failed to load telemetry data. Please check your connection.',
  onRetry,
  retryTitle = 'Try Again',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <AlertTriangle size={36} color={COLORS.status.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Button
          title={retryTitle}
          onPress={onRetry}
          variant="secondary"
          style={styles.btn}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    minHeight: 260,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  btn: {
    minWidth: 140,
  },
});
