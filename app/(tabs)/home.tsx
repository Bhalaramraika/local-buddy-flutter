/**
 * Home Screen — Soft Premium Dashboard
 * Clean greeting, capsule wallet card, quick actions, nearby tasks feed.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/design';
import { SoftCard, SoftBadge, SoftSkeleton, useAppColors } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { useWalletStore } from '@/store/walletStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useChatStore } from '@/store/chatStore';
import { formatCurrency } from '@/utils/helpers';

const QUICK_ACTIONS = [
  { icon: 'add-circle-outline' as const, label: 'Post task', route: '/(screens)/create-task' },
  { icon: 'people-outline' as const, label: 'Find buddy', route: '/(screens)/nearby-buddies' },
  { icon: 'wallet-outline' as const, label: 'Wallet', route: '/(tabs)/wallet' },
  { icon: 'star-outline' as const, label: 'My stats', route: '/(screens)/stats' },
];

const TASK_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open: { bg: Colors.semantic.infoSoft, text: Colors.semantic.info },
  in_progress: { bg: Colors.semantic.warningSoft, text: Colors.semantic.warning },
  completed: { bg: Colors.semantic.successSoft, text: Colors.semantic.success },
  cancelled: { bg: Colors.semantic.errorSoft, text: Colors.semantic.error },
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { nearbyTasks, isLoading: tasksLoading, fetchTasks } = useTaskStore();
  const { getAvailableBalance } = useWalletStore();
  const { unreadCount } = useNotificationStore();
  const { getTotalUnreadCount } = useChatStore();
  const t = useAppColors();
  const [refreshing, setRefreshing] = React.useState(false);

  const isDark = t.isDark;
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();
  const balance = getAvailableBalance();
  const totalUnreadCount = getTotalUnreadCount();

  useEffect(() => {
    if (isAuthenticated) { void fetchTasks({ status: 'open' }); }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      getAvailableBalance();
      void fetchTasks({ status: 'open' });
    } finally { setRefreshing(false); }
  };

  const tasksToShow = useMemo(
    () => nearbyTasks.slice(0, 4),
    [nearbyTasks]
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <View style={styles.authPrompt}>
          <View style={styles.authIconWrap}>
            <Ionicons name="people-outline" size={60} color={t.primary} />
          </View>
          <Text style={[styles.authTitle, { color: t.text }]}>Welcome to LocalBuddy</Text>
          <Text style={[styles.authSub, { color: t.textSecondary }]}>Sign in to find local tasks and buddies</Text>
          <Pressable style={styles.authCta} onPress={() => router.push('/login')}>
            <Text style={styles.authCtaText}>Sign in / Create account</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.primary]} tintColor={Colors.brand.primary} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting + notification */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: t.textSecondary }]}>{greeting}</Text>
            <Text style={[styles.name, { color: t.text }]}>{user?.name || 'Buddy'} 👋</Text>
          </View>
          <Pressable
            style={[styles.notificationBtn, { backgroundColor: t.surface, borderColor: t.border }]}
            onPress={() => router.push('/(screens)/notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No notifications'}
          >
            <Ionicons name="notifications-outline" size={22} color={t.text} />
            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Wallet Card */}
        <SoftCard animated delay={0}>
          <View style={styles.walletCardInner}>
            <View style={styles.walletTop}>
              <View style={styles.walletLabelRow}>
                <Ionicons name="wallet-outline" size={16} color={t.textMuted} />
                <Text style={[styles.walletLabel, { color: t.textMuted }]}>Wallet balance</Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/wallet')}>
                <Ionicons name="chevron-forward" size={18} color={t.textMuted} />
              </Pressable>
            </View>
            <Text style={[styles.walletAmount, { color: t.text }]}>{formatCurrency(balance)}</Text>
            <View style={styles.walletActions}>
              <Pressable
                style={[styles.actionPill, { backgroundColor: Colors.brand.primary }]}
                onPress={() => router.push('/(screens)/wallet-topup')}
              >
                <Ionicons name="add" size={14} color="#fff" />
                <Text style={styles.actionPillText}>Add money</Text>
              </Pressable>
              <Pressable
                style={[styles.actionPill, { backgroundColor: t.surfaceAlt, borderWidth: 1, borderColor: t.border }]}
                onPress={() => router.push('/(screens)/wallet-history')}
              >
                <Ionicons name="time-outline" size={14} color={t.textSecondary} />
                <Text style={[styles.actionPillText, { color: t.textSecondary }]}>History</Text>
              </Pressable>
            </View>
          </View>
        </SoftCard>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable key={a.label} style={styles.quickAction} onPress={() => router.push(a.route as any)}>
              <SoftCard padding={3} style={styles.quickActionInner} onPress={() => router.push(a.route as any)}>
                <View style={[styles.quickIconWrap, { backgroundColor: Colors.brand.primary + '12' }]}>
                  <Ionicons name={a.icon} size={22} color={Colors.brand.primary} />
                </View>
                <Text style={[styles.quickLabel, { color: t.text }]} numberOfLines={1}>{a.label}</Text>
              </SoftCard>
            </Pressable>
          ))}
        </View>

        {/* Stats Row */}
        <SoftCard animated delay={100} padding={4}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: t.text }]}>{String(user?.stats?.tasksPosted || 0)}</Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Posted</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.semantic.success }]}>
                {String(user?.stats?.tasksCompleted || 0)}
              </Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Completed</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: t.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.brand.primary }]}>
                {String(Math.round(user?.rating?.average || 0))}
              </Text>
              <Text style={[styles.statLabel, { color: t.textMuted }]}>Rating</Text>
            </View>
          </View>
        </SoftCard>

        {/* Nearby Tasks */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Nearby tasks</Text>
          <Pressable style={styles.sectionAction} onPress={() => router.push('/(screens)/create-task')}>
            <Text style={styles.sectionActionText}>Post task</Text>
            <Ionicons name="add" size={14} color={Colors.text.inverse} />
          </Pressable>
        </View>

        {tasksLoading && tasksToShow.length === 0 ? (
          <View style={styles.taskSkeletonRow}>
            <SoftSkeleton height={96} borderRadius={BorderRadius.lg} />
            <SoftSkeleton height={96} borderRadius={BorderRadius.lg} width="90%" />
          </View>
        ) : tasksToShow.length === 0 ? (
          <View style={styles.Empty}>
            <Ionicons name="clipboard-outline" size={48} color={t.textMuted} />
            <Text style={[styles.emptyTitle, { color: t.text }]}>No nearby tasks yet</Text>
            <Text style={[styles.emptySub, { color: t.textSecondary }]}>Post one or check back soon — things pick up fast around you.</Text>
          </View>
        ) : (
          tasksToShow.map((task, i) => {
            const budgetText = task.budget?.amount ? `₹${task.budget.amount}` : 'Negotiable';
            const statusColor = TASK_STATUS_COLOR[task.status] || TASK_STATUS_COLOR.open;
            return (
              <Pressable
                key={task.id}
                onPress={() => router.push({ pathname: '/(screens)/task-detail', params: { id: task.id } })}
                style={({ pressed }) => [styles.taskCardWrap, pressed && { opacity: 0.92 }]}
              >
                <AnimatedCardWrapper index={i}>
                  <SoftCard padding={4}>
                    <View style={styles.taskRow}>
                      <View style={[styles.taskEmoji, { backgroundColor: Colors.brand.secondary + '12' }]}>
                        <Ionicons name="briefcase-outline" size={18} color={Colors.brand.primary} />
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle, { color: t.text }]} numberOfLines={1}>{task.title}</Text>
                        <Text style={[styles.taskSub, { color: t.textMuted }]} numberOfLines={1}>{task.category} · ₹{(task.budget as any)?.amount ?? task.budget} · {(task.budget as any)?.type || 'fixed'}</Text>
                      </View>
                      <View style={styles.taskRight}>
                        <SoftBadge label={budgetText} variant="neutral" />
                        <View style={[styles.statusDot, { backgroundColor: statusColor.bg }]}>
                          <View style={[styles.statusDotInner, { backgroundColor: statusColor.text }]} />
                        </View>
                      </View>
                    </View>
                  </SoftCard>
                </AnimatedCardWrapper>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function AnimatedCardWrapper({ index, children }: { index: number; children: React.ReactNode }) {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 280, delay: index * 60, useNativeDriver: true }).start();
  }, [index]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  return <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[6], paddingBottom: Spacing[24] },
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  authIconWrap: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.brand.primary + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  authTitle: { fontFamily: Typography.fontFamily.bold, fontSize: 22, marginBottom: Spacing[2] },
  authSub: { fontFamily: Typography.fontFamily.regular, fontSize: 15, textAlign: 'center', marginBottom: Spacing[6] },
  authCta: {
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing[3], paddingHorizontal: Spacing[8],
  },
  authCtaText: { color: Colors.text.inverse, fontFamily: Typography.fontFamily.semiBold, fontSize: 15 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[6] },
  headerLeft: { flex: 1 },
  greeting: { fontFamily: Typography.fontFamily.medium, fontSize: 13, color: Colors.text.secondary },
  name: { fontFamily: Typography.fontFamily.bold, fontSize: 24, color: Colors.text.primary, marginTop: Spacing[1] },
  notificationBtn: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  notificationBadge: {
    position: 'absolute', top: -3, right: -3, backgroundColor: Colors.semantic.error,
    borderRadius: BorderRadius.pill, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface.secondary,
  },
  notificationBadgeText: { color: Colors.text.inverse, fontSize: 9, fontFamily: Typography.fontFamily.bold, paddingHorizontal: 3 },

  walletCardInner: { paddingVertical: Spacing[5], paddingHorizontal: Spacing[5] },
  walletTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[3] },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  walletLabel: { fontFamily: Typography.fontFamily.medium, fontSize: 12, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  walletAmount: { fontFamily: Typography.fontFamily.bold, fontSize: 30, color: Colors.text.primary, marginBottom: Spacing[5] },
  walletActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  actionPill: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[1],
    borderRadius: BorderRadius.pill, paddingVertical: Spacing[2], paddingHorizontal: Spacing[4],
  },
  actionPillText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13, color: Colors.text.inverse },

  quickActionsRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[6] },
  quickAction: { flex: 1 },
  quickActionInner: { alignItems: 'center', paddingVertical: Spacing[4], paddingHorizontal: Spacing[2] },
  quickIconWrap: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  quickLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12, color: Colors.text.primary },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: Typography.fontFamily.bold, fontSize: 22, color: Colors.text.primary },
  statLabel: { fontFamily: Typography.fontFamily.medium, fontSize: 11, color: Colors.text.muted, marginTop: Spacing[1] },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border.light, marginHorizontal: Spacing[3] },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[4] },
  sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: 18, color: Colors.text.primary },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.pill, paddingVertical: Spacing[2], paddingHorizontal: Spacing[3] },
  sectionActionText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12, color: Colors.text.inverse },

  taskSkeletonRow: { gap: Spacing[3], marginTop: Spacing[2] },
  Empty: { alignItems: 'center', paddingVertical: Spacing[10], paddingHorizontal: Spacing[4] },
  emptyTitle: { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: Colors.text.primary, marginTop: Spacing[4], marginBottom: Spacing[2] },
  emptySub: { fontFamily: Typography.fontFamily.regular, fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },

  taskCardWrap: { marginBottom: Spacing[3] },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  taskEmoji: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1 },
  taskTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 15, color: Colors.text.primary, marginBottom: 2 },
  taskSub: { fontFamily: Typography.fontFamily.regular, fontSize: 12, color: Colors.text.muted },
  taskRight: { alignItems: 'flex-end', gap: Spacing[2] },
  statusDot: { borderRadius: BorderRadius.pill, padding: 6 },
  statusDotInner: { width: 6, height: 6, borderRadius: 3 },
});
