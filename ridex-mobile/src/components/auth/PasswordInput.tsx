/**
 * Reusable Password Input with Visibility Toggle (Eye / EyeOff)
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { TYPOGRAPHY } from '@/theme/typography';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

interface PasswordInputProps extends Omit<TextInputProps, 'secureTextEntry'> {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label = 'PASSWORD',
  error,
  hint,
  containerStyle,
  inputStyle,
  placeholder = '••••••••',
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
        <View style={styles.leftIcon}>
          <Lock size={18} color={COLORS.text.secondary} />
        </View>

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.muted}
          style={[styles.input, inputStyle]}
          secureTextEntry={!isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={COLORS.primary.DEFAULT}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          {...rest}
        />

        <TouchableOpacity
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {isPasswordVisible ? (
            <EyeOff size={18} color={COLORS.primary.DEFAULT} />
          ) : (
            <Eye size={18} color={COLORS.text.secondary} />
          )}
        </TouchableOpacity>
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
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.5,
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
  leftIcon: {
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeBtn: {
    padding: SPACING.xs,
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

export default PasswordInput;
