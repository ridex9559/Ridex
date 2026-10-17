/**
 * RIDEX Design System - Typography
 */

export const typography = {
  fontFamily: {
    sans: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    heavy: '800' as const,
    black: '900' as const,
  },
} as const;

export const TYPOGRAPHY = typography;
