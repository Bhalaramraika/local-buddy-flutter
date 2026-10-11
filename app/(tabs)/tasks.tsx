/**
 * Tasks Screen — Soft Modern
 * Cream canvas, pill search bar, cocoa segmented tabs,
 * white soft-shadowed task cards, orange FAB with Moti pop.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, TextInput, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton } from '@/components/ui';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatDistance, formatRelativeTime } from '@/utils/helpers';

export default function TasksScreen() {
  const router = useRouter();
  const { nearbyTasks: storedNearbyTasks, myTasks: storedMyTasks, assignedTasks: storedAssignedTasks, getFilteredTasks, setFilters } = useTaskStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const systemScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'nearby' | 'my' | 'applied'>('nearby');

  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const nearbyTasks = storedNearbyTasks ?? [];
  const myTasks = storedMyTasks ?? [];
  const assignedTasks = storedAssignedTasks ?? [];

  useEffect(() => {
    if (!isAuthenticated) return;
    setFilters({});
  }, [isAuthenticated, setFilters]);

  const onRefresh = async () => {
    setRefreshing(true);
    setFilters({});
    setRefreshing(false);
  };

  const filteredTasks = () => {
    let taskList = [];
    switch (activeTab) {
      case 'nearby':
        taskList = nearbyTasks.length > 0 ? nearbyTasks : (getFilteredTasks() ?? []);
        break;
      case 'my':
        taskList = myTasks;
        break;
      case 'applied':
        taskList = assignedTasks;
        break;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      taskList = taskList.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query)
      );
    }

    return taskList;
  };

  const tabs = [
    { id: 'nearby', label: 'Nearby', count: nearbyTasks?.length ?? 0 },
    { id: 'my', label: 'My Tasks', count: myTasks?.length ?? 0 },
    { id: 'applied', label: 'Applied', count: assignedTasks?.length ?? 0 },
  ];

  const renderTask = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 380, delay: Math.min(index, 6) * 60 }}
    >
      <Pressable
        style={({ pressed }) => [styles.taskCard, pressed && { transform: [{ scale: 0.985 }] }]}
        onPress={() => router.push({ pathname: `/(screens)/task-detail`, params: { taskId: item.id } })}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskCategory}>
            <Text style={styles.taskCategoryText}>{item.category}</Text>
          </View>
          <View style={styles.taskStatus}>
            <View style={[styles.statusDot, { backgroundColor: item.statusColor || Colors.semantic.success }]} />
            <Text style={[styles.taskStatusText, { color: item.statusColor || Colors.semantic.success }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.taskTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.taskDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.taskMeta}>
          <View style={styles.taskMetaItem}>
            <Ionicons name="location-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.taskMetaText}>{formatDistance(item.distance)}</Text>
          </View>
          <View style={styles.taskMetaItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.semantic.success} />
            <Text style={[styles.taskMetaText, { color: Colors.semantic.success, fontFamily: Typography.fontFamily.semiBold }]}>{formatCurrency(item.budget?.amount ?? 0)}</Text>
          </View>
          <View style={styles.taskMetaItem}>
            <Ionicons name="time-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.taskMetaText}>{item.duration}</Text>
          </View>
          <View style={styles.taskMetaItem}>
            <Ionicons name="person-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.taskMetaText}>{item.applicantsCount}/{item.maxApplicants}</Text>
          </View>
        </View>
        <View style={styles.taskFooter}>
          <Text style={styles.taskPosted}>Posted {formatRelativeTime(item.createdAt)}</Text>
          {activeTab === 'nearby' && (
            <Pressable style={styles.applyButton} onPress={() => router.push({ pathname: `/(screens)/task-detail`, params: { taskId: item.id } })}>
              <Text style={styles.applyButtonText}>Apply</Text>
              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </Pressable>
    </MotiView>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450 }}
          style={styles.authPrompt}
        >
          <View style={styles.authIconWrap}>
            <Ionicons name="clipboard" size={40} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Find Local Tasks</Text>
          <Text style={styles.authSubtitle}>Sign in to browse and apply for tasks near you</Text>
          <SoftButton label="Sign in" variant="accent" fullWidth={false} icon="arrow-forward" onPress={() => router.push('/login')} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} withGlow />
        </MotiView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <Text style={styles.pageTitle}>Tasks</Text>
        <Text style={styles.pageSubtitle}>Browse, post and track work around you</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.muted}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable style={styles.filterButton} onPress={() => router.push('/(screens)/task-filters')}>
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Segmented Tabs */}
      <View style={styles.segWrap}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.segButton, active && styles.segButtonActive]}
              onPress={() => setActiveTab(tab.id as any)}
            >
              <Text style={[styles.segLabel, active && styles.segLabelActive]}>{tab.label}</Text>
              {tab.count > 0 && (
                <View style={[styles.segBadge, active ? styles.segBadgeActive : styles.segBadgeIdle]}>
                  <Text style={[styles.segBadgeText, active ? styles.segBadgeTextActive : styles.segBadgeTextIdle]}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks()}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconWrap}>
              <Ionicons name="clipboard-outline" size={36} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyText}>No tasks found</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'nearby' ? 'No tasks nearby. Try adjusting your filters.' :
               activeTab === 'my' ? 'You haven\'t posted any tasks yet.' :
               'You haven\'t applied to any tasks yet.'}
            </Text>
            {activeTab === 'my' && (
              <SoftButton label="Create Task" variant="accent" icon="add" fullWidth={false} onPress={() => router.push('/(screens)/create-task')} style={{ paddingHorizontal: Spacing[7], marginTop: Spacing[5] }} withGlow />
            )}
          </MotiView>
        }
      />

      {/* Floating Action Button */}
      <MotiView
        from={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 300 }}
        style={styles.fabWrap}
      >
        <Pressable style={styles.fab} onPress={() => router.push('/(screens)/create-task')} accessibilityLabel="Create task">
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </Pressable>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  headerWrap: { paddingHorizontal: Spacing[5], paddingTop: Spacing[6], paddingBottom: Spacing[4] },
  pageTitle: { fontFamily: Typography.fontFamily.display, fontSize: 30, lineHeight: 38, color: Colors.text.primary },
  pageSubtitle: { fontFamily: Typography.fontFamily.body, fontSize: 13, color: Colors.text.secondary, marginTop: 3 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], gap: Spacing[3] },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], height: 52, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },
  filterButton: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadows.button,
  },

  segWrap: {
    flexDirection: 'row', marginHorizontal: Spacing[5], marginTop: Spacing[4],
    backgroundColor: Colors.surface.tertiary, borderRadius: BorderRadius.pill, padding: 5,
  },
  segButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing[2] + 2, borderRadius: BorderRadius.pill,
  },
  segButtonActive: { backgroundColor: Colors.brand.primary, ...Shadows.button },
  segLabel: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  segLabelActive: { color: '#FFFFFF' },
  segBadge: { minWidth: 19, height: 19, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  segBadgeActive: { backgroundColor: Colors.brand.accent },
  segBadgeIdle: { backgroundColor: Colors.surface.elevated },
  segBadgeText: { fontSize: 10, fontFamily: Typography.fontFamily.bold },
  segBadgeTextActive: { color: '#FFFFFF' },
  segBadgeTextIdle: { color: Colors.brand.accent },

  listContent: { padding: Spacing[5], paddingBottom: 120 },
  taskCard: {
    marginBottom: Spacing[4], padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  taskCategory: { paddingHorizontal: Spacing[3], paddingVertical: 5, borderRadius: BorderRadius.pill, backgroundColor: Colors.brand.accentSoft },
  taskCategoryText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, textTransform: 'uppercase', letterSpacing: 0.6, color: Colors.brand.accentPressed },
  taskStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  taskStatusText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, textTransform: 'capitalize' },
  taskTitle: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: 4, lineHeight: 23 },
  taskDescription: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginBottom: Spacing[3], lineHeight: 19 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[4], marginBottom: Spacing[3] },
  taskMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
  taskFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  taskPosted: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  applyButton: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.accent, paddingVertical: 8, paddingHorizontal: Spacing[5],
    borderRadius: BorderRadius.pill, ...Shadows.buttonOrange,
  },
  applyButtonText: { color: '#FFFFFF', fontSize: 13, fontFamily: Typography.fontFamily.semiBold },

  emptyState: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8], marginTop: Spacing[12] },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyText: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptySubtext: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center', lineHeight: 20 },

  fabWrap: { position: 'absolute', bottom: 110, right: Spacing[5] },
  fab: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.brand.accent,
    justifyContent: 'center', alignItems: 'center', ...Shadows.buttonOrange,
  },

  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  authIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  authTitle: { fontSize: 27, fontFamily: Typography.fontFamily.display, marginTop: Spacing[5], textAlign: 'center', color: Colors.text.primary },
  authSubtitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center', lineHeight: 21 },
});
