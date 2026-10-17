import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading telemetry...',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
      {message ? <Text style={styles.text}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.background.dark,
  },
  text: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    letterSpacing: 0.5,
  },
});
