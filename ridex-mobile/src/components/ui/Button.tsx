import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: COLORS.primary.DEFAULT,
            shadowColor: COLORS.primary.DEFAULT,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
          },
          text: {
            color: COLORS.text.primary,
            fontWeight: '700',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: COLORS.background.surfaceLight,
            borderWidth: 1,
            borderColor: COLORS.border.subtle,
          },
          text: {
            color: COLORS.text.primary,
            fontWeight: '600',
          },
        };
      case 'glass':
        return {
          container: {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
          text: {
            color: COLORS.text.primary,
            fontWeight: '600',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: COLORS.primary.DEFAULT,
          },
          text: {
            color: COLORS.primary.DEFAULT,
            fontWeight: '600',
          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: COLORS.status.error,
          },
          text: {
            color: COLORS.text.primary,
            fontWeight: '700',
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: COLORS.text.secondary,
            fontWeight: '600',
          },
        };
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: SPACING.xs + 2,
            paddingHorizontal: SPACING.md,
            borderRadius: RADIUS.md,
          },
          text: {
            fontSize: TYPOGRAPHY.fontSize.sm,
          },
        };
      case 'lg':
        return {
          container: {
            paddingVertical: SPACING.lg,
            paddingHorizontal: SPACING.xl,
            borderRadius: RADIUS.lg,
          },
          text: {
            fontSize: TYPOGRAPHY.fontSize.lg,
          },
        };
      case 'md':
      default:
        return {
          container: {
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            borderRadius: RADIUS.md,
          },
          text: {
            fontSize: TYPOGRAPHY.fontSize.base,
          },
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text.color || COLORS.text.primary} size="small" />
      ) : (
        <>
          {leftIcon ? <>{leftIcon}</> : null}
          <Text
            style={[
              styles.textBase,
              variantStyle.text,
              sizeStyle.text,
              leftIcon ? { marginLeft: SPACING.sm } : undefined,
              rightIcon ? { marginRight: SPACING.sm } : undefined,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <>{rightIcon}</> : null}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  textBase: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
