import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  hint,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}
        
        <TextInput
          placeholderTextColor={COLORS.text.muted}
          style={[styles.input, inputStyle]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={COLORS.primary.DEFAULT}
          {...rest}
        />

        {rightIcon ? <View style={styles.iconContainer}>{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
    width: '100%',
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surfaceLight,
    borderRadius: RADIUS.md,
    borderWidth: 1.2,
    borderColor: COLORS.border.subtle,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: COLORS.primary.DEFAULT,
    backgroundColor: COLORS.background.surface,
  },
  inputError: {
    borderColor: COLORS.status.error,
  },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    paddingVertical: SPACING.sm,
  },
  iconContainer: {
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.status.error,
    marginTop: 4,
    fontWeight: '500',
  },
  hintText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.muted,
    marginTop: 4,
  },
});
