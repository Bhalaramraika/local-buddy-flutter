/**
 * Notifications Service
 * REST-backed in-app notifications + preferences
 */

import { apiGet, apiPut } from './api';

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

export const markNotificationRead = (id: string) =>
  apiPut(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  apiPut('/notifications/read-all');

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
