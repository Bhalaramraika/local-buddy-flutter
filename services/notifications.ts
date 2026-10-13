/**
 * Notifications Service
 * REST-backed in-app notifications + preferences
 */

import { apiGet, apiPut } from './api';
import { CACHE_CONFIG } from '@/constants/app';
import { cachedApiGet, cacheInvalidate, userCacheKey } from './cache';

export interface AppNotification {
  id: string;
  type?: string;
  title: string;
  body?: string;
  message?: string;
  data?: Record<string, any>;
  read?: boolean;
  createdAt?: string;
}

export interface NotificationListResponse {
  success: boolean;
  notifications: AppNotification[];
  unreadCount?: number;
  hasMore?: boolean;
}

export const fetchNotifications = (params?: { limit?: number; offset?: number }) =>
  apiGet<NotificationListResponse>('/notifications', { params });

/**
 * TTL-cached notifications list (CACHE_CONFIG.notifications = 2 min).
 * Fresh cache resolves with zero network. Pull-to-refresh passes
 * forceRefresh. Reads are invalidated by markRead/markAllRead below.
 */
export const fetchNotificationsCached = (
  params?: { limit?: number; offset?: number },
  options?: {
    forceRefresh?: boolean;
    onStale?: (data: NotificationListResponse) => void;
  }
) => {
  const key = userCacheKey(`notifications:list:${params?.limit ?? 50}:${params?.offset ?? 0}`);
  return options?.forceRefresh
    ? (async () => {
        await cacheInvalidate(key);
        return cachedApiGet<NotificationListResponse>(key, '/notifications', CACHE_CONFIG.notifications, {
          config: { params },
          onStale: options?.onStale,
        });
      })()
    : cachedApiGet<NotificationListResponse>(key, '/notifications', CACHE_CONFIG.notifications, {
        config: { params },
        onStale: options?.onStale,
      });
};

export const markNotificationRead = async (id: string) => {
  const res = await apiPut(`/notifications/${id}/read`);
  // List content changed — next mount must refetch, not serve the cached read-state.
  void cacheInvalidate(userCacheKey('notifications:list:'));
  return res;
};

export const markAllNotificationsRead = async () => {
  const res = await apiPut('/notifications/read-all');
  void cacheInvalidate(userCacheKey('notifications:list:'));
  return res;
};

export interface NotificationPreferences {
  push?: boolean;
  inApp?: boolean;
  email?: boolean;
  sms?: boolean;
  categories?: Record<string, boolean>;
  quietHours?: { enabled: boolean; start: string; end: string };
}

export const getNotificationPreferences = () =>
  apiGet<{ success: boolean; preferences: NotificationPreferences }>('/notifications/preferences');

export const updateNotificationPreferences = (prefs: NotificationPreferences) =>
  apiPut<{ success: boolean; preferences: NotificationPreferences }>(
    '/notifications/preferences',
    prefs
  );
