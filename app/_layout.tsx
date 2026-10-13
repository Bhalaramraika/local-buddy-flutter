/**
 * App Layout - Root layout with all providers
 * Expo Router v3 with route groups
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LocationProvider, useLocation } from '@/contexts/LocationContext';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { initializeStores } from '@/store';
import { initializeServices, startRealtimeSync, stopRealtimeSync } from '@/services';
import { auth as firebaseAuth } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts as useExpoFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';

// Prevent splash screen from hiding automatically - with fallback for missing native module
try {
  SplashScreen.preventAutoHideAsync();
} catch (e) {
  console.warn('[SplashScreen] preventAutoHideAsync failed:', e);
}

// Create QueryClient with persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Font loading hook with fallback for missing fonts
// Soft Modern type system: Poppins (primary) + Playfair Display (headlines) + Inter (body)
function useLoadFonts() {
  const [fontsLoaded] = useExpoFonts({
    // Poppins — primary (text, buttons, navigation)
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    // Playfair Display — large headlines
    'Playfair-SemiBold': PlayfairDisplay_600SemiBold,
    'Playfair-Bold': PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    // Inter — small body text readability
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  
  // Return true if fontsLoaded is true, or if it's undefined (font loading failed/skipped)
  // This prevents the app from hanging on font loading
  return fontsLoaded === true || fontsLoaded === undefined;
}

// Auth initialization hook
// NOTE: runs silently — the persisted Zustand session already drives routing,
// so this must NOT show the global loader. If the backend is cold-starting
// (Render free tier = tens of seconds), getCurrentUser (skipGlobalLoader)
// refreshes the profile in the background instead of blocking the app.
function AuthInitializer() {
  const { initializeAuth, isInitialized } = useAuth();
  const { setLoading: setAuthLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        setAuthLoading(true);
        await initializeAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setAuthLoading(false);
      }
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, initializeAuth, setAuthLoading]);

  return null;
}

// Location initialization hook
// IMPORTANT: no system permission prompt at app start — it delays the first
// screen and users reflexively deny it. We silently check the CURRENT status
// (expo-location, no prompt) and only start tracking when permission was
// already granted. Features that need location (onboarding setup,
// location-settings, task flows) call requestPermission() at the moment of use.
function LocationInitializer() {
  const { startTracking } = useLocation();
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const setPermissionStatus = useLocationStore((s) => s.setPermissionStatus);
  const user = useAuthStore((s) => s.user);
  const [checked, setChecked] = useState(false);

  // Step 1: silent status check — never shows the system dialog
  useEffect(() => {
    if (!user || checked) return;
    let cancelled = false;
    (async () => {
      try {
        const { getForegroundPermissionsAsync } = await import('expo-location');
        const { status } = await getForegroundPermissionsAsync();
        if (!cancelled) {
          setPermissionStatus(status as 'granted' | 'denied' | 'undetermined');
        }
      } catch (error) {
        console.warn('[Location] Silent permission check failed:', error);
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, checked, setPermissionStatus]);

  // Step 2: start foreground tracking only when permission already exists.
  // Runs on the re-render after step 1's store update, so startTracking's
  // closure sees the fresh status and skips its own requestPermission().
  useEffect(() => {
    if (user && checked && permissionStatus === 'granted') {
      startTracking('foreground').catch((error) =>
        console.error('Location tracking start failed:', error)
      );
    }
  }, [user, checked, permissionStatus, startTracking]);

  return null;
}

// Firestore realtime sync (replaces the old Socket.IO layer)
// Listeners start only when BOTH the app user and the Firebase Auth session
// are ready — otherwise Firestore security rules reject every listener
// (request.auth == null) and no realtime data ever arrives.
function RealtimeInitializer() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(
    () => firebaseAuth?.currentUser?.uid ?? null
  );

  useEffect(() => {
    if (!firebaseAuth) return;
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      setFirebaseUid(fbUser?.uid ?? null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (userId && firebaseUid) {
      startRealtimeSync(userId);
    } else {
      stopRealtimeSync();
    }

    return () => {
      stopRealtimeSync();
    };
  }, [userId, firebaseUid]);

  return null;
}

// Store initialization hook
function StoreInitializer() {
  useEffect(() => {
    initializeStores();
    initializeServices();
  }, []);

  return null;
}

// Global error handler hook - catches unhandled promise rejections and other global errors
function GlobalErrorHandler() {
  const { showToast } = useUIStore();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault(); // Prevent default browser behavior
      
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'An unexpected error occurred',
        duration: 8000,
      });
    };

    // Handle global errors (React Native doesn't have window.onerror, but we can use ErrorUtils)
    const handleGlobalError = (error: Error, isFatal?: boolean) => {
      console.error('Global error:', error, isFatal ? '(FATAL)' : '');
      
      showToast({
        type: 'error',
        title: isFatal ? 'Critical Error' : 'Error',
        message: error.message || 'An unexpected error occurred',
        duration: isFatal ? 10000 : 8000,
      });
    };

    // Set up global error handlers
    // For React Native, we use the global ErrorUtils
    const originalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
    
    if ((globalThis as any).ErrorUtils) {
      (globalThis as any).ErrorUtils.setGlobalHandler(handleGlobalError);
    }

    // For unhandled promise rejections (works in React Native with proper polyfill)
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      handleUnhandledRejection(event);
    };

    // Add event listeners (only on web)
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('unhandledrejection', rejectionHandler);
    }

    // Cleanup
    return () => {
      if ((globalThis as any).ErrorUtils && originalHandler) {
        (globalThis as any).ErrorUtils.setGlobalHandler(originalHandler);
      }
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('unhandledrejection', rejectionHandler);
      }
    };
  }, [showToast]);

  return null;
}

// Font loader component with timeout fallback - hooks must be called unconditionally
function FontLoader({ children }: { children: React.ReactNode }) {
  const fontsLoaded = useLoadFonts();
  const [timeoutFired, setTimeoutFired] = React.useState(false);

  // Safety timeout - if fonts don't load within 5 seconds, proceed anyway
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeoutFired(true);
      console.warn('[FontLoader] Font loading timeout - proceeding without custom fonts');
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  // Hide splash screen once fonts are loaded or timeout fired
  React.useEffect(() => {
    if (fontsLoaded || timeoutFired) {
      try {
        SplashScreen.hideAsync();
      } catch (e) {
        console.warn('[SplashScreen] hideAsync failed:', e);
      }
    }
  }, [fontsLoaded, timeoutFired]);

  // Always render children, but show loading overlay conditionally
  return (
    <>
      {children}
      {!fontsLoaded && !timeoutFired && (
        <SafeAreaView style={styles.loadingContainer}>
          <View style={styles.loadingContent} />
        </SafeAreaView>
      )}
    </>
  );
}

// Theme-aware status bar.
// IMPORTANT (Android): an opaque status bar, so app content never slides
// up underneath the battery/clock area. `translucent: true` was the root
// cause of screens overlapping the system status bar.
function ThemedStatusBar() {
  const { theme } = useTheme();
  const colorScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');

  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={isDark ? '#1E1209' : '#FAEBD7'}
      translucent={false}
    />
  );
}

// Main app providers wrapper
function AppProviders({ children }: { children: React.ReactNode }) {
  // Error boundary resets whenever the signed-in user changes
  // (login/logout) — a crash can never trap the user on the error screen.
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <LocationProvider>
                  <SafeAreaProvider>
                    <ErrorBoundary resetKeys={[authUserId]}>
                      <ThemedStatusBar />
                      <ToastContainer />
                      <FontLoader>
                        <StoreInitializer />
                        <GlobalErrorHandler />
                        <AuthInitializer />
                        <LocationInitializer />
                        <RealtimeInitializer />
                        {children}
                        {/* App-wide centered orange loader (auto-wired to API calls) */}
                        <GlobalLoader />
                      </FontLoader>
                    </ErrorBoundary>
                  </SafeAreaProvider>
              </LocationProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// Root layout
export default function RootLayout() {
  return (
    <AppProviders>
      <Slot />
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAEBD7',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAEBD7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    width: 120,
    height: 120,
  },
});