/**
 * Design System — "Soft Modern" (Warm & Professional)
 * Single source of truth for colors, typography, spacing, radius, shadows, animation.
 *
 * Theme: antique-white app background (#FAEBD7), dark cocoa accent (#1E1209),
 * orange CTA (#F77051), soft red (negative), success green (#10B981).
 * Shapes: extra-rounded corners (up to 48px), soft shadows everywhere.
 * Type: Poppins = primary UI, Playfair Display = big headlines, Inter = small body text.
 */

// ============================================================
// COLOR TOKENS
// ============================================================

export const Colors = {
  // Brand — Warm Soft Modern
  brand: {
    primary: '#1E1209',           // Main accent: dark cocoa — main buttons, headings, active icons
    primaryPressed: '#120B05',    // darker pressed state
    primaryDeep: '#1E1209',       // @deprecated alias kept for compatibility
    accent: '#F77051',            // Accent orange: CTA, progress bars, nav bar, main cards
    accentSoft: '#FFE0D6',        // orange soft tint
    accentPressed: '#E25A3C',     // orange pressed state
    coral: '#F77051',             // @deprecated alias → accent orange
    secondary: '#F77051',         // @deprecated alias → accent orange
  },

  // Surfaces — antique white + cream + white cards
  surface: {
    primary: '#FAEBD7',           // app background (antique white)
    secondary: '#FFFFFF',         // white card surface
    tertiary: '#F5E3CB',          // deeper cream — chips, inactive fills
    elevated: '#FFFFFF',          // elevated cards
    creamSoft: '#FDF3E3',         // soft cream panel (between bg and white)
  },

  // Text — warm dark family on cream
  text: {
    primary: '#1E1209',           // main headings / strong text
    secondary: '#6B5443',         // warm brown-gray
    muted: '#A08A77',             // soft taupe
    inverse: '#FFFFFF',
    accent: '#F77051',            // orange text accent
  },

  // Semantic
  semantic: {
    success: '#10B981',           // done / complete / paid / approved
    successSoft: '#D8F3E5',
    warning: '#E8963C',
    warningSoft: '#FBEBD2',
    error: '#E5484D',             // soft red — alerts, logout, delete, cancel
    errorSoft: '#FBE3E4',
    info: '#3D7BD9',
    infoSoft: '#DFEAF9',
  },

  // Dark mode (warm charcoal — kept functional, app ships light-first)
  dark: {
    surface: {
      primary: '#1E1209',
      secondary: '#2A1B10',
      tertiary: '#382515',
      elevated: '#2A1B10',
    },
    text: {
      primary: '#F7EDE2',
      secondary: '#C9AF98',
      muted: '#8A7260',
      inverse: '#1E1209',
    },
  },

  // Borders — warm cream borders
  border: {
    light: '#F0E1CC',
    medium: '#E3CCA9',
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
// BORDER RADIUS — Soft Modern: extra rounded (3rem = 48px max)
// ============================================================

export const BorderRadius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,                    // hero cards / main boxes — signature soft-modern curve
  pill: 999,
  full: 999,
} as const;

// ============================================================
// TYPOGRAPHY
// Poppins = primary (--font-sans): text, buttons, navigation
// Playfair Display = onboarding-headline: large headlines
// Inter = onboarding-body: small readable body text
// ============================================================

export const Typography = {
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    // Large headlines (Playfair Display)
    display: 'PlayfairDisplay_700Bold',
    displayMedium: 'PlayfairDisplay_600SemiBold',
    // Small body text (Inter) — readability on mobile
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
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
    display: 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    relaxedLarge: 1.8,
  },
} as const;

// ============================================================
// SHADOWS — soft, warm, wide (shadow-2xl feel)
// ============================================================

export const Shadows = {
  card: {
    shadowColor: '#1E1209',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 6,
  },
  cardPressed: {
    shadowColor: '#1E1209',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#1E1209',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 34,
    elevation: 9,
  },
  button: {
    shadowColor: '#1E1209',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 6,
  },
  buttonOrange: {
    shadowColor: '#F77051',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 7,
  },
  floating: {
    shadowColor: '#1E1209',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
    elevation: 12,
  },
} as const;

// ============================================================
// ANIMATIONS — spring tokens (Reanimated / Moti)
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
  tabBarHeight: 76,
  screenHorizontalPadding: Spacing[5],
} as const;

export default { Colors, Spacing, BorderRadius, Typography, Shadows, Elevation, Layout };
