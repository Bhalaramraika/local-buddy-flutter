/**
 * App Layout - Root layout with all providers
 * Expo Router v3 with route groups
 */

import React, { useEffect, useCallback, useState } from 'react';
import { 
  SafeAreaView, 
  StyleSheet, 
  View,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { LocationProvider, useLocation } from '@/contexts/LocationContext';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useNotificationStore } from '@/store/notificationStore';
import { initializeStores } from '@/store';
import { initializeServices, startRealtimeSync, stopRealtimeSync } from '@/services';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts as useExpoFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

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
function useLoadFonts() {
  const [fontsLoaded] = useExpoFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  
  // Return true if fontsLoaded is true, or if it's undefined (font loading failed/skipped)
  // This prevents the app from hanging on font loading
  return fontsLoaded === true || fontsLoaded === undefined;
}

// Auth initialization hook
function AuthInitializer() {
  const { initializeAuth, isInitialized } = useAuth();
  const { setLoading: setAuthLoading } = useAuthStore();
  const { setGlobalLoading } = useUIStore();
  const setUILoading = useCallback((isLoading: boolean) => {
    setGlobalLoading({ isLoading });
  }, [setGlobalLoading]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setAuthLoading(true);
        setUILoading(true);
        await initializeAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setAuthLoading(false);
        setUILoading(false);
      }
    };

    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, initializeAuth, setAuthLoading, setUILoading]);

  return null;
}

// Location initialization hook
function LocationInitializer() {
  const { requestPermission, startTracking } = useLocation();
  const { setPermissionStatus, setTrackingMode } = useLocationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const initLocation = async () => {
      if (user) {
        try {
          const granted = await requestPermission();
          setPermissionStatus(granted ? 'granted' : 'denied');

          if (granted) {
            await startTracking('foreground');
          }
        } catch (error) {
          console.error('Location initialization failed:', error);
        }
      }
    };

    initLocation();
  }, [user, requestPermission, startTracking, setPermissionStatus, setTrackingMode]);

  return null;
}

// Notification initialization hook
function NotificationInitializer() {
  const { requestPermission, registerForPushNotifications } = useNotifications();
  const { setFCMToken, setTokenRegistered, setNotificationPermission } = useNotificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const initNotifications = async () => {
      if (user) {
        try {
          const granted = await requestPermission();
          setNotificationPermission(granted, granted ? 'granted' : 'denied');

          if (granted) {
            const token = await registerForPushNotifications();
            if (token) {
              setFCMToken(token);
              setTokenRegistered(true);
            }
          }
        } catch (error) {
          console.error('Notification initialization failed:', error);
        }
      }
    };

    initNotifications();
  }, [user, requestPermission, registerForPushNotifications, setFCMToken, setTokenRegistered, setNotificationPermission]);

  return null;
}

// Firestore realtime sync (replaces the old Socket.IO layer)
function RealtimeInitializer() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      startRealtimeSync(user.id);
    } else {
      stopRealtimeSync();
    }

    return () => {
      stopRealtimeSync();
    };
  }, [user?.id]);

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

// Theme-aware status bar
function ThemedStatusBar() {
  const { theme } = useTheme();
  const colorScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && colorScheme === 'dark');

  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor="transparent"
      translucent={Platform.OS === 'android'}
    />
  );
}

// Main app providers wrapper
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={styles.container}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <NotificationProvider>
              <LocationProvider>
                  <SafeAreaProvider>
                    <ErrorBoundary>
                      <ThemedStatusBar />
                      <ToastContainer />
                      <FontLoader>
                        <StoreInitializer />
                        <GlobalErrorHandler />
                        <AuthInitializer />
                        <LocationInitializer />
                        <NotificationInitializer />
                        <RealtimeInitializer />
                        {children}
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    width: 120,
    height: 120,
  },
});