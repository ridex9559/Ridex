import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          style={styles.button}
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
    minHeight: 240,
  },
  iconContainer: {
    marginBottom: SPACING.md,
    opacity: 0.85,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  button: {
    minWidth: 160,
  },
});
