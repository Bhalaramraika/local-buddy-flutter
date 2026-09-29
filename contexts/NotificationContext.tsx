/**
 * Notification Context - Push notification handling
 * FCM token management, foreground/background handling, deep linking
 * Native Firebase module is lazy-required so the app runs in Expo Go/web.
 */

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { Platform, Linking, AppState, AppStateStatus } from 'react-native';
import type {
  FirebaseMessagingTypes,
  RemoteMessage,
} from '@react-native-firebase/messaging';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { useRouter } from 'expo-router';

type MessagingModule = typeof import('@react-native-firebase/messaging').default;
type MessagingInstance = FirebaseMessagingTypes.Module;

let _messaging: MessagingModule | null = null;
const getMessagingModule = (): MessagingModule | null => {
  if (_messaging) return _messaging;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _messaging = require('@react-native-firebase/messaging').default;
    return _messaging;
  } catch {
    return null;
  }
};

// Safe messaging getter — returns null when native FCM is unavailable
const getMessagingSafe = (): MessagingInstance | null => {
  const mod = getMessagingModule();
  if (!mod) return null;
  try {
    return mod();
  } catch {
    console.warn('[NotificationContext] Firebase not initialized. Push unavailable.');
    return null;
  }
};

const getAuthStatus = () => {
  const mod: any = getMessagingModule();
  if (!mod) return { AUTHORIZED: 1, PROVISIONAL: 2 };
  return mod?.AuthorizationStatus ?? { AUTHORIZED: 1, PROVISIONAL: 2 };
};

interface NotificationContextType {
  fcmToken: string | null;
  isPermissionGranted: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  registerForPushNotifications: () => Promise<string | null>;
  unregisterForPushNotifications: () => Promise<void>;
  onNotificationOpened: (remoteMessage: RemoteMessage | null) => void;
  onNotificationReceived: (remoteMessage: RemoteMessage) => void;
  handleDeepLink: (url: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    fcmToken: storedToken,
    setFCMToken,
    addNotification,
    setNotificationPermission,
    hasNotificationPermission,
  } = useNotificationStore();

  const { user } = useAuthStore();

  const [fcmToken, setFcmToken] = useState<string | null>(storedToken);
  const [isPermissionGranted, setIsPermissionGranted] = useState(hasNotificationPermission);
  const [isLoading, setIsLoading] = useState(false);

  // ------------- navigation helpers -------------

  const navigateToScreen = useCallback(
    (screen: string, params?: Record<string, any>) => {
      switch (screen) {
        case 'task-detail':
        case 'task_detail':
        case 'task':
          router.push({
            pathname: '/(screens)/task-detail',
            params: { taskId: String(params?.taskId ?? '') },
          });
          break;
        case 'chat':
        case 'chat-detail':
          router.push({
            pathname: '/(screens)/chat-detail',
            params: { conversationId: String(params?.chatId ?? params?.conversationId ?? '') },
          });
          break;
        case 'wallet':
          router.push('/(tabs)/wallet');
          break;
        case 'profile':
          router.push({
            pathname: '/(screens)/user-profile',
            params: { userId: String(params?.userId ?? user?.id ?? '') },
          });
          break;
        case 'notifications':
          router.push('/(screens)/notifications');
          break;
        case 'settings':
          router.push('/(screens)/settings');
          break;
        default:
          router.push('/(tabs)/home');
      }
    },
    [router, user]
  );

  const handleDeepLink = useCallback(
    (url: string) => {
      try {
        const normalized = url.replace(/^localbuddy:\/\//, '/');
        const [pathPart, queryPart] = normalized.split('?');
        const params = queryPart
          ? Object.fromEntries(new URLSearchParams(queryPart).entries())
          : {};
        const segments = pathPart.split('/').filter(Boolean);
        const head = segments[0];
        const id = segments[1];

        if (head === 'task' && id) {
          router.push({ pathname: '/(screens)/task-detail', params: { taskId: id } });
        } else if (head === 'chat' && id) {
          router.push({ pathname: '/(screens)/chat-detail', params: { conversationId: id } });
        } else if (head === 'wallet') {
          router.push('/(tabs)/wallet');
        } else if (head === 'profile' && id) {
          router.push({ pathname: '/(screens)/user-profile', params: { userId: id } });
        } else if (head === 'notifications') {
          router.push('/(screens)/notifications');
        } else {
          router.push('/(tabs)/home');
        }
      } catch (error) {
        console.error('Deep link parsing failed:', error);
        router.push('/(tabs)/home');
      }
    },
    [router]
  );

  // ------------- FCM message handlers -------------

  const onNotificationReceived = useCallback(
    (remoteMessage: RemoteMessage) => {
      addNotification({
        id: remoteMessage.messageId || Date.now().toString(),
        title: remoteMessage.notification?.title || 'Notification',
        body: remoteMessage.notification?.body || '',
        data: (remoteMessage.data as Record<string, any>) || {},
        type: (remoteMessage.data?.type as any) || 'general',
        priority: (remoteMessage.data?.priority as any) || 'normal',
        read: false,
        createdAt: new Date().toISOString(),
      } as any);
    },
    [addNotification]
  );

  const onNotificationOpened = useCallback(
    (remoteMessage: RemoteMessage | null) => {
      if (!remoteMessage) return;
      onNotificationReceived(remoteMessage);
      const data = remoteMessage.data || {};
      if (data.url) {
        handleDeepLink(String(data.url));
      } else if (data.screen) {
        navigateToScreen(String(data.screen), data.params as Record<string, any> | undefined);
      }
    },
    [onNotificationReceived, handleDeepLink, navigateToScreen]
  );

  // ------------- token registration -------------

  const registerForPushNotifications = useCallback(async (): Promise<string | null> => {
    if (Platform.OS === 'web') return null;

    const messagingInstance = getMessagingSafe();
    if (!messagingInstance) {
      console.warn('[NotificationContext] Messaging not available, skipping FCM registration');
      return null;
    }

    try {
      if (fcmToken) return fcmToken;

      const token = await messagingInstance.getToken();
      if (token) {
        setFcmToken(token);
        setFCMToken(token);
        if (user) {
          await authService.updateFCMToken(token);
        }
        return token;
      }
      return null;
    } catch (error) {
      console.error('FCM registration failed:', error);
      return null;
    }
  }, [fcmToken, user, setFcmToken, setFCMToken]);

  const unregisterForPushNotifications = useCallback(async () => {
    if (Platform.OS === 'web') return;

    const messagingInstance = getMessagingSafe();
    if (!messagingInstance) {
      console.warn('[NotificationContext] Messaging not available, skipping FCM unregistration');
      return;
    }

    try {
      await messagingInstance.deleteToken();
      setFcmToken(null);
      setFCMToken(null);
    } catch (error) {
      console.error('FCM unregistration failed:', error);
    }
  }, [setFcmToken, setFCMToken]);

  // ------------- permissions -------------

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    const messagingInstance = getMessagingSafe();
    if (!messagingInstance) {
      console.warn('[NotificationContext] Messaging module not available, skipping permission request');
      return false;
    }

    try {
      setIsLoading(true);

      const authStatus = await messagingInstance.requestPermission({
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      });

      const AuthorizationStatus = getAuthStatus();
      const granted =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      setIsPermissionGranted(granted);
      setNotificationPermission(granted, granted ? 'granted' : 'denied');

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
  }, [setIsPermissionGranted, setNotificationPermission, registerForPushNotifications]);

  // ------------- wiring -------------
// Set up message listeners
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const messagingInstance = getMessagingSafe();
    if (!messagingInstance) {
      console.warn('[NotificationContext] Messaging not available, skipping listener setup');
      return;
    }

    let unsubscribeForeground: () => void;
    let unsubscribeBackground: () => void;
    let unsubscribeTokenRefresh: () => void;

    try {
      unsubscribeForeground = messagingInstance.onMessage(onNotificationReceived);
      unsubscribeBackground = messagingInstance.onNotificationOpenedApp(onNotificationOpened);

      messagingInstance.getInitialNotification().then(onNotificationOpened);

      unsubscribeTokenRefresh = messagingInstance.onTokenRefresh(async (token) => {
        setFcmToken(token);
        setFCMToken(token);
        if (user) {
          await authService.updateFCMToken(token);
        }
      });
    } catch (error) {
      console.error('[NotificationContext] Failed to set up messaging listeners:', error);
      return;
    }

    const appStateListener = AppState.addEventListener('change', (_state: AppStateStatus) => {
      // Reserved: badge bookkeeping can go here
    });

    return () => {
      try {
        unsubscribeForeground?.();
        unsubscribeBackground?.();
        unsubscribeTokenRefresh?.();
      } catch (e) {
        console.warn('[NotificationContext] Error cleaning up listeners:', e);
      }
      appStateListener.remove();
    };
  }, [onNotificationReceived, onNotificationOpened, user, setFCMToken]);

  // Initialize on mount: check current permission + register if granted
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const initialize = async () => {
      const messagingInstance = getMessagingSafe();
      if (!messagingInstance) return;

      try {
        const authStatus = await messagingInstance.hasPermission();
        const AuthorizationStatus = getAuthStatus();
        const granted =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        setIsPermissionGranted(granted);
        setNotificationPermission(granted, granted ? 'granted' : 'denied');

        if (granted) {
          await registerForPushNotifications();
        }
      } catch (error) {
        console.error('[NotificationContext] init failed:', error);
      }
    };

    initialize();
  }, [registerForPushNotifications, setIsPermissionGranted, setNotificationPermission]);

  // Deep link listener
  useEffect(() => {
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleDeepLink(url);
      })
      .catch(console.error);

    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
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
  const { isPermissionGranted, isLoading } = useNotifications();
  return { permissionGranted: isPermissionGranted, isLoading };
}
