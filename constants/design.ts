/**
 * Design System - Soft Premium
 * One source of truth for colors, typography, spacing, radius, shadows, animation.
 */

// ============================================================
// COLOR TOKENS
// ============================================================

export const Colors = {
  // Brand (Soft Lavender family)
  brand: {
    primary: '#8B85FF',
    primaryPressed: '#5750C8',
    primaryDeep: '#5750C8',       // @deprecated alias kept for compatibility
    accent: '#FF8FAB',
    accentSoft: '#FFD6E0',
    accentPressed: '#F96E93',     // pressed hover state
    coral: '#FF6B35',
    secondary: '#06B6D4',         // @deprecated alias kept for compat
  },

  // Surfaces
  surface: {
    primary: '#FAF9F7',
    secondary: '#FFFFFF',
    tertiary: '#F0EFF7',
    elevated: '#FFFFFF',
  },

  // Text
  text: {
    primary: '#1E1B2E',
    secondary: '#6B6880',
    muted: '#A8A5BC',
    inverse: '#FFFFFF',
  },

  // Semantic
  semantic: {
    success: '#4ADE80',
    successSoft: '#DCFCE7',
    warning: '#FBBF24',
    warningSoft: '#FEF3C7',
    error: '#F43F5E',
    errorSoft: '#FEE2E2',
    info: '#60A5FA',
    infoSoft: '#DBEAFE',
  },

  // Dark mode (pure night)
  dark: {
    surface: {
      primary: '#0D0D1A',
      secondary: '#16162A',
      tertiary: '#1F1F3A',
      elevated: '#1C1C33',
    },
    text: {
      primary: '#F0EFFA',
      secondary: '#9E9BB8',
      muted: '#6B6880',
      inverse: '#1E1B2E',
    },
  },

  // Kitchen tools (used across components)
  border: {
    light: '#E9E6F5',
    medium: '#D4D0EC',
  },
};

// ============================================================
// SPACING — 4 base, tight to airy scale (px)
// ============================================================

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ============================================================
// BORDER RADIUS — Soft-first, all round
// ============================================================

export const BorderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 26,
  '2xl': 32,
  pill: 999,
  full: 999,
} as const;

// ============================================================
// TYPOGRAPHY — Inter only
// ============================================================

export const Typography = {
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 26,
    '4xl': 30,
    '5xl': 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    relaxedLarge: 1.8,
  },
} as const;

// ============================================================
// SHADOWS — soft, wide, low opacity
// ============================================================

export const Shadows = {
  card: {
    shadowColor: '#B0A8FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  cardPressed: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#B0A8FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  button: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  floating: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },
} as const;

// ============================================================
// ANIMATIONS — spring-based tokens for Reanimated
// ============================================================

export const Animation = {
  spring: { damping: 15, stiffness: 150 },
  gentle: { damping: 20, stiffness: 100 },
  snappy: { damping: 14, stiffness: 220 },
  slow: { damping: 22, stiffness: 80 },
  pulse: { damping: 12, stiffness: 400 },
} as const;

// ============================================================
// ELEVATION alias (Android)
// ============================================================

export const Elevation = Shadows;

// ============================================================
// Breakpoints / layout
// ============================================================

export const Layout = {
  minTouchTarget: 44,
  tabBarHeight: 72,
  screenHorizontalPadding: Spacing[5],
} as const;

export default { Colors, Spacing, BorderRadius, Typography, Shadows, Elevation, Layout };
