import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';
import { TYPOGRAPHY } from '@/theme/typography';
import { SPACING } from '@/theme/spacing';

export type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'telemetry';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  icon,
  style,
  textStyle,
  size = 'sm',
}) => {
  const getVariantStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return {
          bg: COLORS.primary.glow,
          text: COLORS.primary.DEFAULT,
          border: 'rgba(255, 107, 0, 0.4)',
        };
      case 'secondary':
        return {
          bg: 'rgba(0, 229, 255, 0.15)',
          text: '#00E5FF',
          border: 'rgba(0, 229, 255, 0.3)',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: COLORS.text.secondary,
          border: COLORS.border.subtle,
        };
      case 'success':
        return {
          bg: 'rgba(0, 230, 118, 0.15)',
          text: '#00E676',
          border: 'rgba(0, 230, 118, 0.3)',
        };
      case 'warning':
        return {
          bg: 'rgba(255, 176, 32, 0.15)',
          text: '#FFB020',
          border: 'rgba(255, 176, 32, 0.3)',
        };
      case 'error':
        return {
          bg: 'rgba(255, 59, 48, 0.15)',
          text: '#FF3B30',
          border: 'rgba(255, 59, 48, 0.3)',
        };
      case 'info':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          text: '#3B82F6',
          border: 'rgba(59, 130, 246, 0.3)',
        };
      case 'telemetry':
        return {
          bg: 'rgba(0, 229, 255, 0.15)',
          text: COLORS.accent.telemetryCyan,
          border: 'rgba(0, 229, 255, 0.3)',
        };
      case 'neutral':
      default:
        return {
          bg: COLORS.background.surfaceLight,
          text: COLORS.text.secondary,
          border: COLORS.border.subtle,
        };
    }
  };

  const vStyles = getVariantStyles();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vStyles.bg,
          borderColor: vStyles.border || 'transparent',
          borderWidth: vStyles.border ? 1 : 0,
          paddingVertical: isSm ? 2 : 4,
          paddingHorizontal: isSm ? SPACING.xs + 2 : SPACING.sm + 2,
        },
        style,
      ]}
    >
      {icon ? <View style={{ marginRight: 4 }}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          {
            color: vStyles.text,
            fontSize: isSm ? TYPOGRAPHY.fontSize.xs : TYPOGRAPHY.fontSize.sm,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
