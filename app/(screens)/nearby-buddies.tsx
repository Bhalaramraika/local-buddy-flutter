/**
 * Nearby Buddies Screen - Discover nearby task buddies
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
import { useAuthStore } from '@/store/authStore';

interface NearbyBuddy {
  id: string;
  name: string;
  avatar: string;
  distance: string;
  rating: number;
  reviewCount: number;
  skills: string[];
  hourlyRate: number;
  isOnline: boolean;
  lastActive: string;
  completedTasks: number;
  responseTime: string;
}

export default function NearbyBuddiesScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  
  const isDark = theme === 'dark';
  const [buddies, setBuddies] = useState<NearbyBuddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online' | 'top-rated' | 'closest'>('all');
  const [radius, setRadius] = useState(10); // km

  const mockBuddies: NearbyBuddy[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'SC',
      distance: '0.8 km',
      rating: 4.9,
      reviewCount: 127,
      skills: ['Cleaning', 'Organization', 'Pet Care'],
      hourlyRate: 25,
      isOnline: true,
      lastActive: 'Active now',
      completedTasks: 234,
      responseTime: '5 min',
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      avatar: 'MJ',
      distance: '1.2 km',
      rating: 4.8,
      reviewCount: 89,
      skills: ['Handyman', 'Furniture Assembly', 'Repairs'],
      hourlyRate: 35,
      isOnline: true,
      lastActive: 'Active 2 min ago',
      completedTasks: 156,
      responseTime: '8 min',
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      avatar: 'ER',
      distance: '2.1 km',
      rating: 4.7,
      reviewCount: 203,
      skills: ['Tutoring', 'Language Help', 'Homework'],
      hourlyRate: 30,
      isOnline: false,
      lastActive: 'Active 1 hour ago',
      completedTasks: 312,
      responseTime: '15 min',
    },
    {
      id: '4',
      name: 'David Kim',
      avatar: 'DK',
      distance: '2.5 km',
      rating: 4.9,
      reviewCount: 67,
      skills: ['Tech Support', 'Device Setup', 'Troubleshooting'],
      hourlyRate: 40,
      isOnline: true,
      lastActive: 'Active now',
      completedTasks: 98,
      responseTime: '3 min',
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      avatar: 'LT',
      distance: '3.0 km',
      rating: 4.6,
      reviewCount: 145,
      skills: ['Grocery Shopping', 'Errands', 'Meal Prep'],
      hourlyRate: 22,
      isOnline: false,
      lastActive: 'Active 3 hours ago',
      completedTasks: 187,
      responseTime: '20 min',
    },
    {
      id: '6',
      name: 'James Wilson',
      avatar: 'JW',
      distance: '3.5 km',
      rating: 4.8,
      reviewCount: 92,
      skills: ['Moving Help', 'Heavy Lifting', 'Transport'],
      hourlyRate: 30,
      isOnline: true,
      lastActive: 'Active 5 min ago',
      completedTasks: 112,
      responseTime: '10 min',
    },
  ];


  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBuddies();
    setRefreshing(false);
  };

  const loadBuddies = async () => {
    // Yield before touching state so React never sees sync setState in the mount effect
    await Promise.resolve();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setBuddies(mockBuddies);
    setLoading(false);
  };

  useEffect(() => {
    // Defer data loading past the first commit so no sync setState happens in the effect body
    void Promise.resolve().then(() => {     loadBuddies(); });
  }, []);

  const filteredBuddies = buddies.filter(buddy => {
    if (filter === 'online') return buddy.isOnline;
    if (filter === 'top-rated') return buddy.rating >= 4.8;
    if (filter === 'closest') return parseFloat(buddy.distance) <= 2;
    return true;
  }).sort((a, b) => {
    if (filter === 'closest') return parseFloat(a.distance) - parseFloat(b.distance);
    if (filter === 'top-rated') return b.rating - a.rating;
    return 0;
  });

  const getSkillColor = (skill: string) => {
    const colors: Record<string, string> = {
      'Cleaning': '#4F46E5',
      'Organization': '#10B981',
      'Pet Care': '#F59E0B',
      'Handyman': '#EF4444',
      'Furniture Assembly': '#8B5CF6',
      'Repairs': '#EC4899',
      'Tutoring': '#06B6D4',
      'Language Help': '#14B8A6',
      'Homework': '#F97316',
      'Tech Support': '#6366F1',
      'Device Setup': '#84CC16',
      'Troubleshooting': '#EAB308',
      'Grocery Shopping': '#22C55E',
      'Errands': '#06B6D4',
      'Meal Prep': '#F97316',
      'Moving Help': '#EF4444',
      'Heavy Lifting': '#78716C',
      'Transport': '#3B82F6',
    };
    return colors[skill] || '#6B7280';
  };

  const renderBuddy = ({ item }: { item: NearbyBuddy }) => (
    <TouchableOpacity 
      style={styles.buddyCard}
      onPress={() => router.push({ pathname: `/(screens)/user-profile`, params: { userId: item.id } })}
    >
      <View style={styles.buddyHeader}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: item.isOnline ? '#10B981' : '#6B7280' }]}>
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </View>
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.buddyInfo}>
          <View style={styles.buddyNameRow}>
            <Text style={[styles.buddyName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
            <View style={[styles.ratingBadge, { backgroundColor: item.rating >= 4.8 ? '#F59E0B15' : '#4F46E515' }]}>
              <Ionicons name="star" size={12} color={item.rating >= 4.8 ? '#F59E0B' : '#4F46E5'} />
              <Text style={[styles.ratingText, { color: item.rating >= 4.8 ? '#F59E0B' : '#4F46E5' }]}>{item.rating}</Text>
            </View>
          </View>
          <View style={styles.buddyMeta}>
            <Text style={[styles.distanceText, { color: isDark ? '#888' : '#666' }]}>
              <Ionicons name="location-outline" size={12} color={isDark ? '#666' : '#999'} style={{ marginRight: 4 }} />
              {item.distance} away
            </Text>
            <Text style={[styles.metaText, { color: isDark ? '#666' : '#999' }]}>{item.reviewCount} reviews • {item.completedTasks} tasks</Text>
          </View>
        </View>
      </View>

      <View style={styles.skillsContainer}>
        {item.skills.slice(0, 3).map((skill, index) => (
          <View key={index} style={[styles.skillTag, { backgroundColor: `${getSkillColor(skill)}15` }]}>
            <Text style={[styles.skillText, { color: getSkillColor(skill) }]}>{skill}</Text>
          </View>
        ))}
        {item.skills.length > 3 && (
          <View style={[styles.skillTag, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
            <Text style={[styles.skillText, { color: isDark ? '#888' : '#666' }]}>+{item.skills.length - 3} more</Text>
          </View>
        )}
      </View>

      <View style={styles.buddyFooter}>
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: isDark ? '#888' : '#666' }]}>Rate</Text>
          <Text style={[styles.footerValue, { color: isDark ? '#fff' : '#000' }]}>${item.hourlyRate}/hr</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: isDark ? '#888' : '#666' }]}>Response</Text>
          <Text style={[styles.footerValue, { color: isDark ? '#fff' : '#000' }]}>{item.responseTime}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerItem}>
          <Text style={[styles.footerLabel, { color: isDark ? '#888' : '#666' }]}>Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isOnline ? '#10B981' : '#6B7280' }]} />
            <Text style={[styles.statusText, { color: item.isOnline ? '#10B981' : (isDark ? '#888' : '#666')}]}>{item.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Nearby Buddies</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#888' : '#666' }]}>{filteredBuddies.length} buddies nearby</Text>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Filters', 'Advanced filters coming soon')}>
          <Ionicons name="funnel-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Search & Radius */}
      <View style={[styles.searchSection, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }]}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#666' : '#999'} style={styles.searchIcon} />
          <Text style={[styles.searchPlaceholder, { color: isDark ? '#666' : '#999' }]}>Search buddies by skill, name...</Text>
        </View>
        <View style={styles.radiusControl}>
          <Text style={[styles.radiusLabel, { color: isDark ? '#fff' : '#000' }]}>Search Radius: {radius} km</Text>
          <View style={styles.sliderContainer}>
            <View style={[styles.sliderTrack, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
              <View style={[styles.sliderProgress, { backgroundColor: '#4F46E5', width: `${(radius / 50) * 100}%` }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: isDark ? '#333' : '#eee' }]}>
        {['all', 'online', 'top-rated', 'closest'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterTab,
              filter === tab && styles.filterTabActive,
              { backgroundColor: filter === tab ? '#4F46E5' : (isDark ? '#2a2a2a' : '#f0f0f0') }
            ]}
            onPress={() => setFilter(tab as any)}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab ? styles.filterTabTextActive : {},
              { color: filter === tab ? '#fff' : (isDark ? '#fff' : '#000') }
            ]}>
              {tab === 'all' ? 'All' : tab === 'online' ? 'Online' : tab === 'top-rated' ? 'Top Rated' : 'Closest'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Buddies List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[isDark ? '#fff' : '#000']} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Finding nearby buddies...</Text>
          </View>
        ) : filteredBuddies.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }, { marginTop: 12 }]}>No buddies found</Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#666' : '#999' }, { marginTop: 4 }]}>Try adjusting your search radius or filters</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBuddies}
            renderItem={renderBuddy}
            keyExtractor={item => item.id}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={isDark ? '#555' : '#ccc'} />
                <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }, { marginTop: 12 }]}>No buddies match your filters</Text>
              </View>
            )}
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  searchSection: { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  searchIcon: { marginRight: 10 },
  searchPlaceholder: { fontSize: 15, fontFamily: 'Inter_400Regular', flex: 1 },
  radiusControl: { gap: 8 },
  radiusLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  sliderContainer: { height: 20 },
  sliderTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  sliderProgress: { height: '100%', borderRadius: 2 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterTabActive: {},
  filterTabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  filterTabTextActive: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 40 },
  separator: { height: 16 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  buddyCard: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  buddyHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', borderWidth: 3, borderColor: '#fff' },
  buddyInfo: { flex: 1 },
  buddyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  buddyName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  ratingText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  buddyMeta: { gap: 2 },
  distanceText: { fontSize: 13, fontFamily: 'Inter_400Regular', flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  skillTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  skillText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  buddyFooter: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  footerItem: { flex: 1, alignItems: 'center' },
  footerDivider: { width: 1, height: 32, backgroundColor: '#eee' },
  footerLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  footerValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});