/**
 * Task Applications Screen - View and manage applications for your tasks
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';

export default function TaskApplicationsScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  const { 
    applications, 
    isLoading, 
    refreshApplications,
    acceptApplication,
    rejectApplication,
  } = useTaskStore();
  
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshApplications(taskId as string);
    setRefreshing(false);
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const handleAccept = (application: any) => {
    Alert.alert(
      'Accept Application',
      `Accept ${application.applicantName}'s application for this task?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => acceptApplication(application.id) },
      ]
    );
  };

  const handleReject = (application: any) => {
    Alert.alert(
      'Reject Application',
      `Reject ${application.applicantName}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectApplication(application.id) },
      ]
    );
  };

  const handleViewProfile = (applicantId: string) => {
    router.push({ pathname: `/(screens)/user-profile`, params: { userId: applicantId } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'accepted': return '#10B981';
      case 'rejected': return '#EF4444';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const renderApplicationCard = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.applicationCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
      onPress={() => handleViewProfile(item.applicantId)}
    >
      <View style={styles.applicationHeader}>
        <View style={styles.applicantInfo}>
          <View style={[styles.avatar, { backgroundColor: '#4F46E5' }]}>
            <Text style={styles.avatarText}>{item.applicantName.charAt(0)}</Text>
          </View>
          <View style={styles.applicantDetails}>
            <Text style={[styles.applicantName, { color: isDark ? '#fff' : '#000' }]}>{item.applicantName}</Text>
            <Text style={[styles.applicantMeta, { color: isDark ? '#888' : '#666' }]}>
              {item.applicantRating}★ • {item.applicantCompletedTasks} tasks • {item.applicantDistance}km away
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.applicationBody}>
        <Text style={[styles.applicationMessage, { color: isDark ? '#ddd' : '#333' }]}>{item.message}</Text>
        
        <View style={styles.applicationMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={16} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.metaText, { color: isDark ? '#fff' : '#000' }]}>${item.proposedBudget}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.metaText, { color: isDark ? '#aaa' : '#666' }]}>{item.estimatedHours}h</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={isDark ? '#888' : '#666'} />
            <Text style={[styles.metaText, { color: isDark ? '#aaa' : '#666' }]}>
              {new Date(item.appliedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.applicationActions}>
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => handleReject(item)}
          >
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={() => handleAccept(item)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
      <MaterialCommunityIcons name="account-group-outline" size={64} color={isDark ? '#555' : '#ccc'} />
      <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>No applications</Text>
      <Text style={[styles.emptyDesc, { color: isDark ? '#888' : '#666' }]}>
        {filter !== 'all' ? `No ${getStatusLabel(filter).toLowerCase()} applications` : 'No one has applied to this task yet'}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Applications</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'pending', 'accepted', 'rejected'].map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterTab,
              filter === f ? styles.filterTabActive : {},
              { backgroundColor: filter === f ? '#4F46E5' : (isDark ? '#2a2a2a' : '#fff') }
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
                {applications.filter(a => f === 'all' || a.status === f).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[isDark ? '#fff' : '#4F46E5']} />
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
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  filterTabActive: { borderColor: '#4F46E5' },
  filterTabText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  filterBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  filterBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 12 },
  applicationCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  applicantInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  applicantDetails: { gap: 2 },
  applicantName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  applicantMeta: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  applicationBody: { marginBottom: 12 },
  applicationMessage: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 12 },
  applicationMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  applicationActions: { flexDirection: 'row', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  rejectButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center' },
  rejectButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
  acceptButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center' },
  acceptButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  emptyState: { paddingVertical: 60, alignItems: 'center', gap: 16, borderRadius: 16, borderWidth: 1, borderColor: '#eee', marginHorizontal: 16, marginTop: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
});