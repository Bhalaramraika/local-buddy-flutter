/**
 * My Tasks Screen — Soft Modern
 * Cocoa pill filter tabs with counts, white task cards with
 * status pills + start/complete CTAs. Store actions unchanged.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTaskStore } from '@/store/taskStore';
import { useUIStore } from '@/store/uiStore';
import { apiPost, getApiErrorMessage } from '@/services/api';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftScreenSkeleton } from '@/components/ui';

// Backend task statuses: open | assigned | completed | deleted
// (payment is tracked by the task's paidAt timestamp, not a status)
const FILTERS = ['all', 'open', 'assigned', 'completed', 'deleted'] as const;

export default function MyTasksScreen() {
  const router = useRouter();
  const {
    myTasks,
    refreshTasks,
    deleteTask,
    isLoading: tasksLoading,
  } = useTaskStore();
  const { showToast } = useUIStore();

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null);

  // Realtime listeners keep myTasks in sync; this is the server-authoritative
  // fetch for the first open of the screen.
  React.useEffect(() => {
    refreshTasks().catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  const filteredTasks = myTasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const handleTaskPress = (task: any) => {
    router.push({ pathname: `/(screens)/task-detail`, params: { taskId: task.id } });
  };

  const handleEditPress = (task: any) => {
    router.push({ pathname: `/(screens)/edit-task`, params: { taskId: task.id } });
  };

  const handleApplicationsPress = (task: any) => {
    router.push({ pathname: `/(screens)/task-applications`, params: { taskId: task.id } });
  };

  // Delete = POSTers cancelling an open task (backend: DELETE /tasks/:id,
  // allowed only while the task is still open).
  const handleDeletePress = (task: any) => {
    Alert.alert(
      'Delete task',
      `"${task.title}" will be removed. This cannot be undone.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusyTaskId(task.id);
            try {
              await deleteTask(task.id);
              showToast('Task deleted', 'info');
            } finally {
              setBusyTaskId(null);
            }
          },
        },
      ]
    );
  };

  // Completed (unpaid) task → release the escrowed amount to the buddy
  // (backend: POST /wallet/release/:taskId, which stamps paidAt on the task).
  const handleReleasePayment = (task: any) => {
    const amount = (task.budget?.amount ?? 0) + (task.tip ?? 0);
    Alert.alert(
      'Release payment',
      `Pay ₹${amount} to the buddy for "${task.title}"? The buddy receives the full amount; the 10% platform fee is billed to the buddy as dues.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Release',
          onPress: async () => {
            setBusyTaskId(task.id);
            try {
              await apiPost(`/wallet/release/${task.id}`);
              showToast('Payment released to buddy', 'success');
              await refreshTasks();
            } catch (err: any) {
              Alert.alert('Payment failed', getApiErrorMessage(err, 'Could not release payment. Please try again.'));
            } finally {
              setBusyTaskId(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.semantic.info;
      case 'assigned': return Colors.semantic.warning;
      case 'completed': return Colors.semantic.success;
      case 'deleted': return Colors.semantic.error;
      default: return Colors.text.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'assigned': return 'Assigned';
      case 'completed': return 'Completed';
      case 'deleted': return 'Deleted';
      default: return status;
    }
  };

  const renderTaskCard = ({ item, index }: any) => {
    const statusColor = getStatusColor(item.status);
    return (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 380, delay: Math.min(index, 8) * 55 }}
      >
        <Pressable
          style={({ pressed }) => [styles.taskCard, pressed && { transform: [{ scale: 0.985 }] }]}
          onPress={() => handleTaskPress(item)}
        >
          <View style={styles.taskCardHeader}>
            <View style={styles.taskTitleContainer}>
              <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {item.status === 'completed' && item.paidAt ? 'Paid' : getStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={(e) => { e.stopPropagation(); handleEditPress(item); }}
              style={styles.editBtn}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={17} color={Colors.brand.accent} />
            </Pressable>
          </View>

          <Text style={styles.taskDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.taskMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="cash" size={13} color={Colors.semantic.success} />
              <Text style={[styles.metaText, { color: Colors.semantic.success, fontFamily: Typography.fontFamily.semiBold }]}>₹{item.budget?.amount ?? (typeof item.budget === 'number' ? item.budget : 0)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={Colors.text.muted} />
              <Text style={styles.metaText} numberOfLines={1}>{item.location?.address || 'Location not set'}</Text>
            </View>
            {item.deadline ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={Colors.text.muted} />
                <Text style={styles.metaText}>
                  {new Date(item.deadline).toLocaleDateString('en-IN')}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.taskFooter}>
            <Pressable
              style={styles.applicantsWrap}
              onPress={(e) => { e.stopPropagation(); handleApplicationsPress(item); }}
              hitSlop={6}
            >
              <Ionicons name="people-outline" size={13} color={Colors.brand.accent} />
              <Text style={styles.applicantsCount}>
                {item.applicants?.length ?? item.applicationsCount ?? 0} applicant{(item.applicants?.length ?? item.applicationsCount ?? 0) === 1 ? '' : 's'}
              </Text>
              <Ionicons name="chevron-forward" size={12} color={Colors.text.muted} />
            </Pressable>
            <View style={styles.footerActions}>
              {busyTaskId === item.id ? (
                <ActivityIndicator size="small" color={Colors.brand.accent} />
              ) : (
                <>
                  {item.status === 'open' ? (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: Colors.semantic.error }]}
                      onPress={(e) => { e.stopPropagation(); handleDeletePress(item); }}
                    >
                      <Ionicons name="trash-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </Pressable>
                  ) : null}
                  {item.status === 'assigned' && !item.startedAt ? (
                    <Text style={styles.footerHint}>Waiting for buddy to start</Text>
                  ) : null}
                  {item.status === 'assigned' && item.startedAt && (item.paymentMode ?? 'online') === 'online' && !item.paidAt ? (
                    <Pressable
                      style={[styles.actionButton, { backgroundColor: Colors.semantic.success }]}
                      onPress={(e) => { e.stopPropagation(); handleReleasePayment(item); }}
                    >
                      <Ionicons name="cash-outline" size={12} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>
                        {item.paymentRequestedAt ? 'Release (requested)' : 'Release payment'}
                      </Text>
                    </Pressable>
                  ) : null}
                  {item.status === 'assigned' && item.startedAt && (item.paymentMode ?? 'online') === 'online' && item.paidAt ? (
                    <Text style={styles.footerHint}>Paid — share the completion code</Text>
                  ) : null}
                  {item.status === 'assigned' && item.startedAt && (item.paymentMode ?? 'online') === 'cash' ? (
                    <Text style={styles.footerHint}>Cash — pay ₹{(item.budget?.amount ?? 0) + (item.tip ?? 0)} on completion</Text>
                  ) : null}
                  {item.status === 'completed' ? (
                    <Text style={styles.footerHint}>
                      {(item.paymentMode ?? 'online') === 'online' ? (item.paidAt ? 'Payment released' : 'Completed') : 'Completed — cash settled'}
                    </Text>
                  ) : null}
                </>
              )}
            </View>
          </View>
        </Pressable>
      </MotiView>
    );
  };

  const renderEmptyState = () => (
    <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }}>
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="clipboard-outline" size={36} color={Colors.brand.accent} />
        </View>
        <Text style={styles.emptyTitle}>No tasks yet</Text>
        <Text style={styles.emptyDesc}>
          {filter !== 'all' ? `No ${getStatusLabel(filter).toLowerCase()} tasks` : 'Create your first task to get started'}
        </Text>
        {filter === 'all' ? (
          <Pressable style={styles.emptyAction} onPress={() => router.push('/create-task')}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.emptyActionText}>Create Task</Text>
          </Pressable>
        ) : null}
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      {/* In-page header with create button */}
      <ScreenHeader
        title="My tasks"
        subtitle={`${myTasks.length} task${myTasks.length === 1 ? '' : 's'} you've posted`}
        onBack={() => router.back()}
        right={
          <Pressable style={styles.addBtn} onPress={() => router.push('/create-task')} accessibilityLabel="Create task">
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTERS.map(f => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, active && { color: '#FFFFFF' }]}>
                {f === 'all' ? 'All' : getStatusLabel(f)}
              </Text>
              <View style={[styles.filterBadge, active ? styles.filterBadgeActive : styles.filterBadgeIdle]}>
                <Text style={[styles.filterBadgeText, active && { color: Colors.brand.primary }]}>
                  {myTasks.filter(t => f === 'all' || t.status === f).length}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
        ListEmptyComponent={
          // First load: skeleton cards instead of a false empty state.
          tasksLoading && myTasks.length === 0 ? (
            <SoftScreenSkeleton cards={4} style={{ paddingHorizontal: 0 }} />
          ) : (
            renderEmptyState()
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3] },
  pageTitle: { fontFamily: Typography.fontFamily.display, fontSize: 26, color: Colors.text.primary },
  pageSub: { fontFamily: Typography.fontFamily.body, fontSize: 12.5, color: Colors.text.secondary, marginTop: 2 },
  addBtn: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center', ...Shadows.buttonOrange,
  },

  filterContainer: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[2], gap: Spacing[2] },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 2, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.elevated, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  filterTabActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  filterTabText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  filterBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filterBadgeActive: { backgroundColor: '#FFFFFF' },
  filterBadgeIdle: { backgroundColor: Colors.surface.tertiary },
  filterBadgeText: { fontSize: 10, fontFamily: Typography.fontFamily.bold, color: Colors.text.secondary },

  listContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[3], paddingBottom: 40, gap: Spacing[3] },
  taskCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing[2], marginBottom: Spacing[2] },
  taskTitleContainer: { flex: 1, gap: Spacing[2] },
  taskTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, lineHeight: 22 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    paddingHorizontal: Spacing[2] + 2, paddingVertical: 3, borderRadius: BorderRadius.pill,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 10.5, fontFamily: Typography.fontFamily.semiBold, textTransform: 'capitalize' },
  editBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  taskDescription: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginBottom: Spacing[3], lineHeight: 19 },
  taskMeta: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[3], flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
  taskFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  applicantsWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  footerHint: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted },
  applicantsCount: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
    borderRadius: BorderRadius.pill, ...Shadows.buttonOrange,
  },
  actionButtonText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  emptyState: {
    paddingVertical: Spacing[12], alignItems: 'center', borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    marginTop: Spacing[4], ...Shadows.card,
  },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyTitle: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[1], paddingHorizontal: Spacing[8], lineHeight: 20 },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing[4],
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing[3], paddingHorizontal: Spacing[6], ...Shadows.buttonOrange,
  },
  emptyActionText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
});
