import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Radio, Wifi, WifiOff } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';

interface ConnectionIndicatorProps {
  status: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
  label?: string;
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  status,
  label,
}) => {
  const getConfig = () => {
    switch (status) {
      case 'CONNECTED':
        return {
          color: '#00E676',
          bg: 'rgba(0, 230, 118, 0.15)',
          border: 'rgba(0, 230, 118, 0.4)',
          text: label || 'RADAR ONLINE',
          icon: <Radio size={12} color="#00E676" />,
        };
      case 'RECONNECTING':
        return {
          color: '#FFB020',
          bg: 'rgba(255, 176, 32, 0.15)',
          border: 'rgba(255, 176, 32, 0.4)',
          text: label || 'RECONNECTING...',
          icon: <Wifi size={12} color="#FFB020" />,
        };
      case 'OFFLINE':
      default:
        return {
          color: '#FF3B30',
          bg: 'rgba(255, 59, 48, 0.15)',
          border: 'rgba(255, 59, 48, 0.4)',
          text: label || 'OFFLINE',
          icon: <WifiOff size={12} color="#FF3B30" />,
        };
    }
  };

  const config = getConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      {config.icon}
      <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
