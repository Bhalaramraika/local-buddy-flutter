/**
 * Task Reviews Screen — Soft Modern
 * Cocoa rating hero, orange rating bars, white review cards
 * with star rows + given/received badges. Fetch logic unchanged.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftSkeleton } from '@/components/ui';
import { useTaskStore } from '@/store/taskStore';

// Hoisted out of the screen component — defining components during render
// resets their state on each render and violates react-hooks/static-components.
const StarRow = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <Ionicons key={s} name={s <= Math.round(rating) ? 'star' : 'star-outline'} size={size} color={Colors.semantic.warning} />
    ))}
  </View>
);

export default function TaskReviewsScreen() {
  const router = useRouter();
  const { reviews, isLoading, fetchReviews } = useTaskStore();

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

  const receivedReviews = reviews.filter(r => r.type === 'received');
  const overallRating = receivedReviews.length
    ? receivedReviews.reduce((s, r) => s + r.rating, 0) / receivedReviews.length
    : 0;

  const handleReviewPress = (review: any) => {
    Alert.alert(
      review.type === 'given' ? 'Your Review' : 'Review Received',
      `${review.comment}\n\nRating: ${'★'.repeat(Math.floor(review.rating))} (${review.rating.toFixed(1)})`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: Spacing[5], paddingTop: Spacing[5] }}>
        <ScreenHeader title="Reviews" subtitle="Ratings you give and receive" onBack={() => router.back()} style={{ marginBottom: 0 }} />
      </View>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'received', 'given'] as const).map((tab) => {
          const active = filter === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, active && { color: '#FFFFFF' }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
      >
        {/* Rating hero — cocoa card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440 }}
          style={styles.heroCard}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroScore}>{overallRating.toFixed(1)}</Text>
            <StarRow rating={overallRating} size={16} />
            <Text style={styles.heroSub}>{receivedReviews.length} reviews received</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="star" size={40} color="#FFFFFF" />
          </View>
        </MotiView>

        {/* Summary strip */}
        <View style={styles.summaryRow}>
          {[
            { icon: 'star' as const, label: 'Avg rating', value: overallRating.toFixed(1), color: Colors.semantic.warning },
            { icon: 'download' as const, label: 'Received', value: String(receivedReviews.length), color: Colors.semantic.success },
            { icon: 'send' as const, label: 'Given', value: String(reviews.filter(r => r.type === 'given').length), color: Colors.brand.accent },
          ].map((item, i) => (
            <MotiView
              key={item.label}
              from={{ opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 380, delay: 100 + i * 70 }}
              style={{ flex: 1 }}
            >
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: item.color + '1A' }]}>
                  <Ionicons name={item.icon} size={15} color={item.color} />
                </View>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
            </MotiView>
          ))}
        </View>

        {/* Reviews List */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 300 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Reviews</Text>

          {isLoading ? (
            // Skeleton rows while reviews load (no spinner/text placeholder).
            <View style={{ gap: Spacing[3], marginTop: Spacing[2] }}>
              {[0, 1, 2].map((i) => (
                <SoftSkeleton key={i} height={72} borderRadius={BorderRadius.md} />
              ))}
            </View>
          ) : filteredReviews.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbox-ellipses-outline" size={30} color={Colors.brand.accent} />
              </View>
              <Text style={styles.emptyTitle}>No reviews found</Text>
              <Text style={styles.emptyDesc}>Complete tasks to start receiving reviews</Text>
            </View>
          ) : (
            <View>
              {filteredReviews.map((review, index) => (
                <Pressable
                  key={review.id}
                  style={[styles.reviewItem, index < filteredReviews.length - 1 && styles.reviewItemDivider]}
                  onPress={() => handleReviewPress(review)}
                >
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAvatar}>
                      <Text style={styles.reviewAvatarText}>{(review.reviewerName?.charAt(0) || 'U').toUpperCase()}</Text>
                    </View>
                    <View style={styles.reviewInfo}>
                      <View style={styles.reviewNameRow}>
                        <Text style={styles.reviewerName} numberOfLines={1}>{review.reviewerName}</Text>
                        <View style={[styles.reviewTypeBadge, review.type === 'given' ? styles.reviewTypeGiven : styles.reviewTypeReceived]}>
                          <Ionicons name={review.type === 'given' ? 'send' : 'download'} size={10} color={review.type === 'given' ? Colors.brand.accentPressed : Colors.semantic.success} />
                          <Text style={[styles.reviewTypeText, { color: review.type === 'given' ? Colors.brand.accentPressed : Colors.semantic.success }]}>
                            {review.type === 'given' ? 'Given' : 'Received'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewMeta}>
                        <Text style={styles.reviewTask} numberOfLines={1}>{review.taskTitle}</Text>
                        <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('en-IN')}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.reviewRating}>
                    <StarRow rating={review.rating} />
                    <Text style={styles.reviewRatingValue}>{review.rating.toFixed(1)}</Text>
                  </View>

                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  filterContainer: {
    flexDirection: 'row', gap: Spacing[2],
    paddingHorizontal: Spacing[5], paddingTop: Spacing[4],
  },
  filterTab: {
    paddingHorizontal: Spacing[4] + 2, paddingVertical: Spacing[2] + 2, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.elevated, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  filterTabActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  filterTabText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },

  scrollContent: { padding: Spacing[5], paddingBottom: 40 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.xl,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.button,
  },
  heroLeft: { flex: 1, gap: 5 },
  heroScore: { fontSize: 42, fontFamily: Typography.fontFamily.display, color: '#FFFFFF', lineHeight: 46 },
  heroSub: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.75)' },
  heroBadge: {
    width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },

  summaryRow: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[4] },
  summaryCard: {
    alignItems: 'center', borderRadius: BorderRadius.lg, paddingVertical: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  summaryIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  summaryValue: { fontSize: 17, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  summaryLabel: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },

  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[3] },

  loadingContainer: { alignItems: 'center', paddingVertical: Spacing[8] },
  loadingText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing[8] },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyTitle: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 4, textAlign: 'center' },

  reviewItem: { paddingVertical: Spacing[4] },
  reviewItemDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  reviewHeader: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[2] },
  reviewAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  reviewAvatarText: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  reviewInfo: { flex: 1 },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: 3 },
  reviewerName: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flexShrink: 1 },
  reviewTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: BorderRadius.pill },
  reviewTypeGiven: { backgroundColor: Colors.brand.accentSoft },
  reviewTypeReceived: { backgroundColor: Colors.semantic.successSoft },
  reviewTypeText: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold },
  reviewMeta: { flexDirection: 'row', gap: Spacing[2] },
  reviewTask: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary, flexShrink: 1 },
  reviewDate: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  reviewRating: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  reviewRatingValue: { fontSize: 13, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  reviewComment: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 20 },
});
