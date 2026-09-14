/**
 * Tasks Screen - Browse and manage tasks
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatDistance, formatRelativeTime } from '@/utils/helpers';

export default function TasksScreen() {
  const router = useRouter();
  const { nearbyTasks: storedNearbyTasks, myTasks: storedMyTasks, assignedTasks: storedAssignedTasks, getFilteredTasks, setFilters } = useTaskStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'nearby' | 'my' | 'applied'>('nearby');

  const isDark = theme === 'dark';
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

  const renderTask = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.taskCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
      onPress={() => router.push(`/(screens)/task-detail/${item.id}`)}
    >
      <View style={styles.taskHeader}>
        <View style={[styles.taskCategory, { backgroundColor: `${item.categoryColor}20` }]}>
          <Text style={[styles.taskCategoryText, { color: item.categoryColor }]}>{item.category}</Text>
        </View>
        <View style={styles.taskStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
          <Text style={[styles.taskStatusText, { color: item.statusColor }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.taskTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>{item.title}</Text>
      <Text style={[styles.taskDescription, { color: isDark ? '#aaa' : '#666' }]} numberOfLines={2}>{item.description}</Text>
      <View style={styles.taskMeta}>
        <View style={styles.taskMetaItem}>
          <Ionicons name="location-outline" size={14} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.taskMetaText, { color: isDark ? '#888' : '#666' }]}>{formatDistance(item.distance)}</Text>
        </View>
        <View style={styles.taskMetaItem}>
          <Ionicons name="cash-outline" size={14} color="#10B981" />
          <Text style={[styles.taskMetaText, { color: '#10B981' }]}>{formatCurrency(item.budget)}</Text>
        </View>
        <View style={styles.taskMetaItem}>
          <Ionicons name="time-outline" size={14} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.taskMetaText, { color: isDark ? '#888' : '#666' }]}>{item.duration}</Text>
        </View>
        <View style={styles.taskMetaItem}>
          <Ionicons name="person-outline" size={14} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.taskMetaText, { color: isDark ? '#888' : '#666' }]}>{item.applicantsCount}/{item.maxApplicants}</Text>
        </View>
      </View>
      <View style={styles.taskFooter}>
        <Text style={[styles.taskPosted, { color: isDark ? '#888' : '#666' }]}>Posted {formatRelativeTime(item.createdAt)}</Text>
        {activeTab === 'nearby' && (
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.authPrompt}>
          <MaterialCommunityIcons name="clipboard-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Find Local Tasks</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Sign in to browse and apply for tasks near you</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDark ? '#888' : '#999'}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-outline" size={20} color={isDark ? '#888' : '#666'} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => router.push('/(screens)/task-filters')}>
          <Ionicons name="funnel-outline" size={22} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? '#4F46E5' : isDark ? '#888' : '#666' }]}>{tab.label}</Text>
            {tab.count > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.id ? '#4F46E5' : '#eee' }]}>
                <Text style={[styles.tabBadgeText, { color: activeTab === tab.id ? '#fff' : '#4F46E5' }]}>{tab.count > 99 ? '99+' : tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={[styles.tabIndicator, { backgroundColor: '#4F46E5' }, { transform: [{ translateX: activeTab === 'nearby' ? 0 : activeTab === 'my' ? 100 : 200 }] }]} />
      </View>

      {/* Task List */}
      <FlatList
        data={filteredTasks()}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <MaterialCommunityIcons name="clipboard-outline" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#000' }]}>No tasks found</Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#888' : '#666' }]}>
              {activeTab === 'nearby' ? 'No tasks nearby. Try adjusting your filters.' : 
               activeTab === 'my' ? 'You haven\'t posted any tasks yet.' : 
               'You haven\'t applied to any tasks yet.'}
            </Text>
            {activeTab === 'my' && (
              <TouchableOpacity style={styles.createTaskButton} onPress={() => router.push('/(screens)/create-task')}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createTaskButtonText}>Create Task</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(screens)/create-task')}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 8 },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  filterButton: { padding: 8, marginLeft: 8 },
  tabBar: { flexDirection: 'row', position: 'relative', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  tabButtonActive: {},
  tabLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 3, width: 80, borderRadius: 3, transition: 'transform 0.3s' },
  listContent: { padding: 16, paddingBottom: 100 },
  taskCard: { marginBottom: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskCategory: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  taskCategoryText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
  taskStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  taskStatusText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  taskTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  taskDescription: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12, lineHeight: 18 },
  taskMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 12 },
  taskMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  taskPosted: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  applyButton: { backgroundColor: '#4F46E5', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 8 },
  applyButtonText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, marginTop: 40 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  createTaskButton: { marginTop: 20, backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  createTaskButtonText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
});