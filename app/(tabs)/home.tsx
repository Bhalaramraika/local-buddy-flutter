/**
 * Home Screen - Main dashboard
 */

import React, { useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useWalletStore } from '@/store/walletStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useChatStore } from '@/store/chatStore';
import { useLocationStore } from '@/store/locationStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatDistance } from '@/utils/helpers';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { tasks, nearbyTasks, fetchNearbyTasks, isLoading: tasksLoading } = useTaskStore();
  const { wallet, fetchWallet } = useWalletStore();
  const { unreadCount } = useNotificationStore();
  const { totalUnreadCount } = useChatStore();
  const { nearbyBuddies } = useLocationStore();
  const { theme } = useUIStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isAuthenticated) {
      fetchNearbyTasks();
      fetchWallet();
    }
  }, [isAuthenticated, fetchNearbyTasks, fetchWallet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNearbyTasks(), fetchWallet()]);
    setRefreshing(false);
  };

  const quickActions = [
    { id: 'create-task', icon: 'plus-circle', label: 'Post Task', color: '#4F46E5', route: '/(screens)/create-task' },
    { id: 'find-buddy', icon: 'account-group', label: 'Find Buddy', color: '#10B981', route: '/(screens)/nearby-buddies' },
    { id: 'wallet', icon: 'wallet', label: 'Wallet', color: '#F59E0B', route: '/(tabs)/wallet' },
    { id: 'chat', icon: 'chat', label: 'Messages', color: '#EF4444', route: '/(tabs)/chat', badge: totalUnreadCount },
  ];

  const stats = [
    { label: 'Active Tasks', value: user?.stats?.activeTasks || 0, icon: 'clipboard-check', color: '#4F46E5' },
    { label: 'Completed', value: user?.stats?.completedTasks || 0, icon: 'check-circle', color: '#10B981' },
    { label: 'Earnings', value: formatCurrency(user?.stats?.totalEarnings || 0), icon: 'currency-inr', color: '#F59E0B' },
    { label: 'Rating', value: user?.stats?.rating?.toFixed(1) || '0.0', icon: 'star', color: '#EF4444' },
  ];

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.authPrompt}>
          <Ionicons name="person-circle-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Welcome to LocalBuddy</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Sign in to find local tasks and buddies</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.authButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[isDark ? '#fff' : '#000']} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: isDark ? '#fff' : '#000' }]}>
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}!
            </Text>
            <Text style={[styles.nameText, { color: isDark ? '#fff' : '#000' }]}>{user?.name || 'Buddy'}</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/(screens)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={isDark ? '#fff' : '#000'} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Wallet Balance Card */}
      <View style={[styles.walletCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
        <View style={styles.walletHeader}>
          <Text style={[styles.walletLabel, { color: isDark ? '#aaa' : '#666' }]}>Wallet Balance</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/wallet')}>
            <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.walletAmount, { color: isDark ? '#fff' : '#000' }]}>
          {formatCurrency(wallet?.balance || 0)}
        </Text>
        <View style={styles.walletActions}>
          <TouchableOpacity style={[styles.walletActionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} onPress={() => router.push('/(screens)/wallet-topup')}>
            <Ionicons name="add-circle-outline" size={20} color="#4F46E5" />
            <Text style={[styles.walletActionText, { color: '#4F46E5' }]}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.walletActionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} onPress={() => router.push('/(screens)/wallet-withdraw')}>
            <Ionicons name="remove-circle-outline" size={20} color="#10B981" />
            <Text style={[styles.walletActionText, { color: '#10B981' }]}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.walletActionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} onPress={() => router.push('/(screens)/wallet-history')}>
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
            <Text style={[styles.walletActionText, { color: '#F59E0B' }]}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Quick Actions</Text>
        </View>
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickActionBtn, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
              onPress={() => router.push(action.route)}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <MaterialCommunityIcons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: isDark ? '#fff' : '#000' }]}>{action.label}</Text>
              {action.badge && action.badge > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Your Stats</Text>
          <TouchableOpacity onPress={() => router.push('/(screens)/stats')}>
            <Text style={styles.seeAll}>See All</Text>
            <Ionicons name="chevron-forward-outline" size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fafafa' }]}>
              <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Nearby Tasks */}
      <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Nearby Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={styles.seeAll}>See All</Text>
            <Ionicons name="chevron-forward-outline" size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        {tasksLoading ? (
          <View style={styles.loading}>
            <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Loading tasks...</Text>
          </View>
        ) : nearbyTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-outline" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#888' : '#666' }]}>No tasks nearby</Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#666' : '#999' }]}>Pull to refresh or create your own task</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {nearbyTasks.slice(0, 3).map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
                onPress={() => router.push(`/(screens)/task-detail/${task.id}`)}
              >
                <View style={styles.taskHeader}>
                  <View style={[styles.taskCategory, { backgroundColor: `${task.categoryColor}20` }]}>
                    <Text style={[styles.taskCategoryText, { color: task.categoryColor }]}>{task.category}</Text>
                  </View>
                  <Text style={[styles.taskDistance, { color: isDark ? '#888' : '#666' }]}>
                    {formatDistance(task.distance)}
                  </Text>
                </View>
                <Text style={[styles.taskTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>{task.title}</Text>
                <View style={styles.taskFooter}>
                  <View style={styles.taskMeta}>
                    <Ionicons name="cash-outline" size={14} color="#10B981" />
                    <Text style={[styles.taskMetaText, { color: '#10B981' }]}>{formatCurrency(task.budget)}</Text>
                  </View>
                  <View style={styles.taskMeta}>
                    <Ionicons name="time-outline" size={14} color={isDark ? '#888' : '#666'} />
                    <Text style={[styles.taskMetaText, { color: isDark ? '#888' : '#666' }]}>{task.duration}</Text>
                  </View>
                  <View style={styles.taskMeta}>
                    <Ionicons name="person-outline" size={14} color={isDark ? '#888' : '#666'} />
                    <Text style={[styles.taskMetaText, { color: isDark ? '#888' : '#666' }]}>{task.applicantsCount} applicants</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Nearby Buddies */}
      {nearbyBuddies.length > 0 && (
        <View style={[styles.section, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Nearby Buddies</Text>
            <TouchableOpacity onPress={() => router.push('/(screens)/nearby-buddies')}>
              <Text style={styles.seeAll}>See All</Text>
              <Ionicons name="chevron-forward-outline" size={16} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          <View style={styles.buddiesList}>
            {nearbyBuddies.slice(0, 5).map((buddy) => (
              <TouchableOpacity
                key={buddy.id}
                style={styles.buddyCard}
                onPress={() => router.push(`/(screens)/chat-detail/${buddy.id}`)}
              >
                <View style={styles.buddyAvatar}>
                  {buddy.avatar ? (
                    <Image source={{ uri: buddy.avatar }} style={styles.buddyAvatarImage} />
                  ) : (
                    <Text style={styles.buddyAvatarInitial}>{buddy.name.charAt(0)}</Text>
                  )}
                  {buddy.isOnline && <View style={styles.onlineIndicator} />}
                </View>
                <View style={styles.buddyInfo}>
                  <Text style={[styles.buddyName, { color: isDark ? '#fff' : '#000' }]}>{buddy.name}</Text>
                  <Text style={[styles.buddyDistance, { color: isDark ? '#888' : '#666' }]}>{formatDistance(buddy.distance)} away</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { flex: 1 },
  greetingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  nameText: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  notificationButton: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  walletCard: { margin: 16, padding: 20, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  walletLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  walletAmount: { fontSize: 32, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  walletActions: { flexDirection: 'row', justifyContent: 'space-between' },
  walletActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  walletActionText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  section: { marginHorizontal: 16, marginTop: 24, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickActionBtn: { alignItems: 'center', width: '23%', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  quickActionIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickActionLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  quickActionBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  quickActionBadgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  loading: { paddingVertical: 32, alignItems: 'center' },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyState: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 12 },
  emptySubtext: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'center', paddingHorizontal: 24 },
  taskList: { gap: 12 },
  taskCard: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskCategory: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  taskCategoryText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  taskDistance: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  taskTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  buddiesList: { gap: 12 },
  buddyCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  buddyAvatar: { position: 'relative', width: 48, height: 48, borderRadius: 24, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  buddyAvatarImage: { width: 48, height: 48, borderRadius: 24 },
  buddyAvatarInitial: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },
  buddyInfo: { flex: 1 },
  buddyName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  buddyDistance: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  authButton: { marginTop: 24, backgroundColor: '#4F46E5', paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12 },
  authButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});