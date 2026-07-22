/**
 * Task Reviews Screen - View and manage task reviews/ratings
 */

import React from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useTaskStore } from '@/store/taskStore';

export default function TaskReviewsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { reviews, isLoading, fetchReviews } = useTaskStore();
  
  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = React.useState(false);
  const [filter, setFilter] = React.useState<'all' | 'given' | 'received'>('all');

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    if (filter === 'given') return review.type === 'given';
    if (filter === 'received') return review.type === 'received';
    return true;
  });

  const getStarRating = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const handleReviewPress = (review: any) => {
    Alert.alert(
      review.type === 'given' ? 'Your Review' : 'Review Received',
      `${review.comment}\n\nRating: ${getStarRating(review.rating)} (${rating.toFixed(1)})`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Task Reviews</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        {['all', 'received', 'given'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.filterTab,
              filter === tab && styles.filterTabActive,
              { backgroundColor: filter === tab ? '#4F46E5' : (isDark ? '#2a2a2a' : '#f0f0f0') }
            ]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab ? styles.filterTabTextActive : {},
              { color: filter === tab ? '#fff' : (isDark ? '#fff' : '#000') }
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[isDark ? '#fff' : '#000']} />
        }
      >
        {/* Summary Stats */}
        <View style={styles.summaryContainer}>
          <ReviewStatCard
            title="Overall Rating"
            value="4.8"
            subtitle="127 reviews"
            icon="star-outline"
            color="#F59E0B"
            isDark={isDark}
          />
          <ReviewStatCard
            title="Reviews Given"
            value="42"
            subtitle="Average: 4.7"
            icon="send-outline"
            color="#4F46E5"
            isDark={isDark}
          />
          <ReviewStatCard
            title="Reviews Received"
            value="85"
            subtitle="Average: 4.9"
            icon="receive-outline"
            color="#10B981"
            isDark={isDark}
          />
        </View>

        {/* Rating Breakdown */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginHorizontal: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Rating Breakdown</Text>
          
          <View style={styles.ratingBreakdown}>
            {[5, 4, 3, 2, 1].map((star) => (
              <View key={star} style={styles.ratingRow}>
                <Text style={[styles.ratingStarLabel, { color: isDark ? '#fff' : '#000' }]}>{star}★</Text>
                <View style={styles.ratingBarContainer}>
                  <View style={styles.ratingBarBg}>
                    <View style={[styles.ratingBarFill, { width: `${star === 5 ? 65 : star === 4 ? 20 : star === 3 ? 10 : star === 2 ? 3 : 2}%` }]} />
                  </View>
                </View>
                <Text style={[styles.ratingCount, { color: isDark ? '#888' : '#666' }]}>{star === 5 ? '82' : star === 4 ? '25' : star === 3 ? '12' : star === 2 ? '5' : '3'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews List */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginHorizontal: 16, marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Reviews</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Loading reviews...</Text>
            </View>
          ) : filteredReviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }, { marginTop: 12 }]}>No reviews found</Text>
              <Text style={[styles.emptyDesc, { color: isDark ? '#666' : '#999' }, { marginTop: 4 }]}>Complete tasks to start receiving reviews</Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {filteredReviews.map((review, index) => (
                <TouchableOpacity
                  key={review.id}
                  style={[styles.reviewItem, { borderBottomWidth: index < filteredReviews.length - 1 ? 1 : 0, borderBottomColor: '#eee' }]}
                  onPress={() => handleReviewPress(review)}
                >
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{review.reviewerName?.charAt(0) || 'U'}</Text>
                    </View>
                    <View style={styles.reviewInfo}>
                      <View style={styles.reviewNameRow}>
                        <Text style={[styles.reviewerName, { color: isDark ? '#fff' : '#000' }]}>{review.reviewerName}</Text>
                        <View style={styles.reviewTypeBadge}>
                          <Ionicons name={review.type === 'given' ? 'send-outline' : 'receive-outline'} size={12} color="#4F46E5" />
                          <Text style={[styles.reviewTypeText, { color: '#4F46E5' }]}>{review.type === 'given' ? 'Given' : 'Received'}</Text>
                        </View>
                      </View>
                      <View style={styles.reviewMeta}>
                        <Text style={[styles.reviewTask, { color: isDark ? '#888' : '#666' }]}>{review.taskTitle}</Text>
                        <Text style={[styles.reviewDate, { color: isDark ? '#666' : '#999' }]}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.reviewRating}>
                    <Text style={[styles.reviewStars, { color: '#F59E0B' }]}>{getStarRating(review.rating)}</Text>
                    <Text style={[styles.reviewRatingValue, { color: isDark ? '#fff' : '#000' }]}>{review.rating.toFixed(1)}</Text>
                  </View>
                  
                  <Text style={[styles.reviewComment, { color: isDark ? '#ddd' : '#333' }]}>{review.comment}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const ReviewStatCard = ({ title, value, subtitle, icon, color, isDark }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statCardIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.statCardContent}>
      <Text style={[styles.statCardValue, { color: isDark ? '#fff' : '#000' }]}>{value}</Text>
      <Text style={[styles.statCardTitle, { color: isDark ? '#888' : '#666' }]}>{title}</Text>
      <Text style={[styles.statCardSubtitle, { color: isDark ? '#666' : '#999' }]}>{subtitle}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterTab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  filterTabActive: { },
  filterTabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  filterTabTextActive: { color: '#fff' },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  summaryContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: isDark ? '#2a2a2a' : '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  statCardIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statCardValue: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  statCardTitle: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  statCardSubtitle: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  ratingBreakdown: { gap: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ratingStarLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', width: 30 },
  ratingBarContainer: { flex: 1, height: 6 },
  ratingBarBg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  ratingBarFill: { height: '100%', borderRadius: 3, backgroundColor: '#F59E0B' },
  ratingCount: { fontSize: 13, fontFamily: 'Inter_500Medium', width: 30, textAlign: 'right' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  reviewsList: { },
  reviewItem: { paddingVertical: 16 },
  reviewHeader: { flexDirection: 'row', marginBottom: 12 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  reviewAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  reviewInfo: { flex: 1 },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reviewerName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  reviewTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#4F46E515', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  reviewTypeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  reviewMeta: { gap: 2 },
  reviewTask: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  reviewDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reviewStars: { fontSize: 16 },
  reviewRatingValue: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  reviewComment: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
});