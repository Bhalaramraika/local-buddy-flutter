/**
 * Home Screen — Soft Modern Dashboard
 * Playfair headline greeting, signature orange wallet card,
 * rounded white quick-action cards, staggered Moti entrances.
 */

import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftCard, SoftBadge, SoftSkeleton, SoftAvatar, useAppColors } from '@/components/ui';
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
  assigned: { bg: Colors.semantic.warningSoft, text: Colors.semantic.warning },
  completed: { bg: Colors.semantic.successSoft, text: Colors.semantic.success },
  deleted: { bg: Colors.semantic.errorSoft, text: Colors.semantic.error },
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuthStore();
  const { nearbyTasks, isLoading: tasksLoading, fetchTasks } = useTaskStore();
  const { getAvailableBalance } = useWalletStore();
  const { unreadCount } = useNotificationStore();
  const { getTotalUnreadCount } = useChatStore();
  const t = useAppColors();
  const [refreshing, setRefreshing] = React.useState(false);

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();
  const balance = getAvailableBalance();

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450 }}
          style={styles.authPrompt}
        >
          <View style={styles.authIconWrap}>
            <Ionicons name="people" size={44} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Welcome to{'\n'}Local Buddy</Text>
          <Text style={styles.authSub}>Sign in to find local tasks and buddies around you.</Text>
          <Pressable style={styles.authCta} onPress={() => router.push('/login')}>
            <Text style={styles.authCtaText}>Sign in / Create account</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </MotiView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting + notification */}
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name} numberOfLines={1}>{user?.name || 'Buddy'}</Text>
          </View>
          <Pressable
            style={styles.notificationBtn}
            onPress={() => router.push('/(screens)/notifications')}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityHint={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'No notifications'}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.brand.primary} />
            {unreadCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </MotiView>

        {/* Signature orange wallet card */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440, delay: 80 }}
        >
          <Pressable onPress={() => router.push('/(tabs)/wallet')} style={styles.walletCard}>
            <View style={styles.walletTop}>
              <View style={styles.walletLabelRow}>
                <View style={styles.walletIconChip}>
                  <Ionicons name="wallet" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.walletLabel}>Wallet balance</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
            </View>
            <Text style={styles.walletAmount}>{formatCurrency(balance)}</Text>
            <View style={styles.walletActions}>
              <Pressable
                style={styles.walletPillGreen}
                onPress={() => router.push('/(screens)/wallet-topup')}
              >
                <Ionicons name="add-circle" size={15} color="#FFFFFF" />
                <Text style={styles.walletPillText}>Add money</Text>
              </Pressable>
              <Pressable
                style={styles.walletPillGhost}
                onPress={() => router.push('/(screens)/wallet-history')}
              >
                <Ionicons name="time-outline" size={15} color="#FFFFFF" />
                <Text style={styles.walletPillText}>History</Text>
              </Pressable>
            </View>
          </Pressable>
        </MotiView>

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          {QUICK_ACTIONS.map((a, i) => (
            <MotiView
              key={a.label}
              from={{ opacity: 0, translateY: 18 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 420, delay: 140 + i * 70 }}
              style={styles.quickAction}
            >
              <Pressable style={styles.quickActionInner} onPress={() => router.push(a.route as any)}>
                <View style={styles.quickIconWrap}>
                  <Ionicons name={a.icon} size={22} color={Colors.brand.accent} />
                </View>
                <Text style={styles.quickLabel} numberOfLines={1}>{a.label}</Text>
              </Pressable>
            </MotiView>
          ))}
        </View>

        {/* Stats Row */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440, delay: 300 }}
        >
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{String(user?.stats?.tasksPosted || 0)}</Text>
              <Text style={styles.statLabel}>Posted</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.semantic.success }]}>
                {String(user?.stats?.tasksCompleted || 0)}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={15} color={Colors.brand.accent} />
                <Text style={[styles.statValue, { color: Colors.brand.accent }]}>
                  {(user?.rating?.average || 0).toFixed(1)}
                </Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </MotiView>

        {/* Nearby Tasks */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 380 }}
          style={styles.sectionHeaderRow}
        >
          <Text style={styles.sectionTitle}>Nearby tasks</Text>
          <Pressable style={styles.sectionAction} onPress={() => router.push('/(screens)/create-task')}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.sectionActionText}>Post task</Text>
          </Pressable>
        </MotiView>

        {tasksLoading && tasksToShow.length === 0 ? (
          <View style={styles.taskSkeletonRow}>
            <SoftSkeleton height={92} borderRadius={BorderRadius.lg} />
            <SoftSkeleton height={92} borderRadius={BorderRadius.lg} width="92%" />
          </View>
        ) : tasksToShow.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 420 }}
            style={styles.emptyWrap}
          >
            <View style={styles.emptyIconWrap}>
              <Ionicons name="clipboard-outline" size={38} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyTitle}>No nearby tasks yet</Text>
            <Text style={styles.emptySub}>Post one or check back soon — things pick up fast around you.</Text>
          </MotiView>
        ) : (
          tasksToShow.map((task, i) => {
            const budgetText = task.budget?.amount ? `₹${task.budget.amount}` : 'Negotiable';
            const statusColor = TASK_STATUS_COLOR[task.status] || TASK_STATUS_COLOR.open;
            return (
              <MotiView
                key={task.id}
                from={{ opacity: 0, translateY: 16 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400, delay: 420 + i * 70 }}
              >
                <Pressable
                  onPress={() => router.push({ pathname: '/(screens)/task-detail', params: { taskId: task.id } })}
                  style={({ pressed }) => [styles.taskCard, pressed && { transform: [{ scale: 0.985 }] }]}
                >
                  <View style={styles.taskIconChip}>
                    <Ionicons name="briefcase-outline" size={19} color={Colors.brand.accent} />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.taskSub} numberOfLines={1}>
                      {task.category} · ₹{(task.budget as any)?.amount ?? task.budget} · {(task.budget as any)?.type || 'fixed'}
                    </Text>
                  </View>
                  <View style={styles.taskRight}>
                    <SoftBadge label={budgetText} variant="accent" />
                    <View style={[styles.statusDot, { backgroundColor: statusColor.bg }]}>
                      <View style={[styles.statusDotInner, { backgroundColor: statusColor.text }]} />
                    </View>
                  </View>
                </Pressable>
              </MotiView>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[6], paddingBottom: 120 },

  // ---- Auth gate ----
  authPrompt: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[8] },
  authIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[5], ...Shadows.card,
  },
  authTitle: {
    fontFamily: Typography.fontFamily.display, fontSize: 34, lineHeight: 42,
    color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing[3],
  },
  authSub: {
    fontFamily: Typography.fontFamily.body, fontSize: 15, lineHeight: 23,
    color: Colors.text.secondary, textAlign: 'center', marginBottom: Spacing[7],
  },
  authCta: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing[4], paddingHorizontal: Spacing[8], ...Shadows.buttonOrange,
  },
  authCtaText: { color: '#FFFFFF', fontFamily: Typography.fontFamily.semiBold, fontSize: 15 },

  // ---- Header ----
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[6] },
  headerLeft: { flex: 1, marginRight: Spacing[3] },
  greeting: { fontFamily: Typography.fontFamily.bodyMedium, fontSize: 14, color: Colors.text.secondary },
  name: {
    fontFamily: Typography.fontFamily.display, fontSize: 30, lineHeight: 38,
    color: Colors.text.primary, marginTop: 2,
  },
  notificationBtn: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surface.elevated, ...Shadows.card,
  },
  notificationBadge: {
    position: 'absolute', top: -3, right: -3, backgroundColor: Colors.semantic.error,
    borderRadius: BorderRadius.pill, minWidth: 19, height: 19, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface.primary,
  },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 9.5, fontFamily: Typography.fontFamily.bold, paddingHorizontal: 3 },

  // ---- Orange wallet card ----
  walletCard: {
    backgroundColor: Colors.brand.accent,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    marginBottom: Spacing[5],
    ...Shadows.buttonOrange,
  },
  walletTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[3] },
  walletLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  walletIconChip: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  walletLabel: {
    fontFamily: Typography.fontFamily.medium, fontSize: 12, color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  walletAmount: {
    fontFamily: Typography.fontFamily.bold, fontSize: 36, color: '#FFFFFF',
    marginBottom: Spacing[4], letterSpacing: 0.3,
  },
  walletActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  walletPillGreen: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.semantic.success, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing[2] + 2, paddingHorizontal: Spacing[4],
  },
  walletPillGhost: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: BorderRadius.pill,
    paddingVertical: Spacing[2] + 2, paddingHorizontal: Spacing[4],
  },
  walletPillText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 13, color: '#FFFFFF' },

  // ---- Quick actions ----
  quickActionsRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[5] },
  quickAction: { flex: 1 },
  quickActionInner: {
    alignItems: 'center', backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.lg, paddingVertical: Spacing[4], paddingHorizontal: Spacing[2],
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  quickIconWrap: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2],
  },
  quickLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: 11.5, color: Colors.text.primary },

  // ---- Stats ----
  statsCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[5],
    marginBottom: Spacing[7], ...Shadows.card,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: Typography.fontFamily.bold, fontSize: 22, color: Colors.text.primary },
  statLabel: { fontFamily: Typography.fontFamily.body, fontSize: 11, color: Colors.text.muted, marginTop: Spacing[1] },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border.light, marginHorizontal: Spacing[3] },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // ---- Section header ----
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[4] },
  sectionTitle: { fontFamily: Typography.fontFamily.display, fontSize: 21, color: Colors.text.primary },
  sectionAction: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing[2] + 1, paddingHorizontal: Spacing[4], ...Shadows.button,
  },
  sectionActionText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 12.5, color: '#FFFFFF' },

  // ---- Empty / skeleton ----
  taskSkeletonRow: { gap: Spacing[3], marginTop: Spacing[2] },
  emptyWrap: { alignItems: 'center', paddingVertical: Spacing[10], paddingHorizontal: Spacing[4] },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 17, color: Colors.text.primary, marginBottom: Spacing[2] },
  emptySub: { fontFamily: Typography.fontFamily.body, fontSize: 13.5, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20 },

  // ---- Task cards — square-round with soft orange curved border ----
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.xl,
    borderWidth: 1.5, borderColor: Colors.brand.accent, padding: Spacing[4],
    marginBottom: Spacing[3], ...Shadows.card,
  },
  taskIconChip: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 15, color: Colors.text.primary, marginBottom: 2 },
  taskSub: { fontFamily: Typography.fontFamily.body, fontSize: 12, color: Colors.text.muted },
  taskRight: { alignItems: 'flex-end', gap: Spacing[2] },
  statusDot: { borderRadius: BorderRadius.pill, padding: 6 },
  statusDotInner: { width: 6, height: 6, borderRadius: 3 },
});
