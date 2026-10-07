/**
 * My Tasks Screen - View and manage your created tasks
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/constants/design';

export default function MyTasksScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  const { 
    tasks, 
    myTasks, 
    isLoading, 
    refreshTasks,
    deleteTask,
    updateTaskStatus,
  } = useTaskStore();
  
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [refreshing, setRefreshing] = useState(false);

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

  const handleDeletePress = (task: any) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
      ]
    );
  };

  const handleStatusChange = (task: any, newStatus: string) => {
    updateTaskStatus(task.id, newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return Colors.brand.primary;
      case 'in_progress': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'cancelled': return '#EF4444';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderTaskCard = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.taskCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
      onPress={() => handleTaskPress(item)}
    >
      <View style={styles.taskCardHeader}>
        <View style={styles.taskTitleContainer}>
          <Text style={[styles.taskTitle, { color: isDark ? '#fff' : '#000' }]}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleEditPress(item); }}>
          <Ionicons name="create-outline" size={22} color={isDark ? '#888' : '#666'} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.taskDescription, { color: isDark ? '#aaa' : '#666' }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.taskMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="cash-outline" size={16} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.metaText, { color: isDark ? '#fff' : '#000' }]}>${item.budget}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={16} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.metaText, { color: isDark ? '#aaa' : '#666' }]}>{item.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={16} color={isDark ? '#888' : '#666'} />
          <Text style={[styles.metaText, { color: isDark ? '#aaa' : '#666' }]}>
            {new Date(item.deadline).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.taskFooter}>
        <Text style={[styles.applicantsCount, { color: isDark ? '#888' : '#666' }]}>
          {item.applicantsCount || 0} applicants
        </Text>
        {item.status === 'open' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: Colors.brand.primary }]}
            onPress={(e) => { e.stopPropagation(); handleStatusChange(item, 'in_progress'); }}
          >
            <Text style={styles.actionButtonText}>Start</Text>
          </TouchableOpacity>
        )}
        {item.status === 'in_progress' && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={(e) => { e.stopPropagation(); handleStatusChange(item, 'completed'); }}
          >
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
      <MaterialCommunityIcons name="clipboard-outline" size={64} color={isDark ? '#555' : '#ccc'} />
      <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>No tasks yet</Text>
      <Text style={[styles.emptyDesc, { color: isDark ? '#888' : '#666' }]}>
        {filter !== 'all' ? `No ${getStatusLabel(filter).toLowerCase()} tasks` : 'Create your first task to get started'}
      </Text>
      {filter === 'all' && (
        <TouchableOpacity style={styles.emptyAction} onPress={() => router.push('/create-task')}>
          <Text style={styles.emptyActionText}>Create Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>My Tasks</Text>
        <TouchableOpacity onPress={() => router.push('/create-task')}>
          <Ionicons name="add-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'open', 'in_progress', 'completed', 'cancelled'].map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f ? styles.filterTabActive : {},
              { backgroundColor: filter === f ? Colors.brand.primary : (isDark ? '#2a2a2a' : '#fff') }
            ]}
            onPress={() => setFilter(f as any)}
          >
            <Text style={[
              styles.filterTabText,
              { color: filter === f ? '#fff' : (isDark ? '#fff' : '#000') }
            ]}>
              {getStatusLabel(f)}
            </Text>
            <View style={[
              styles.filterBadge,
              { backgroundColor: filter === f ? '#fff3' : getStatusColor(f) }
            ]}>
              <Text style={[
                styles.filterBadgeText,
                { color: filter === f ? '#fff' : '#fff' }
              ]}>
                {myTasks.filter(t => f === 'all' || t.status === f).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[isDark ? '#fff' : Colors.brand.primary]} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32, borderWidth: 1, borderColor: '#eee' },
  filterTabActive: { borderColor: Colors.brand.primary },
  filterTabText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  filterBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  filterBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 12 },
  taskCard: { borderRadius: 28, padding: 16, borderWidth: 1, borderColor: '#eee' },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  taskTitleContainer: { flex: 1, gap: 8 },
  taskTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  taskDescription: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 12, lineHeight: 20 },
  taskMeta: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  applicantsCount: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  actionButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionButtonText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 16, borderRadius: 28, borderWidth: 1, borderColor: '#eee', marginHorizontal: 16, marginTop: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  emptyAction: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: Colors.brand.primary, borderRadius: 10 },
  emptyActionText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});