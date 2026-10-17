import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/theme/colors';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  hasStory?: boolean;
  isOnline?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = 'Rider',
  size = 48,
  hasStory = false,
  isOnline = false,
  style,
}) => {
  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const innerSize = hasStory ? size - 6 : size;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {hasStory && (
        <View
          style={[
            styles.storyRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: COLORS.primary.DEFAULT,
            },
          ]}
        />
      )}

      <View
        style={[
          styles.avatarBody,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: COLORS.background.surfaceLight,
          },
        ]}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.initialsText, { fontSize: innerSize * 0.38 }]}>
            {getInitials(name)}
          </Text>
        )}
      </View>

      {isOnline && (
        <View
          style={[
            styles.onlineBadge,
            {
              width: Math.max(10, size * 0.25),
              height: Math.max(10, size * 0.25),
              borderRadius: size * 0.125,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  storyRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  avatarBody: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border.subtle,
  },
  initialsText: {
    fontWeight: '700',
    color: COLORS.primary.DEFAULT,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.status.success,
    borderWidth: 2,
    borderColor: COLORS.background.dark,
  },
});
