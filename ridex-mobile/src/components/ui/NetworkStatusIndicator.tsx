import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { SPACING } from '@/theme/spacing';

interface NetworkStatusIndicatorProps {
  isConnected?: boolean;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  isConnected = true,
}) => {
  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <WifiOff size={14} color="#FFFFFF" />
      <Text style={styles.text}>NO INTERNET CONNECTION • OFFLINE CACHE ACTIVE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    gap: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
