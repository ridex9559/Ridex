# RIDEX V3 — ADVENTURE COCKPIT UI DESIGN SYSTEM

**Document Identifier:** `RIDEX-ENG-DOC-005`  
**Version:** `3.0.0-PROD`  
**Date:** September 2026  
**Status:** AUTHORITATIVE DESIGN SYSTEM  
**Author:** RIDEX Mobile UI/UX & Design Systems Team

---

## 1. Design Philosophy: The Premium Adventure Cockpit

RIDEX is engineered specifically for motorcycle touring enthusiasts. The design evokes the digital instrumentation and telemetry consoles of high-performance adventure touring motorcycles (e.g. BMW R1250GS, Ducati Multistrada V4, KTM 1290 Super Adventure).

### Visual Pillars
1. **Deep Obsidian Surfaces:** Pure dark backgrounds (`#080A0F`, `#121722`) reduce battery consumption on OLED displays and eliminate glare in bright daylight riding conditions.
2. **High-Contrast Telemetry Accents:**
   - **Racing Orange (`#FF6B00`):** Primary brand accent, call-to-action buttons, active route polylines.
   - **Telemetry Cyan (`#00E5FF`):** Live radar indicators, speed metrics, heading compasses, and GPS beacons.
   - **Leader Amber Gold (`#FFB020`):** Road captain designations, verified group leaders, checkpoint pins.
   - **Safety Emerald (`#00E676`):** Active real-time connected states, healthy battery indicators.
   - **Incident Crimson (`#FF3B30`):** SOS panic alerts, rider separation warnings, fuel exhaustion warnings.
3. **Gloved Touch Usability:** Large touch targets (minimum $48 \times 48\text{px}$) with prominent haptic feedback and clear visual active states.
4. **Information Hierarchy:** High-density telemetry balanced with clear typography, eliminating generic template clutter.

---

## 2. Design Tokens Reference

### A. Color Palette (`src/theme/colors.ts`)
```typescript
export const colors = {
  // Backgrounds & Canvas
  background: '#080A0F',
  surface: '#121722',
  surfaceCard: '#1A2234',
  surfaceElevated: '#20293D',
  surfaceLight: '#2A344C',
  surfaceGlass: 'rgba(18, 23, 34, 0.88)',

  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderCard: '#243048',
  borderActive: 'rgba(255, 107, 0, 0.6)',
  borderGold: 'rgba(255, 176, 32, 0.4)',

  // Typography
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A7B4',
  textMuted: '#6B7280',
  textInverse: '#080A0F',

  // Brand Accents
  primary: '#FF6B00',
  primaryBright: '#FF8533',
  primaryGlow: 'rgba(255, 107, 0, 0.35)',

  // Status & Telemetry
  accentCyan: '#00E5FF',
  accentGold: '#FFB020',
  success: '#00E676',
  warning: '#FFB020',
  danger: '#FF3B30',
};
```

### B. Spacing System (`src/theme/spacing.ts`)
- `xs: 4px`
- `sm: 8px`
- `md: 16px`
- `lg: 24px`
- `xl: 32px`
- `xxl: 48px`

### C. Corner Radii (`src/theme/radius.ts`)
- `xs: 4px` (Badges, small status pills)
- `sm: 8px` (Buttons, chip selectors)
- `md: 12px` (Cards, dialogs, inputs)
- `lg: 16px` (Cockpit bottom sheets, modals)
- `full: 9999px` (Rider avatars, circular floating buttons)

---

## 3. Reusable Adventure Cockpit Components

| Component | Path | Function & Variants |
|:---|:---|:---|
| **AppHeader** | `src/components/ui/AppHeader.tsx` | Cockpit navigation header with back action, title, subtitle, and right-hand telemetry/action slots. |
| **PrimaryButton** | `src/components/ui/Button.tsx` | High-impact action button with orange glow, loading spinner, and disabled states. |
| **SecondaryButton** | `src/components/ui/Button.tsx` | Ghost/bordered button with slate surface and subtle border. |
| **IconButton** | `src/components/ui/IconButton.tsx` | Circular action trigger with haptic feedback. |
| **AppCard** | `src/components/ui/Card.tsx` | Obsidian surface card with subtle border and optional glow or press action. |
| **TextInput** | `src/components/ui/Input.tsx` | Dark form input with label, helper text, error state, and icon prefixes. |
| **SearchInput** | `src/components/ui/SearchInput.tsx` | Rounded search bar with clear button and debounced query callback. |
| **StatusBadge** | `src/components/ui/Badge.tsx` | Colored pill for ride status (`LIVE`, `DRAFT`, `UPCOMING`, `COMPLETED`, `SEPARATED`). |
| **RiderAvatar** | `src/components/ui/RiderAvatar.tsx` | Circular avatar with initials fallback and colored live status ring. |
| **RideCard** | `src/components/rides/RideCard.tsx` | Comprehensive tour card showing title, route, date, rider count, and host info. |
| **LoadingState** | `src/components/ui/LoadingState.tsx` | Adventure telemetry loading spinner with contextual status message. |
| **EmptyState** | `src/components/ui/EmptyState.tsx` | Icon, headline, and call-to-action for zero-item states. |
| **ErrorState** | `src/components/ui/ErrorState.tsx` | High-contrast error message with retry action. |
| **ConfirmationModal** | `src/components/ui/ConfirmationModal.tsx` | Destructive/critical confirmation modal with cancel and confirm actions. |
| **BottomSheet** | `src/components/ui/BottomSheet.tsx` | Sliding bottom drawer for Intercom, squad roster, and quick actions. |
| **Toast** | `src/components/ui/Toast.tsx` | Non-intrusive HUD notification banner. |
| **SkeletonLoader** | `src/components/ui/SkeletonLoader.tsx` | Shimmer placeholder for async data loading. |
| **ConnectionIndicator** | `src/components/ui/ConnectionIndicator.tsx` | Live GPS/WebSocket heartbeat indicator. |
| **NetworkStatusIndicator** | `src/components/ui/NetworkStatusIndicator.tsx` | Offline / online connectivity banner. |
