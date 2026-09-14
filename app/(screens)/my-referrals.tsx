/**
 * My Referrals Screen - Detailed list of all referrals
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function MyReferralsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    if (!refreshing) setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock referral data
    const mockReferrals = [
      { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', avatar: null, status: 'completed', earnings: 30, date: '2024-01-15T14:30:00Z', taskCompleted: 'Grocery Shopping', taskDate: '2024-01-15T10:00:00Z' },
      { id: '2', name: 'Mike Chen', email: 'mike.chen@email.com', avatar: null, status: 'completed', earnings: 30, date: '2024-01-12T09:15:00Z', taskCompleted: 'House Cleaning', taskDate: '2024-01-12T14:00:00Z' },
      { id: '3', name: 'Emily Davis', email: 'emily.d@email.com', avatar: null, status: 'pending', earnings: 30, date: '2024-01-10T16:45:00Z', taskCompleted: null, taskDate: null },
      { id: '4', name: 'James Wilson', email: 'james.w@email.com', avatar: null, status: 'pending', earnings: 30, date: '2024-01-08T11:20:00Z', taskCompleted: null, taskDate: null },
      { id: '5', name: 'Lisa Anderson', email: 'lisa.a@email.com', avatar: null, status: 'completed', earnings: 30, date: '2024-01-05T13:10:00Z', taskCompleted: 'Dog Walking', taskDate: '2024-01-05T16:00:00Z' },
      { id: '6', name: 'David Brown', email: 'david.b@email.com', avatar: null, status: 'cancelled', earnings: 0, date: '2024-01-03T10:00:00Z', taskCompleted: null, taskDate: null },
      { id: '7', name: 'Jennifer Lee', email: 'jennifer.l@email.com', avatar: null, status: 'completed', earnings: 30, date: '2024-01-01T15:30:00Z', taskCompleted: 'Package Delivery', taskDate: '2024-01-01T18:00:00Z' },
      { id: '8', name: 'Robert Taylor', email: 'robert.t@email.com', avatar: null, status: 'pending', earnings: 30, date: '2023-12-28T08:45:00Z', taskCompleted: null, taskDate: null },
      { id: '9', name: 'Amanda White', email: 'amanda.w@email.com', avatar: null, status: 'completed', earnings: 30, date: '2023-12-25T12:00:00Z', taskCompleted: 'Tutoring Session', taskDate: '2023-12-25T15:00:00Z' },
      { id: '10', name: 'Christopher Martin', email: 'chris.m@email.com', avatar: null, status: 'pending', earnings: 30, date: '2023-12-20T17:20:00Z', taskCompleted: null, taskDate: null },
    ];
    
    setReferrals(mockReferrals);
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReferrals();
  };

  const filteredReferrals = referrals.filter(r => filter === 'all' || r.status === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', color: '#10B981', bg: '#10B98115', icon: 'check-circle-outline' };
      case 'pending':
        return { label: 'Pending', color: '#F59E0B', bg: '#F59E0B15', icon: 'time-outline' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#EF4444', bg: '#EF444415', icon: 'close-circle-outline' };
      default:
        return { label: 'Unknown', color: '#9CA3AF', bg: '#9CA3AF15', icon: 'help-circle-outline' };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>My Referrals</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#4F46E5" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading referrals...</Text>
        </View>
      </View>
    );
  }

  // Summary stats
  const stats = {
    total: referrals.length,
    completed: referrals.filter(r => r.status === 'completed').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    cancelled: referrals.filter(r => r.status === 'cancelled').length,
    totalEarned: referrals.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.earnings, 0),
    pendingEarnings: referrals.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.earnings, 0),
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>My Referrals</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={[styles.summaryLabel, { color: isDark ? '#888' : '#666' }]}>Total Referrals</Text>
            <Text style={[styles.summaryValue, { color: isDark ? '#fff' : '#000' }]}>{stats.total}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Completed</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{stats.completed}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={[styles.summaryLabel, { color: '#F59E0B' }]}>Pending</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>Cancelled</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{stats.cancelled}</Text>
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={[styles.earningsCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={[styles.earningsLabel, { color: isDark ? '#888' : '#666' }]}>Total Earned</Text>
              <Text style={[styles.earningsValue, { color: isDark ? '#fff' : '#000' }]}>${stats.totalEarned.toFixed(2)}</Text>
            </View>
            <View style={[styles.earningsDivider, { backgroundColor: '#eee' }]} />
            <View style={styles.earningsItem}>
              <Text style={[styles.earningsLabel, { color: '#F59E0B' }]}>Pending Earnings</Text>
              <Text style={[styles.earningsValue, { color: '#F59E0B' }]}>${stats.pendingEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.filterContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <View style={styles.filterScroll}>
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'completed', label: 'Completed', count: stats.completed },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
            ].map((tab) => (
              <TouchableOpacity 
                key={tab.key}
                style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
                onPress={() => setFilter(tab.key as any)}
              >
                <Text style={[styles.filterTabText, filter === tab.key ? { color: '#fff' } : { color: isDark ? '#ddd' : '#333' }]}>{tab.label}</Text>
                <View style={[styles.filterTabCount, filter === tab.key ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: '#eee' }]}>
                  <Text style={[styles.filterTabCountText, filter === tab.key ? { color: '#fff' } : { color: isDark ? '#888' : '#666' }]}>{tab.count}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Referrals List */}
        <View style={{ marginTop: 16 }}>
          {filteredReferrals.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
              <Ionicons name={filter === 'all' ? 'people-outline' : filter === 'completed' ? 'check-circle-outline' : filter === 'pending' ? 'time-outline' : 'close-circle-outline'} size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#fff' : '#000' }, { marginTop: 16 }]}>No {filter === 'all' ? 'referrals' : filter} found</Text>
              <Text style={[styles.emptyStateText, { color: isDark ? '#888' : '#666' }, { marginTop: 8 }]}>
                {filter === 'all' 
                  ? 'Share your referral code to start earning rewards'
                  : `No ${filter} referrals at the moment`}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredReferrals.map((referral) => {
                const statusConfig = getStatusConfig(referral.status);
                return (
                  <TouchableOpacity 
                    key={referral.id} 
                    style={[styles.referralCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
                    onPress={() => {}}
                  >
                    <View style={styles.referralHeader}>
                      <View style={styles.referralAvatar}>
                        <Text style={styles.referralAvatarText}>{getInitials(referral.name)}</Text>
                      </View>
                      <View style={styles.referralInfo}>
                        <Text style={[styles.referralName, { color: isDark ? '#fff' : '#000' }]}>{referral.name}</Text>
                        <Text style={[styles.referralEmail, { color: isDark ? '#888' : '#666' }]}>{referral.email}</Text>
                      </View>
                      <View style={[styles.referralStatus, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.referralStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                      </View>
                    </View>

                    <View style={styles.referralDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={16} color={isDark ? '#888' : '#666'} style={{ marginRight: 8 }} />
                        <Text style={[styles.detailText, { color: isDark ? '#ddd' : '#444' }]}>Joined {formatDate(referral.date)}</Text>
                      </View>
                      
                      {referral.status === 'completed' && referral.taskCompleted && (
                        <View style={styles.detailRow}>
                          <Ionicons name="check-circle-outline" size={16} color="#10B981" style={{ marginRight: 8 }} />
                          <Text style={[styles.detailText, { color: '#10B981' }]}>Completed: {referral.taskCompleted}</Text>
                        </View>
                      )}

                      {referral.status === 'completed' && referral.taskDate && (
                        <View style={styles.detailRow}>
                          <Ionicons name="time-outline" size={16} color={isDark ? '#888' : '#666'} style={{ marginRight: 8 }} />
                          <Text style={[styles.detailText, { color: isDark ? '#888' : '#666' }]}>Task completed {formatDateTime(referral.taskDate)}</Text>
                        </View>
                      )}

                      <View style={[styles.detailRow, { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 8 }]}>
                        <Ionicons name={referral.status === 'completed' ? 'cash-outline' : 'cash-outline'} size={16} color={referral.status === 'completed' ? '#10B981' : '#F59E0B'} style={{ marginRight: 8 }} />
                        <Text style={[styles.detailText, { color: referral.status === 'completed' ? '#10B981' : '#F59E0B', fontFamily: 'Inter_600SemiBold' }]}>
                          {referral.status === 'completed' ? 'Earned' : 'Potential'}: ${referral.earnings.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  summaryContainer: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  summaryLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 4 },
  earningsCard: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  earningsRow: { flexDirection: 'row' },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsDivider: { width: 1, height: 40 },
  earningsLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  earningsValue: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  filterContainer: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  filterScroll: { flexDirection: 'row', gap: 10 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  filterTabActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterTabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  filterTabCount: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  filterTabCountText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  emptyState: { alignItems: 'center', paddingVertical: 48, borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
  emptyStateTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyStateText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 32 },
  listContainer: { gap: 12 },
  referralCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  referralAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4F46E515', justifyContent: 'center', alignItems: 'center' },
  referralAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#4F46E5' },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  referralEmail: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  referralStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  referralStatusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  referralDetails: { gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});