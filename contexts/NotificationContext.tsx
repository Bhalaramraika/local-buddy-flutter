/**
 * Notification Context - Push notification handling
 * FCM token management, foreground/background handling, deep linking
 */

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { Platform, Linking, AppState, AppStateStatus } from 'react-native';
import messaging, { 
  FirebaseMessagingTypes,
  RemoteMessage 
} from '@react-native-firebase/messaging';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

interface NotificationContextType {
  // State
  fcmToken: string | null;
  isPermissionGranted: boolean;
  isLoading: boolean;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<string | null>;
  unregisterForPushNotifications: () => Promise<void>;
  
  // Handlers
  onNotificationOpened: (remoteMessage: RemoteMessage) => void;
  onNotificationReceived: (remoteMessage: RemoteMessage) => void;
  
  // Deep linking
  handleDeepLink: (url: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { 
    fcmToken: storedToken, 
    setFCMToken, 
    addNotification,
    setPermissionGranted,
    permissionGranted,
  } = useNotificationStore();
  
  const { user, updateFCMToken } = useAuthStore();
  
  const [fcmToken, setFcmToken] = useState<string | null>(storedToken);
  const [isPermissionGranted, setIsPermissionGranted] = useState(permissionGranted);
  const [isLoading, setIsLoading] = useState(false);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const authStatus = await messaging().requestPermission({
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      });
      
      const granted = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      setIsPermissionGranted(granted);
      setPermissionGranted(granted);
      
      if (granted) {
        await registerForPushNotifications();
      }
      
      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setIsPermissionGranted, setPermissionGranted]);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    try {
      // Check if already registered
      if (fcmToken) return fcmToken;
      
      // Get FCM token
      const token = await messaging().getToken();
      
      if (token) {
        setFcmToken(token);
        setFCMToken(token);
        
        // Send to backend if user is logged in
        if (user) {
          await updateFCMToken(token);
        }
        
        return token;
      }
      
      return null;
    } catch (error) {
      console.error('FCM registration failed:', error);
      return null;
    }
  }, [fcmToken, user, setFcmToken, setFCMToken, updateFCMToken]);

  // Unregister from push notifications
  const unregisterForPushNotifications = useCallback(async () => {
    try {
      await messaging().deleteToken();
      setFcmToken(null);
      setFCMToken(null);
    } catch (error) {
      console.error('FCM unregistration failed:', error);
    }
  }, [setFcmToken, setFCMToken]);

  // Handle notification opened from background/quit state
  const onNotificationOpened = useCallback((remoteMessage: RemoteMessage) => {
    console.log('Notification opened:', remoteMessage);
    
    // Add to notification store
    addNotification({
      id: remoteMessage.messageId || Date.now().toString(),
      title: remoteMessage.notification?.title || '',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data,
      type: (remoteMessage.data?.type as any) || 'general',
      priority: (remoteMessage.data?.priority as any) || 'normal',
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    // Handle deep linking
    if (remoteMessage.data?.url) {
      handleDeepLink(remoteMessage.data.url);
    } else if (remoteMessage.data?.screen) {
      navigateToScreen(remoteMessage.data.screen, remoteMessage.data.params);
    }
  }, [addNotification]);

  // Handle notification received in foreground
  const onNotificationReceived = useCallback((remoteMessage: RemoteMessage) => {
    console.log('Notification received:', remoteMessage);
    
    // Add to notification store
    addNotification({
      id: remoteMessage.messageId || Date.now().toString(),
      title: remoteMessage.notification?.title || '',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data,
      type: (remoteMessage.data?.type as any) || 'general',
      priority: (remoteMessage.data?.priority as any) || 'normal',
      read: false,
      createdAt: new Date().toISOString(),
    });
    
    // Show local notification if app is in foreground
    // This is handled by the notification service
  }, [addNotification]);

  // Handle deep links
  const handleDeepLink = useCallback((url: string) => {
    console.log('Deep link received:', url);
    
    try {
      const parsed = new URL(url);
      const path = parsed.pathname;
      const params = Object.fromEntries(parsed.searchParams);
      
      // Route based on path
      if (path.startsWith('/task/')) {
        const taskId = path.split('/')[2];
        router.push(`/tabs/tasks/${taskId}?${new URLSearchParams(params).toString()}`);
      } else if (path.startsWith('/chat/')) {
        const chatId = path.split('/')[2];
        router.push(`/tabs/chat/${chatId}?${new URLSearchParams(params).toString()}`);
      } else if (path.startsWith('/wallet/')) {
        router.push(`/tabs/wallet${path.replace('/wallet', '')}?${new URLSearchParams(params).toString()}`);
      } else if (path.startsWith('/profile/')) {
        router.push(`/(screens)/profile${path.replace('/profile', '')}?${new URLSearchParams(params).toString()}`);
      } else {
        // Default to home
        router.push(`/(tabs)/?${new URLSearchParams(params).toString()}`);
      }
    } catch (error) {
      console.error('Deep link parsing failed:', error);
      router.push('/(tabs)');
    }
  }, [router]);

  // Navigate to specific screen
  const navigateToScreen = useCallback((screen: string, params?: Record<string, any>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    
    switch (screen) {
      case 'task-detail':
        router.push(`/tabs/tasks/${params?.taskId}${queryString}`);
        break;
      case 'chat':
        router.push(`/tabs/chat/${params?.chatId}${queryString}`);
        break;
      case 'wallet':
        router.push(`/tabs/wallet${queryString}`);
        break;
      case 'profile':
        router.push(`/(screens)/profile${queryString}`);
        break;
      case 'notifications':
        router.push(`/(screens)/notifications${queryString}`);
        break;
      case 'settings':
        router.push(`/(screens)/settings${queryString}`);
        break;
      default:
        router.push(`/(tabs)${queryString}`);
    }
  }, [router]);

  // Set up listeners
  useEffect(() => {
    // Foreground message handler
    const unsubscribeForeground = messaging().onMessage(onNotificationReceived);
    
    // Background/quit state message handler
    const unsubscribeBackground = messaging().onNotificationOpenedApp(onNotificationOpened);
    
    // Quit state message handler
    messaging().getInitialNotification().then(onNotificationOpened);
    
    // Token refresh handler
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      setFcmToken(token);
      setFCMToken(token);
      if (user) {
        await updateFCMToken(token);
      }
    });
    
    // App state listener for badge management
    const appStateListener = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        messaging().setBadgeCount(0);
      }
    });
    
    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeTokenRefresh();
      appStateListener.remove();
    };
  }, [onNotificationReceived, onNotificationOpened, user, setFCMToken, updateFCMToken]);

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      // Check existing permission
      const authStatus = await messaging().hasPermission();
      const granted = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      
      setIsPermissionGranted(granted);
      setPermissionGranted(granted);
      
      // Register if permission granted
      if (granted) {
        await registerForPushNotifications();
      }
      
      // Set badge count to 0 on start
      messaging().setBadgeCount(0);
    };
    
    initialize();
  }, [registerForPushNotifications, setIsPermissionGranted, setPermissionGranted]);

  // Deep linking listener
  useEffect(() => {
    const handleUrl = (url: string) => handleDeepLink(url);
    
    // Initial URL
    Linking.getInitialURL().then(handleUrl).catch(console.error);
    
    // URL listener
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    
    return () => subscription.remove();
  }, [handleDeepLink]);

  const value: NotificationContextType = {
    fcmToken,
    isPermissionGranted,
    isLoading,
    requestPermission,
    registerForPushNotifications,
    unregisterForPushNotifications,
    onNotificationOpened,
    onNotificationReceived,
    handleDeepLink,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Hook for notification badge count
export function useNotificationBadge() {
  const { unreadCount } = useNotificationStore();
  return unreadCount;
}

// Hook for notification permission status
export function useNotificationPermission() {
  const { permissionGranted, isLoading } = useNotifications();
  return { permissionGranted, isLoading };
}