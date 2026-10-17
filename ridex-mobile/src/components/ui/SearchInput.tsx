import React from 'react';
import { View, TextInput as RNTextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: any;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search rides, routes, or riders...',
  onClear,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Search size={18} color={COLORS.text.muted} style={styles.searchIcon} />
      <RNTextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <X size={14} color={COLORS.text.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.surfaceCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border.card,
    paddingHorizontal: SPACING.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
