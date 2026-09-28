/**
 * Theme Context - Theme management with NativeWind v4
 * Supports light, dark, and system themes with persistence
 */

import React, { createContext, useContext, useEffect, useCallback, useMemo, useState } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { useUIStore } from '@/store/uiStore';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: storedTheme, setTheme: setStoredTheme, fontSize, setFontSize } = useUIStore();
  const systemColorScheme = useColorScheme();

  // Resolve theme purely during render (no effect-setState needed)
  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (storedTheme === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return storedTheme;
  }, [storedTheme, systemColorScheme]);

  // Keep the DOM (web) & NativeWind theme classes in sync as a side effect
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolvedTheme);
    }
    if (typeof window !== 'undefined' && (window as any).__NEXT_THEME__) {
      (window as any).__NEXT_THEME__.setTheme(resolvedTheme);
    }
  }, [resolvedTheme]);

  // Listen to system theme changes (hook ordering/derivation handles the rest)
  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      // systemColorScheme updates trigger the useMemo above
    });
    return () => subscription?.remove();
  }, [storedTheme]);

  // Set theme mode
  const setTheme = useCallback((mode: ThemeMode) => {
    setStoredTheme(mode);
  }, [setStoredTheme]);

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Font size helpers
  const increaseFontSize = useCallback(() => {
    const order: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const idx = Math.max(0, order.indexOf(fontSize));
    setFontSize(order[Math.min(idx + 1, order.length - 1)]);
  }, [fontSize, setFontSize]);

  const decreaseFontSize = useCallback(() => {
    const order: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];
    const idx = Math.max(0, order.indexOf(fontSize));
    setFontSize(order[Math.max(idx - 1, 0)]);
  }, [fontSize, setFontSize]);

  const resetFontSize = useCallback(() => {
    setFontSize('medium');
  }, [setFontSize]);

  const value: ThemeContextType = {
    theme: storedTheme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for font size management
const FONT_SIZE_ORDER = ['small', 'medium', 'large'] as const;
type FontSizeName = (typeof FONT_SIZE_ORDER)[number];
const FONT_SIZE_SCALE: Record<FontSizeName, number> = { small: 0.9, medium: 1, large: 1.1 };

export function useFontSize() {
  const { fontSize, setFontSize } = useUIStore();

  const index = Math.max(0, FONT_SIZE_ORDER.indexOf(fontSize));

  return {
    fontSize,
    setFontSize,
    increaseFontSize: () => setFontSize(FONT_SIZE_ORDER[Math.min(index + 1, FONT_SIZE_ORDER.length - 1)]),
    decreaseFontSize: () => setFontSize(FONT_SIZE_ORDER[Math.max(index - 1, 0)]),
    resetFontSize: () => setFontSize('medium'),
    // Scale factors for different sizes
    scale: FONT_SIZE_SCALE[fontSize],
  };
}

// Theme-aware style helpers
export const useThemedStyles = <T extends Record<string, any>>(
  lightStyles: T,
  darkStyles: T
): T => {
  const { isDark } = useTheme();
  return isDark ? darkStyles : lightStyles;
};

// Color scheme hook for components that need direct access
export function useColorSchemeValue<T>(light: T, dark: T): T {
  const { isDark } = useTheme();
  return isDark ? dark : light;
}
