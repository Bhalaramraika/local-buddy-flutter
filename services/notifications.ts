/**
 * Notification Service
 * Based on Architecture.md - Firebase Cloud Messaging + expo-notifications
 * Handles push notifications, local notifications, and notification categories
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, PermissionsAndroid } from 'react-native';
import { messaging, getToken, onMessage } from './firebase';
import { preferencesStorage } from './storage';
import { NOTIFICATION_CONFIG } from '@/constants/app';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  badge?: number;
  categoryId?: string;
}

export type NotificationType = 
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'payment_received'
  | 'payment_failed'
  | 'chat_message'
  | 'buddy_nearby'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'wallet_low_balance'
  | 'sos_alert'
  | 'system_announcement'
  | 'review_received'
  | 'verification_required';

export interface NotificationCategory {
  identifier: string;
  actions: NotificationAction[];
  intentIdentifiers: string[];
  hiddenPreviewsBodyPlaceholder?: string;
  categorySummaryFormat?: string;
}

export interface NotificationAction {
  identifier: string;
  title: string;
  options: Notifications.NotificationActionOptions;
  textInput?: Notifications.NotificationActionTextInput;
}

// Notification categories for interactive notifications
export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  {
    identifier: 'task_actions',
    actions: [
      {
        identifier: 'accept_task',
        title: 'Accept',
        options: { foreground: true, destructive: false, authenticationRequired: false },
      },
      {
        identifier: 'decline_task',
        title: 'Decline',
        options: { foreground: true, destructive: true, authenticationRequired: false },
      },
      {
        identifier: 'view_task',
        title: 'View Details',
        options: { foreground: true, destructive: false, authenticationRequired: false },
      },
    ],
    intentIdentifiers: [],
  },
  {
    identifier: 'chat_actions',
    actions: [
      {
        identifier: 'reply_message',
        title: 'Reply',
        options: { foreground: true, destructive: false, authenticationRequired: false },
        textInput: {
          placeholder: 'Type a message...',
          submitButtonTitle: 'Send',
        },
      },
      {
        identifier: 'view_chat',
        title: 'View Chat',
        options: { foreground: true, destructive: false, authenticationRequired: false },
      },
    ],
    intentIdentifiers: [],
  },
  {
    identifier: 'payment_actions',
    actions: [
      {
        identifier: 'view_payment',
        title: 'View Details',
        options: { foreground: true, destructive: false, authenticationRequired: false },
      },
      {
        identifier: 'retry_payment',
        title: 'Retry',
        options: { foreground: true, destructive: false, authenticationRequired: false },
      },
    ],
    intentIdentifiers: [],
  },
  {
    identifier: 'sos_actions',
    actions: [
      {
        identifier: 'view_sos',
        title: 'View Alert',
        options: { foreground: true, destructive: false, authenticationRequired: false },
      },
      {
        identifier: 'call_emergency',
        title: 'Call Emergency',
        options: { foreground: true, destructive: true, authenticationRequired: false },
      },
    ],
    intentIdentifiers: [],
  },
];

// Initialize notifications
export const initializeNotifications = async (): Promise<string | null> => {
  try {
    // Request permissions
    const permission = await requestNotificationPermissions();
    if (!permission.granted) {
      console.warn('[Notifications] Permission not granted');
      return null;
    }

    // Set up notification categories (Android)
    if (Platform.OS === 'android') {
      await setNotificationCategories();
    }

    // Get FCM token
    const token = await getFCMToken();
    
    // Set up foreground message handler
    setupForegroundHandler();
    
    // Set up notification response handler
    setupNotificationResponseHandler();

    return token;
  } catch (error) {
    console.error('[Notifications] Initialization error:', error);
    return null;
  }
};

// Request notification permissions
export const requestNotificationPermissions = async (): Promise<Notifications.PermissionStatus> => {
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
            allowCriticalAlerts: true,
            allowProvisional: false,
          },
        });
        finalStatus = status;
      }
      
      // Android 13+ requires POST_NOTIFICATIONS permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return { granted: false, canAskAgain: true, status: 'denied' };
        }
      }
      
      return { granted: finalStatus === 'granted', canAskAgain: finalStatus !== 'denied', status: finalStatus };
    } else {
      console.warn('[Notifications] Not a physical device');
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  } catch (error) {
    console.error('[Notifications] Permission request error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
};

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      console.warn('[Notifications] Firebase messaging not initialized');
      return null;
    }

    const token = await getToken(messaging, { 
      vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY 
    });
    
    if (token) {
      await preferencesStorage.setFcmToken(token);
      console.log('[Notifications] FCM token obtained:', token.substring(0, 20) + '...');
    }
    
    return token;
  } catch (error) {
    console.error('[Notifications] FCM token error:', error);
    return null;
  }
};

// Set up notification categories (Android)
const setNotificationCategories = async (): Promise<void> => {
  try {
    await Notifications.setNotificationCategoryAsync('task_actions', NOTIFICATION_CATEGORIES[0].actions);
    await Notifications.setNotificationCategoryAsync('chat_actions', NOTIFICATION_CATEGORIES[1].actions);
    await Notifications.setNotificationCategoryAsync('payment_actions', NOTIFICATION_CATEGORIES[2].actions);
    await Notifications.setNotificationCategoryAsync('sos_actions', NOTIFICATION_CATEGORIES[3].actions);
  } catch (error) {
    console.error('[Notifications] Set categories error:', error);
  }
};

// Foreground message handler
let foregroundHandler: (() => void) | null = null;

const setupForegroundHandler = (): void => {
  if (messaging) {
    foregroundHandler = onMessage(messaging, async (remoteMessage) => {
      console.log('[Notifications] Foreground message:', remoteMessage);
      
      // Show local notification for foreground messages
      await showLocalNotification({
        type: remoteMessage.data?.type as NotificationType || 'system_announcement',
        title: remoteMessage.notification?.title || 'New Notification',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data,
      });
    });
  }
};

// Notification response handler (when user taps notification)
let responseHandler: (() => void) | null = null;

const setupNotificationResponseHandler = (): void => {
  responseHandler = Notifications.addNotificationResponseReceivedListener((response) => {
    const { notification, actionIdentifier } = response;
    const data = notification.request.content.data;
    
    console.log('[Notifications] Response received:', { actionIdentifier, data });
    
    // Handle action buttons
    handleNotificationAction(actionIdentifier, data);
  });
};

const handleNotificationAction = (actionId: string, data: Record<string, any>): void => {
  // This would typically navigate or trigger actions via a navigation ref
  // For now, we'll emit events that can be listened to
  console.log('[Notifications] Action:', actionId, data);
  
  // Emit custom event for navigation handling
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('notification-action', { 
      detail: { actionId, data } 
    }));
  }
};

// Show local notification
export const showLocalNotification = async (notification: NotificationData): Promise<string | null> => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound || NOTIFICATION_CONFIG.defaultSound,
        badge: notification.badge,
        categoryIdentifier: notification.categoryId,
      },
      trigger: null, // Show immediately
    });
    
    return identifier;
  } catch (error) {
    console.error('[Notifications] Show local notification error:', error);
    return null;
  }
};

// Schedule notification for later
export const scheduleNotification = async (
  notification: NotificationData,
  trigger: Notifications.NotificationTriggerInput
): Promise<string | null> => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound || NOTIFICATION_CONFIG.defaultSound,
        badge: notification.badge,
        categoryIdentifier: notification.categoryId,
      },
      trigger,
    });
    
    return identifier;
  } catch (error) {
    console.error('[Notifications] Schedule notification error:', error);
    return null;
  }
};

// Cancel notification
export const cancelNotification = async (identifier: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('[Notifications] Cancel notification error:', error);
  }
};

// Cancel all notifications
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('[Notifications] Cancel all notifications error:', error);
  }
};

// Set badge count
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('[Notifications] Set badge error:', error);
  }
};

// Get badge count
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('[Notifications] Get badge error:', error);
    return 0;
  }
};

// Notification templates for common types
export const createTaskAssignedNotification = (taskTitle: string, taskId: string, buddyName: string): NotificationData => ({
  type: 'task_assigned',
  title: 'New Task Assigned',
  body: `${buddyName} assigned you "${taskTitle}"`,
  data: { type: 'task_assigned', taskId },
  categoryId: 'task_actions',
  sound: NOTIFICATION_CONFIG.defaultSound,
});

export const createTaskUpdatedNotification = (taskTitle: string, taskId: string, updateType: string): NotificationData => ({
  type: 'task_updated',
  title: 'Task Updated',
  body: `Your task "${taskTitle}" has been ${updateType}`,
  data: { type: 'task_updated', taskId, updateType },
  categoryId: 'task_actions',
});

export const createPaymentReceivedNotification = (amount: number, taskId: string): NotificationData => ({
  type: 'payment_received',
  title: 'Payment Received',
  body: `You received ₹${amount} for a completed task`,
  data: { type: 'payment_received', taskId, amount },
  categoryId: 'payment_actions',
  sound: NOTIFICATION_CONFIG.paymentSound,
});

export const createChatMessageNotification = (senderName: string, message: string, chatId: string): NotificationData => ({
  type: 'chat_message',
  title: senderName,
  body: message.length > 50 ? message.substring(0, 50) + '...' : message,
  data: { type: 'chat_message', chatId },
  categoryId: 'chat_actions',
  sound: NOTIFICATION_CONFIG.messageSound,
});

export const createBuddyNearbyNotification = (buddyName: string, distance: number, buddyId: string): NotificationData => ({
  type: 'buddy_nearby',
  title: 'Buddy Nearby',
  body: `${buddyName} is ${formatDistance(distance)} away and available for tasks`,
  data: { type: 'buddy_nearby', buddyId, distance },
  sound: NOTIFICATION_CONFIG.defaultSound,
});

export const createKYCNotification = (approved: boolean, reason?: string): NotificationData => ({
  type: approved ? 'kyc_approved' : 'kyc_rejected',
  title: approved ? 'KYC Approved' : 'KYC Rejected',
  body: approved 
    ? 'Your KYC has been approved. You can now accept tasks!'
    : `Your KYC was rejected${reason ? `: ${reason}` : ''}. Please resubmit.`,
  data: { type: approved ? 'kyc_approved' : 'kyc_rejected', reason },
  sound: approved ? NOTIFICATION_CONFIG.successSound : NOTIFICATION_CONFIG.errorSound,
});

export const createSOSNotification = (buddyName: string, location: string, sosId: string): NotificationData => ({
  type: 'sos_alert',
  title: '🚨 SOS Alert',
  body: `${buddyName} needs help at ${location}`,
  data: { type: 'sos_alert', sosId, location },
  categoryId: 'sos_actions',
  sound: NOTIFICATION_CONFIG.sosSound,
  badge: 1,
});

export const createWalletLowBalanceNotification = (balance: number): NotificationData => ({
  type: 'wallet_low_balance',
  title: 'Low Wallet Balance',
  body: `Your wallet balance is ₹${balance}. Add money to continue accepting tasks.`,
  data: { type: 'wallet_low_balance', balance },
  sound: NOTIFICATION_CONFIG.warningSound,
});

// Utility: Format distance
const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

// Cleanup
export const cleanupNotifications = (): void => {
  if (foregroundHandler) {
    foregroundHandler();
    foregroundHandler = null;
  }
  if (responseHandler) {
    responseHandler();
    responseHandler = null;
  }
};

export default {
  initializeNotifications,
  requestNotificationPermissions,
  getFCMToken,
  showLocalNotification,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  setBadgeCount,
  getBadgeCount,
  createTaskAssignedNotification,
  createTaskUpdatedNotification,
  createPaymentReceivedNotification,
  createChatMessageNotification,
  createBuddyNearbyNotification,
  createKYCNotification,
  createSOSNotification,
  createWalletLowBalanceNotification,
  cleanupNotifications,
};