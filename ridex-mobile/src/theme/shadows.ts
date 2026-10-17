/**
 * RIDEX Design System - Shadows and Glows
 */

import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  } as ViewStyle,

  glowPrimary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  } as ViewStyle,

  glowGold: {
    shadowColor: colors.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,

  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 16,
  } as ViewStyle,
};
