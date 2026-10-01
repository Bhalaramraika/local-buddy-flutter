/**
 * Design System Constants
 * Based on Design.md specifications
 */

// Brand Colors
export const Colors = {
  // Brand Colors
  brand: {
    primary: '#4F46E5',    // Indigo-600
    secondary: '#06B6D4',  // Cyan-500
    accent: '#F97316',     // Orange-500 (welcome/login CTA)
    accentPressed: '#EA580C',
  },
  
  // Surface Colors
  surface: {
    primary: '#F8FAFC',    // Slate-50
    secondary: '#FFFFFF',  // White
    elevated: '#F1F5F9',   // Slate-100
  },
  
  // Semantic Colors
  semantic: {
    success: '#10B981',    // Emerald-500
    warning: '#F59E0B',    // Amber-500
    error: '#EF4444',      // Red-500
    info: '#3B82F6',       // Blue-500
  },
  
  // Text Colors
  text: {
    primary: '#0F172A',    // Slate-900
    secondary: '#475569',  // Slate-600
    muted: '#94A3B8',      // Slate-400
    inverse: '#FFFFFF',    // White
  },
  
  // Border Colors
  border: {
    light: '#E2E8F0',      // Slate-200
    medium: '#CBD5E1',     // Slate-300
    dark: '#94A3B8',       // Slate-400
  },
  
  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)', // Slate-900/50
  
  // Status specific
  status: {
    open: '#3B82F6',       // Blue-500
    assigned: '#8B5CF6',   // Violet-500
    in_progress: '#F59E0B', // Amber-500
    completed: '#10B981',  // Emerald-500
    cancelled: '#EF4444',  // Red-500
    disputed: '#F97316',   // Orange-500
  },
  
  // Role specific
  role: {
    poster: '#4F46E5',     // Indigo-600
    buddy: '#06B6D4',      // Cyan-500
  },
} as const;

// Spacing Scale (4px base)
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
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Border Radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// Typography
export const Typography = {
  fontFamily: {
    sans: 'Inter',
    heading: 'Inter',
  },
  
  fontSize: {
    'display-lg': 48,
    'display-md': 36,
    'display-sm': 28,
    'heading-lg': 24,
    'heading-md': 20,
    'heading-sm': 18,
    'body-lg': 16,
    'body-md': 14,
    'body-sm': 12,
    'label-lg': 14,
    'label-md': 12,
    'caption': 11,
  },
  
  lineHeight: {
    'display-lg': 56,
    'display-md': 44,
    'display-sm': 36,
    'heading-lg': 32,
    'heading-md': 28,
    'heading-sm': 24,
    'body-lg': 24,
    'body-md': 20,
    'body-sm': 16,
    'label-lg': 20,
    'label-md': 16,
    'caption': 14,
  },
  
  fontWeight: {
    regular: '400',
    medium: '500',
    semiBold: '600',
    bold: '700',
  },
  
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.01em',
  },
} as const;

// Shadows
export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  'card-hover': {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  modal: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 24,
  },
} as const;

// Animation Durations
export const Animation = {
  duration: {
    fast: 150,
    normal: 200,
    medium: 300,
    slow: 500,
  },
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
  },
} as const;

// Breakpoints (for reference, RN doesn't use CSS breakpoints)
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Z-Index Scale
export const ZIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

// Screen Padding
export const ScreenPadding = {
  horizontal: 16,
  vertical: 16,
} as const;

// Icon Sizes
export const IconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
} as const;

// Avatar Sizes
export const AvatarSize = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72,
  '2xl': 96,
} as const;

// Input Heights
export const InputHeight = {
  sm: 40,
  md: 48,
  lg: 56,
} as const;

// Button Heights
export const ButtonHeight = {
  sm: 40,
  md: 48,
  lg: 56,
} as const;