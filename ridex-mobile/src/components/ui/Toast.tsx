import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react-native';
import { COLORS } from '@/theme/colors';
import { RADIUS } from '@/theme/radius';
import { SPACING } from '@/theme/spacing';

interface ToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  visible?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible = true,
}) => {
  if (!visible || !message) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={16} color="#00E676" />,
          bg: 'rgba(0, 230, 118, 0.15)',
          border: 'rgba(0, 230, 118, 0.4)',
          textColor: '#00E676',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={16} color="#FFB020" />,
          bg: 'rgba(255, 176, 32, 0.15)',
          border: 'rgba(255, 176, 32, 0.4)',
          textColor: '#FFB020',
        };
      case 'error':
        return {
          icon: <XCircle size={16} color="#FF3B30" />,
          bg: 'rgba(255, 59, 48, 0.15)',
          border: 'rgba(255, 59, 48, 0.4)',
          textColor: '#FF3B30',
        };
      case 'info':
      default:
        return {
          icon: <Info size={16} color="#00E5FF" />,
          bg: 'rgba(0, 229, 255, 0.15)',
          border: 'rgba(0, 229, 255, 0.4)',
          textColor: '#00E5FF',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      {config.icon}
      <Text style={[styles.text, { color: config.textColor }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
});
