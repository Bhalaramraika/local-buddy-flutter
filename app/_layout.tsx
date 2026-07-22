/**
 * App Layout - Root layout with all providers
 * Expo Router v3 with route groups
 */

import React, { useEffect, useCallback } from 'react';
import { 
  SafeAreaProvider, 
  SafeAreaView, 
  StyleSheet, 
  View,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReanimatedProvider } from 'react-native-reanimated';
import { Providers as NativeWindProviders } from 'nativewind';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import { LocationProvider, useLocation } from '@/contexts/LocationContext';
import { SocketProvider, useSocket } from '@/contexts/SocketContext';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import { useNotificationStore } from '@/store/notificationStore';
import { initializeStores } from '@/store';
import { initializeServices } from '@/services';
import { initializeFirebase } from '@/services/firebase';
import { initializeSupabase } from '@/services/supabase';
import { SplashScreen } from 'expo-splash-screen';
import { useFonts as useExpoFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

// Prevent splash screen from hiding automatically
SplashScreen.preventAutoHideAsync();

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

// Create persister for query cache
const persister = createSyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 1000 * 60 * 5, // 5 minutes
});

// Font loading hook
function useLoadFonts() {
  const [fontsLoaded] = useExpoFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  return fontsLoaded;
}

// Auth initialization hook
function AuthInitializer() {
  const { initializeAuth, isInitialized } = useAuth();
  const { setUser, setTokens, setLoading: setAuthLoading } = useAuthStore();
  const { setLoading: setUILoading } = useUIStore();

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
  }, [isInitialized, initializeAuth, setAuthLoading, setUILoading, setUser, setTokens]);

  return null;
}

// Location initialization hook
function LocationInitializer() {
  const { requestPermissions, startTracking } = useLocation();
  const { setPermissions, setTrackingMode } = useLocationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const initLocation = async () => {
      if (user) {
        try {
          const permissions = await requestPermissions();
          setPermissions(permissions);
          
          if (permissions.foreground === 'granted') {
            await startTracking('balanced');
            setTrackingMode('balanced');
          }
        } catch (error) {
          console.error('Location initialization failed:', error);
        }
      }
    };

    initLocation();
  }, [user, requestPermissions, startTracking, setPermissions, setTrackingMode]);

  return null;
}

// Notification initialization hook
function NotificationInitializer() {
  const { registerForPushNotifications, getFCMToken } = useNotifications();
  const { setFCMToken, setTokenRegistered, setPermission } = useNotificationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const initNotifications = async () => {
      if (user) {
        try {
          const permission = await registerForPushNotifications();
          setPermission(permission);
          
          if (permission === 'granted') {
            const token = await getFCMToken();
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
  }, [user, registerForPushNotifications, getFCMToken, setFCMToken, setTokenRegistered, setPermission]);

  return null;
}

// Socket initialization hook
function SocketInitializer() {
  const { connect, disconnect } = useSocket();
  const { user } = useAuthStore();
  const { isOnline } = useUIStore();

  useEffect(() => {
    if (user && isOnline) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, isOnline, connect, disconnect]);

  return null;
}

// Store initialization hook
function StoreInitializer() {
  useEffect(() => {
    initializeStores();
    initializeServices();
    initializeFirebase();
    initializeSupabase();
  }, []);

  return null;
}

// Font loader component
function FontLoader({ children }: { children: React.ReactNode }) {
  const fontsLoaded = useLoadFonts();

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent} />
      </SafeAreaView>
    );
  }

  return <>{children}</>;
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
      <ReanimatedProvider>
        <NativeWindProviders>
          <QueryClientProvider client={queryClient}>
            <PersistQueryClientProvider 
              client={queryClient} 
              persister={persister}
              maxAge={1000 * 60 * 60 * 24} // 24 hours
            >
              <AuthProvider>
                <ThemeProvider>
                  <NotificationProvider>
                    <LocationProvider>
                      <SocketProvider>
                        <SafeAreaProvider>
                          <ThemedStatusBar />
                          <FontLoader>
                            <StoreInitializer />
                            <AuthInitializer />
                            <LocationInitializer />
                            <NotificationInitializer />
                            <SocketInitializer />
                            {children}
                          </FontLoader>
                        </SafeAreaProvider>
                      </SocketProvider>
                    </LocationProvider>
                  </NotificationProvider>
                </ThemeProvider>
              </AuthProvider>
            </PersistQueryClientProvider>
          </QueryClientProvider>
        </NativeWindProviders>
      </ReanimatedProvider>
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