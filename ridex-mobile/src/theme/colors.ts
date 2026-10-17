/**
 * RIDEX V2 Design System - Theme Colors
 * Dark Premium Motorcycle Interface
 */

export const colors = {
  // Backgrounds & Surfaces
  background: '#080A0F',
  surface: '#111722',
  surfaceCard: '#111722',
  surfaceElevated: '#172234',
  surfaceLight: '#20293D',
  surfaceGlass: 'rgba(17, 23, 34, 0.92)',
  surfaceGlassHeavy: 'rgba(8, 10, 15, 0.96)',

  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderCard: '#1A2234',
  borderActive: 'rgba(255, 107, 0, 0.7)',
  borderGold: 'rgba(255, 176, 32, 0.5)',
  borderCyan: 'rgba(0, 229, 255, 0.5)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#8E9BAE',
  textMuted: '#6B7280',
  textInverse: '#080A0F',

  // Brand Accents
  primary: '#FF6B00',          // RIDEX Apex Orange
  primaryBright: '#FF8533',
  primaryGlow: 'rgba(255, 107, 0, 0.35)',
  primaryMuted: 'rgba(255, 107, 0, 0.15)',

  accentGold: '#FFB020',       // Amber / Leader Gold
  accentGoldGlow: 'rgba(255, 176, 32, 0.35)',

  accentCyan: '#00E5FF',       // Telemetry / Radar Cyan
  accentCyanGlow: 'rgba(0, 229, 255, 0.3)',

  // Status Colors
  success: '#00E676',          // Live Connected Green
  successGlow: 'rgba(0, 230, 118, 0.35)',
  warning: '#FFB020',          // Warning Amber
  danger: '#FF3B30',           // SOS Crimson Red
  dangerMuted: 'rgba(255, 59, 48, 0.15)',
} as const;

export const COLORS = {
  background: {
    dark: '#080A0F',
    surface: '#111722',
    card: '#111722',
    surfaceCard: '#111722',
    surfaceLight: '#20293D',
    surfaceElevated: '#172234',
  },
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    card: '#1A2234',
    default: '#1A2234',
    active: 'rgba(255, 107, 0, 0.7)',
    cyan: 'rgba(0, 229, 255, 0.5)',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8E9BAE',
    muted: '#6B7280',
    inverse: '#080A0F',
  },
  primary: {
    DEFAULT: '#FF6B00',
    bright: '#FF8533',
    glow: 'rgba(255, 107, 0, 0.3)',
    muted: 'rgba(255, 107, 0, 0.15)',
  },
  accent: {
    gold: '#FFB020',
    goldGlow: 'rgba(255, 176, 32, 0.35)',
    telemetryCyan: '#00E5FF',
    telemetryCyanGlow: 'rgba(0, 229, 255, 0.3)',
  },
  status: {
    success: '#00E676',
    warning: '#FFB020',
    error: '#FF3B30',
    info: '#00E5FF',
  },
  danger: '#FF3B30',
  success: '#00E676',
  warning: '#FFB020',
} as const;

export type ColorName = keyof typeof colors;
