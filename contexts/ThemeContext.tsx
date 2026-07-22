/**
 * Theme Context - Theme management with NativeWind v4
 * Supports light, dark, and system themes with persistence
 */

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
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

const THEME_STORAGE_KEY = 'app-theme-mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: storedTheme, setTheme: setStoredTheme, fontSize, setFontSize } = useUIStore();
  const systemColorScheme = useColorScheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);

  // Resolve theme based on mode and system preference
  const resolveTheme = useCallback((mode: ThemeMode): 'light' | 'dark' => {
    if (mode === 'system') {
      return systemColorScheme || 'light';
    }
    return mode;
  }, [systemColorScheme]);

  // Apply theme to document (for web) and update state
  const applyTheme = useCallback((mode: ThemeMode) => {
    const resolved = resolveTheme(mode);
    setResolvedTheme(resolved);
    
    // Apply to document for web
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(resolved);
    }
    
    // Update NativeWind
    if (typeof window !== 'undefined' && (window as any).__NEXT_THEME__) {
      (window as any).__NEXT_THEME__.setTheme(resolved);
    }
  }, [resolveTheme]);

  // Initialize theme on mount
  useEffect(() => {
    setIsMounted(true);
    applyTheme(storedTheme);
  }, [storedTheme, applyTheme]);

  // Listen to system theme changes
  useEffect(() => {
    if (!isMounted) return;
    
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (storedTheme === 'system') {
        applyTheme('system');
      }
    });

    return () => subscription?.remove();
  }, [isMounted, storedTheme, applyTheme]);

  // Set theme mode
  const setTheme = useCallback((mode: ThemeMode) => {
    setStoredTheme(mode);
    applyTheme(mode);
  }, [setStoredTheme, applyTheme]);

  // Toggle between light and dark (skipping system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Font size helpers
  const increaseFontSize = useCallback(() => {
    setFontSize(Math.min(fontSize + 1, 4));
  }, [fontSize, setFontSize]);

  const decreaseFontSize = useCallback(() => {
    setFontSize(Math.max(fontSize - 1, 1));
  }, [fontSize, setFontSize]);

  const resetFontSize = useCallback(() => {
    setFontSize(2);
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
export function useFontSize() {
  const { fontSize, setFontSize } = useUIStore();
  
  return {
    fontSize,
    setFontSize,
    increaseFontSize: () => setFontSize(Math.min(fontSize + 1, 4)),
    decreaseFontSize: () => setFontSize(Math.max(fontSize - 1, 1)),
    resetFontSize: () => setFontSize(2),
    // Scale factors for different sizes
    scale: [0.85, 0.925, 1, 1.075, 1.15][fontSize],
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