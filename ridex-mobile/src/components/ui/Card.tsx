import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Pressable } from 'react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'outline' | 'glass';
  onPress?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'elevated',
  onPress,
  padding = 'md',
}) => {
  const getPaddingStyle = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: SPACING.sm };
      case 'lg':
        return { padding: SPACING.lg };
      case 'md':
      default:
        return { padding: SPACING.md };
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'flat':
        return {
          backgroundColor: COLORS.background.surface,
        };
      case 'outline':
        return {
          backgroundColor: COLORS.background.surface,
          borderWidth: 1,
          borderColor: COLORS.border.subtle,
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(24, 24, 27, 0.75)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.08)',
        };
      case 'elevated':
      default:
        return {
          backgroundColor: COLORS.background.surface,
          borderWidth: 1,
          borderColor: COLORS.border.subtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        };
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          getVariantStyle(),
          getPaddingStyle(),
          pressed && styles.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), getPaddingStyle(), style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
