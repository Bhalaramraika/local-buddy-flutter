/**
 * Notification Store - Zustand
 * Push notifications, in-app notifications, FCM token management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority,
  FCMToken 
} from '@/types';

interface NotificationState {
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // FCM Token
  fcmToken: FCMToken | null;
  isTokenRegistered: boolean;
  tokenRegistrationError: string | null;
  
  // Permissions
  hasNotificationPermission: boolean;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
  
  // Settings
  notificationSettings: {
    pushEnabled: boolean;
    inAppEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    badgeEnabled: boolean;
    categories: Record<NotificationType, boolean>;
    quietHours: {
      enabled: boolean;
      start: string; // HH:mm
      end: string;   // HH:mm
    };
  };
  
  // Loading/Error
  isLoading: boolean;
  error: string | null;
  
  // Actions
  // Notifications
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAllNotifications: () => void;
  clearReadNotifications: () => void;
  
  // FCM Token
  setFCMToken: (token: FCMToken | null) => void;
  setTokenRegistered: (registered: boolean) => void;
  setTokenRegistrationError: (error: string | null) => void;
  
  // Permissions
  setNotificationPermission: (hasPermission: boolean, status: NotificationState['permissionStatus']) => void;
  
  // Settings
  updateNotificationSettings: (settings: Partial<NotificationState['notificationSettings']>) => void;
  toggleCategory: (type: NotificationType, enabled: boolean) => void;
  setQuietHours: (enabled: boolean, start?: string, end?: string) => void;
  
  // Loading/Error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getNotificationsByType: (type: NotificationType) => Notification[];
  getUnreadNotifications: () => Notification[];
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[];
  getRecentNotifications: (limit?: number) => Notification[];
  shouldShowNotification: (notification: Notification) => boolean;
}

const defaultNotificationSettings = {
  pushEnabled: true,
  inAppEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  badgeEnabled: true,
  categories: {
    task_assigned: true,
    task_updated: true,
    task_completed: true,
    task_cancelled: true,
    chat_message: true,
    payment_received: true,
    payment_sent: true,
    withdrawal_initiated: true,
    withdrawal_completed: true,
    withdrawal_failed: true,
    kyc_submitted: true,
    kyc_approved: true,
    kyc_rejected: true,
    sos_alert: true,
    sos_resolved: true,
    referral_bonus: true,
    system_announcement: true,
    app_update: true,
    promotion: true,
  } as Record<NotificationType, boolean>,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      // Initial state
      notifications: [],
      unreadCount: 0,
      fcmToken: null,
      isTokenRegistered: false,
      tokenRegistrationError: null,
      hasNotificationPermission: false,
      permissionStatus: 'undetermined',
      notificationSettings: defaultNotificationSettings,
      isLoading: false,
      error: null,
      
      // Actions
      setNotifications: (notifications) => set((state) => ({
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      })),
      
      addNotification: (notification) => set((state) => {
        // Check if notification already exists (by ID)
        const exists = state.notifications.some((n) => n.id === notification.id);
        if (exists) return state;
        
        const newNotifications = [notification, ...state.notifications].slice(0, 100); // Keep last 100
        return {
          notifications: newNotifications,
          unreadCount: newNotifications.filter((n) => !n.isRead).length,
        };
      }),
      
      updateNotification: (id, updates) => set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, ...updates } : n
        ),
        unreadCount: state.notifications.filter((n) => n.id !== id && !n.isRead).length + 
          (updates.isRead === false ? 1 : 0),
      })),
      
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: state.notifications.filter((n) => n.id !== id && !n.isRead).length,
      })),
      
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: state.notifications.filter((n) => n.id !== id && !n.isRead).length,
      })),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => 
          !n.isRead ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: 0,
      })),
      
      clearAllNotifications: () => set({ notifications: [], unreadCount: 0 }),
      
      clearReadNotifications: () => set((state) => ({
        notifications: state.notifications.filter((n) => !n.isRead),
      })),
      
      // FCM Token
      setFCMToken: (fcmToken) => set({ fcmToken }),
      
      setTokenRegistered: (isTokenRegistered) => set({ isTokenRegistered }),
      
      setTokenRegistrationError: (tokenRegistrationError) => set({ tokenRegistrationError }),
      
      // Permissions
      setNotificationPermission: (hasNotificationPermission, permissionStatus) => set({ 
        hasNotificationPermission, 
        permissionStatus 
      }),
      
      // Settings
      updateNotificationSettings: (settings) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings },
      })),
      
      toggleCategory: (type, enabled) => set((state) => ({
        notificationSettings: {
          ...state.notificationSettings,
          categories: { ...state.notificationSettings.categories, [type]: enabled },
        },
      })),
      
      setQuietHours: (enabled, start, end) => set((state) => ({
        notificationSettings: {
          ...state.notificationSettings,
          quietHours: {
            ...state.notificationSettings.quietHours,
            enabled,
            start: start || state.notificationSettings.quietHours.start,
            end: end || state.notificationSettings.quietHours.end,
          },
        },
      })),
      
      // Loading/Error
      setLoading: (isLoading) => set({ isLoading, error: isLoading ? null : get().error }),
      
      setError: (error) => set({ error, isLoading: false }),
      
      // Computed
      getNotificationsByType: (type) => 
        get().notifications.filter((n) => n.type === type),
      
      getUnreadNotifications: () => 
        get().notifications.filter((n) => !n.isRead),
      
      getNotificationsByPriority: (priority) => 
        get().notifications.filter((n) => n.priority === priority),
      
      getRecentNotifications: (limit = 20) => 
        get().notifications.slice(0, limit),
      
      shouldShowNotification: (notification) => {
        const { notificationSettings, hasNotificationPermission } = get();
        
        if (!hasNotificationPermission || !notificationSettings.inAppEnabled) {
          return false;
        }
        
        // Check category setting
        if (!notificationSettings.categories[notification.type]) {
          return false;
        }
        
        // Check quiet hours
        if (notificationSettings.quietHours.enabled) {
          const now = new Date();
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          const { start, end } = notificationSettings.quietHours;
          
          // Handle overnight quiet hours (e.g., 22:00 to 08:00)
          if (start > end) {
            if (currentTime >= start || currentTime <= end) {
              return notification.priority === 'high' || notification.priority === 'urgent';
            }
          } else {
            if (currentTime >= start && currentTime <= end) {
              return notification.priority === 'high' || notification.priority === 'urgent';
            }
          }
        }
        
        return true;
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        // Persist settings and token
        notificationSettings: state.notificationSettings,
        fcmToken: state.fcmToken,
        isTokenRegistered: state.isTokenRegistered,
        hasNotificationPermission: state.hasNotificationPermission,
        permissionStatus: state.permissionStatus,
      }),
    }
  )
);

// Selectors
export const selectNotifications = (state: NotificationState) => state.notifications;
export const selectUnreadCount = (state: NotificationState) => state.unreadCount;
export const selectFCMToken = (state: NotificationState) => state.fcmToken;
export const selectIsTokenRegistered = (state: NotificationState) => state.isTokenRegistered;
export const selectTokenRegistrationError = (state: NotificationState) => state.tokenRegistrationError;
export const selectNotificationPermission = (state: NotificationState) => ({
  hasPermission: state.hasNotificationPermission,
  status: state.permissionStatus,
});
export const selectNotificationSettings = (state: NotificationState) => state.notificationSettings;
export const selectNotificationLoading = (state: NotificationState) => state.isLoading;
export const selectNotificationError = (state: NotificationState) => state.error;

// Computed selectors
export const selectUnreadNotifications = (state: NotificationState) => state.getUnreadNotifications();
export const selectRecentNotifications = (state: NotificationState) => state.getRecentNotifications(20);
export const selectHighPriorityNotifications = (state: NotificationState) => 
  state.getNotificationsByPriority('high');
export const selectUrgentNotifications = (state: NotificationState) => 
  state.getNotificationsByPriority('urgent');