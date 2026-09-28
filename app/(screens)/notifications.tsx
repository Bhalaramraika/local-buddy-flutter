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
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';

// Mock notifications data
const mockNotifications = [
  {
    id: '1',
    type: 'task_application',
    title: 'New Application',
    message: 'John Doe applied to your task "Grocery Shopping"',
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    read: false,
    actionUrl: '/(screens)/task-detail/1',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: '2',
    type: 'message',
    title: 'New Message',
    message: 'Sarah Wilson: "Hi, when can you start the cleaning task?"',
    time: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
    actionUrl: '/(tabs)/chat/2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  },
  {
    id: '3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'Your task "Dog Walking" has been completed by Mike Chen',
    time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    read: true,
    actionUrl: '/(screens)/task-detail/3',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  },
  {
    id: '4',
    type: 'payment',
    title: 'Payment Received',
    message: 'You received $45.00 for "Grocery Shopping" task',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
    actionUrl: '/(screens)/wallet-history',
    avatar: null,
    icon: 'cash',
  },
  {
    id: '5',
    type: 'review',
    title: 'New Review',
    message: 'Emma Davis left you a 5-star review!',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    read: true,
    actionUrl: '/(screens)/profile/emma-davis',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  },
  {
    id: '6',
    type: 'system',
    title: 'Welcome to LocalBuddy!',
    message: 'Thanks for joining. Complete your profile to get more tasks.',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    read: true,
    actionUrl: '/(screens)/edit-profile',
    avatar: null,
    icon: 'sparkles',
  },
  {
    id: '7',
    type: 'task_assigned',
    title: 'Task Assigned',
    message: 'You have been assigned to "Package Delivery"',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    read: true,
    actionUrl: '/(screens)/task-detail/7',
    avatar: null,
    icon: 'package',
  },
  {
    id: '8',
    type: 'promotion',
    title: 'Special Offer',
    message: 'Get 10% bonus on your next wallet top-up!',
    time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    read: true,
    actionUrl: '/(screens)/wallet-topup',
    avatar: null,
    icon: 'gift',
  },
];


export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');


  const loadNotifications = async () => {
    // Yield before touching state so React never sees sync setState in the mount effect
    await Promise.resolve();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setNotifications(mockNotifications);
    setLoading(false);
  };

  useEffect(() => {
    // Defer data loading past the first commit so no sync setState happens in the effect body
    void Promise.resolve().then(() => {     loadNotifications(); });
  }, []);


  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_application': return { icon: 'document-text-outline', color: '#4F46E5', bg: '#4F46E515' };
      case 'message': return { icon: 'chatbubble-outline', color: '#10B981', bg: '#10B98115' };
      case 'task_completed': return { icon: 'check-circle-outline', color: '#10B981', bg: '#10B98115' };
      case 'payment': return { icon: 'cash-outline', color: '#F59E0B', bg: '#F59E0B15' };
      case 'review': return { icon: 'star-outline', color: '#F59E0B', bg: '#F59E0B15' };
      case 'system': return { icon: 'information-circle-outline', color: '#6366F1', bg: '#6366F115' };
      case 'task_assigned': return { icon: 'briefcase-outline', color: '#8B5CF6', bg: '#8B5CF615' };
      case 'promotion': return { icon: 'gift-outline', color: '#EC4899', bg: '#EC489915' };
      default: return { icon: 'notifications-outline', color: '#6B7280', bg: '#6B728015' };
    }
  };

  const handleNotificationPress = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const clearAll = () => {
    Alert.alert('Clear All', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {
        setNotifications([]);
        showToast('All notifications cleared', 'success');
      }},
    ]);
  };

  const renderNotification = ({ item }: { item: any }) => {
    const { icon, color, bg } = getNotificationIcon(item.type);
    const timeAgo = formatTime(item.time);

    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.notificationUnread]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: bg }]}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.notificationAvatar} />
          ) : (
            <Ionicons name={icon as any} size={22} color={color} />
          )}
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={[styles.notificationTitle, { color: isDark ? '#fff' : '#000' }]}>{item.title}</Text>
            <Text style={[styles.notificationTime, { color: isDark ? '#888' : '#999' }]}>{timeAgo}</Text>
          </View>
          <Text style={[styles.notificationMessage, { color: isDark ? '#ddd' : '#444' }]}>{item.message}</Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Notifications</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#4F46E5" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Notifications</Text>
          <TouchableOpacity onPress={notifications.length > 0 ? clearAll : undefined} disabled={notifications.length === 0}>
            <Text style={[styles.clearText, { color: notifications.length > 0 ? '#EF4444' : (isDark ? '#555' : '#999') }]}>Clear All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' ? styles.filterTabTextActive : {}, { color: filter === 'all' ? '#4F46E5' : (isDark ? '#fff' : '#000') }]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' ? styles.filterTabTextActive : {}, { color: filter === 'unread' ? '#4F46E5' : (isDark ? '#fff' : '#000') }]}>
            Unread {unreadCount > 0 && <Text style={styles.filterBadge}>{unreadCount}</Text>}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllReadButton} onPress={markAllAsRead}>
          <Ionicons name="checkmark-done-outline" size={18} color="#4F46E5" />
          <Text style={styles.markAllReadText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name={filter === 'unread' ? 'notifications-off-outline' : 'notifications-outline'} size={64} color={isDark ? '#555' : '#ccc'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#888' : '#666' }]}>
            {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
          </Text>
        </View>
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
              colors={['#4F46E5']}
            />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <Ionicons name="notifications-off-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>No unread notifications</Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#888' : '#666' }]}>All caught up!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  clearText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterTab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  filterTabActive: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  filterTabText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  filterTabTextActive: { color: '#4F46E5' },
  filterBadge: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, marginLeft: 6 },
  markAllReadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginHorizontal: 16, marginTop: 8, backgroundColor: '#4F46E515', borderRadius: 10 },
  markAllReadText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#4F46E5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  listContent: { padding: 16, paddingBottom: 40 },
  notificationItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  notificationUnread: { backgroundColor: '#4F46E508' },
  notificationIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  notificationAvatar: { width: '100%', height: '100%', borderRadius: 22 },
  notificationContent: { flex: 1, minWidth: 0 },
  notificationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  notificationTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1, marginRight: 8 },
  notificationTime: { fontSize: 12, fontFamily: 'Inter_400Regular', flexShrink: 0 },
  notificationMessage: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5', marginTop: 6, alignSelf: 'flex-start' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
});