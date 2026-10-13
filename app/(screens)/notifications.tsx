/**
 * Notifications Screen - View and manage notifications
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useUIStore } from '@/store/uiStore';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notifications';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftScreenSkeleton } from '@/components/ui';


export default function NotificationsScreen() {
  const router = useRouter();
  const { showToast } = useUIStore();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');


  const loadNotifications = async () => {
    setError(null);
    try {
      const res = await fetchNotifications({ limit: 50 });
      const raw = res?.notifications ?? [];
      setNotifications(raw.map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        title: n.title || 'Notification',
        message: n.body || n.message || '',
        time: n.createdAt || new Date().toISOString(),
        read: !!n.read,
        actionUrl: n.data?.url || n.actionUrl,
        avatar: n.image || null,
      })));
    } catch (e: any) {
      console.warn('[Notifications] load failed:', e);
      setError(e?.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Defer past the first commit — a sync setState directly inside the
    // effect body triggers cascading-render lint/runtime warnings.
    void Promise.resolve().then(loadNotifications);
  }, []);


  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.read) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      try { await markNotificationRead(notification.id); } catch {}
    }
    if (notification.actionUrl) {
      try { router.push(notification.actionUrl as any); } catch {}
      return;
    }
    // No deep link from the backend — open the in-app detail view instead
    router.push({
      pathname: '/(screens)/notification-detail',
      params: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        time: notification.time,
        type: notification.type,
        read: notification.read ? '1' : '0',
      },
    });
  };

  const markAllAsRead = async () => {
    const prev = notifications;
    setNotifications(prev.map(n => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
      showToast('All notifications marked as read', 'success');
    } catch {
      setNotifications(prev);
      showToast('Failed to update', 'error');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_application': return { icon: 'document-text', color: Colors.brand.accent, bg: Colors.brand.accentSoft };
      case 'message': return { icon: 'chatbubble', color: Colors.semantic.info, bg: Colors.semantic.infoSoft };
      case 'task_completed': return { icon: 'checkmark-circle', color: Colors.semantic.success, bg: Colors.semantic.successSoft };
      case 'payment': return { icon: 'cash', color: Colors.semantic.success, bg: Colors.semantic.successSoft };
      case 'review': return { icon: 'star', color: Colors.semantic.warning, bg: Colors.semantic.warningSoft };
      case 'system': return { icon: 'information-circle', color: Colors.brand.primary, bg: '#1E120912' };
      case 'task_assigned': return { icon: 'briefcase', color: Colors.brand.accent, bg: Colors.brand.accentSoft };
      case 'promotion': return { icon: 'gift', color: Colors.semantic.error, bg: Colors.semantic.errorSoft };
      default: return { icon: 'notifications', color: Colors.text.secondary, bg: Colors.surface.tertiary };
    }
  };

  const clearAll = undefined as never; // no server-side delete-all endpoint

  const renderNotification = ({ item }: { item: any }) => {
    const { icon, color, bg } = getNotificationIcon(item.type);
    const timeAgo = formatTime(item.time);

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 340, delay: 40 }}
      >
        <TouchableOpacity
          style={[styles.notificationItem, !item.read && styles.notificationUnread]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.85}
        >
          <View style={[styles.notificationIcon, { backgroundColor: bg }]}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.notificationAvatar} />
            ) : (
              <Ionicons name={icon as any} size={20} color={color} />
            )}
          </View>
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, !item.read && { color: Colors.text.primary }]}>
                {item.title}
              </Text>
              <Text style={styles.notificationTime}>{timeAgo}</Text>
            </View>
            <Text style={styles.notificationMessage}>{item.message}</Text>
          </View>
          {!item.read ? <View style={styles.unreadDot} /> : null}
        </TouchableOpacity>
      </MotiView>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <SoftScreenSkeleton cards={5} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle" size={30} color={Colors.semantic.error} />
          </View>
          <Text style={styles.loadingText}>{error}</Text>
          <TouchableOpacity onPress={loadNotifications} style={styles.retryBtn} hitSlop={8}>
            <Ionicons name="refresh" size={15} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* In-page header */}
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        onBack={() => router.back()}
        right={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllTopBtn} hitSlop={8}>
              <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
              <Text style={styles.markAllTopText}>Mark all read</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'unread'] as const).map((t) => {
          const active = filter === t;
          return (
            <TouchableOpacity
              key={t}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setFilter(t)}
            >
              <Text style={[styles.filterTabText, active && { color: '#FFFFFF' }]}>
                {t === 'all' ? 'All' : 'Unread'}
              </Text>
              {t === 'unread' && unreadCount > 0 ? (
                <View style={[styles.filterTabBadge, active ? styles.filterTabBadgeActive : styles.filterTabBadgeIdle]}>
                  <Text style={[styles.filterBadgeText, active && { color: Colors.brand.accent }]}>{unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name={filter === 'unread' ? 'notifications-off-outline' : 'notifications-outline'} size={44} color={Colors.brand.accent} />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
          </Text>
        </MotiView>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.brand.accent]}
              tintColor={Colors.brand.accent}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  markAllTopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], ...Shadows.button,
  },
  markAllTopText: { fontSize: 11.5, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  filterContainer: {
    flexDirection: 'row', gap: Spacing[2],
    paddingHorizontal: Spacing[5], paddingBottom: Spacing[4],
  },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: Spacing[4] + 2, paddingVertical: Spacing[2] + 2,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.surface.elevated,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  filterTabActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  filterTabText: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  filterTabBadge: { paddingHorizontal: Spacing[2], paddingVertical: 1, borderRadius: BorderRadius.pill, minWidth: 20, alignItems: 'center' },
  filterTabBadgeActive: { backgroundColor: '#FFFFFF' },
  filterTabBadgeIdle: { backgroundColor: Colors.brand.accent },
  filterBadgeText: { fontSize: 10.5, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },

  listContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },
  notificationItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[4], marginBottom: Spacing[3],
    borderRadius: BorderRadius.lg, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  notificationUnread: { backgroundColor: Colors.brand.accentSoft, borderColor: Colors.brand.accent + '40' },
  notificationIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  notificationAvatar: { width: '100%', height: '100%', borderRadius: 23 },
  notificationContent: { flex: 1, minWidth: 0 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 },
  notificationTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary, flex: 1, marginRight: 8 },
  notificationTime: { fontSize: 11, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, flexShrink: 0 },
  notificationMessage: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 19 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.brand.accent, marginLeft: Spacing[1] },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[3], paddingHorizontal: Spacing[8] },
  errorIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.semantic.errorSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[5], paddingVertical: Spacing[2] + 2, ...Shadows.buttonOrange,
  },
  retryBtnText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyTitle: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, textAlign: 'center' },
  emptySubtitle: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center' },
});