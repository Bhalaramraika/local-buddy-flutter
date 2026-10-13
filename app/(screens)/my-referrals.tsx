/**
 * My Referrals Screen — Soft Modern
 * 4-tile stats strip, cocoa earnings card, pill filter tabs,
 * white referral cards with status badges. Load logic unchanged.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';
import { useRouter } from 'expo-router';
import { cachedApiGet, userCacheKey, cacheInvalidate } from '@/services/cache';
import { CACHE_CONFIG } from '@/constants/app';

export default function MyReferralsScreen() {
  const router = useRouter();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');

  const loadReferrals = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const key = userCacheKey('referral:stats'); // shared with referral.tsx
      if (forceRefresh) await cacheInvalidate(key);
      await cachedApiGet<{ stats: { total: number; completed: number; pending: number; rewards: number } }>(
        key, '/referral/stats', CACHE_CONFIG.referral);
      // Referral details are not exposed per-item by the backend yet; show aggregate list only.
      setReferrals([]);
    } catch (e) {
      console.warn('[MyReferrals] load failed:', e);
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer data loading past first commit so no sync setState happens in the effect body
    void Promise.resolve().then(() => loadReferrals());
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReferrals(true).finally(() => setRefreshing(false)); // pull = bypass TTL cache
  };

  const filteredReferrals = referrals.filter(r => filter === 'all' || r.status === filter);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', color: Colors.semantic.success, bg: Colors.semantic.successSoft, icon: 'checkmark-circle' };
      case 'pending':
        return { label: 'Pending', color: Colors.semantic.warning, bg: Colors.semantic.warningSoft, icon: 'time-outline' };
      case 'cancelled':
        return { label: 'Cancelled', color: Colors.semantic.error, bg: Colors.semantic.errorSoft, icon: 'close-circle' };
      default:
        return { label: 'Unknown', color: Colors.text.muted, bg: Colors.surface.tertiary, icon: 'help-circle-outline' };
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="people" size={30} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading referrals...</Text>
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

  const summaryTiles = [
    { label: 'Total', value: stats.total, color: Colors.text.primary, icon: 'people' as const },
    { label: 'Completed', value: stats.completed, color: Colors.semantic.success, icon: 'checkmark-circle' as const },
    { label: 'Pending', value: stats.pending, color: Colors.semantic.warning, icon: 'time' as const },
    { label: 'Cancelled', value: stats.cancelled, color: Colors.semantic.error, icon: 'close-circle' as const },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
      >
        <ScreenHeader title="My referrals" subtitle="Track every invite and reward" onBack={() => router.back()} />
        {/* Summary Tiles */}
        <View style={styles.summaryContainer}>
          {summaryTiles.map((tile, i) => (
            <MotiView
              key={tile.label}
              from={{ opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 380, delay: i * 70 }}
              style={{ flex: 1 }}
            >
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: tile.color + '1A' }]}>
                  <Ionicons name={tile.icon} size={17} color={tile.color === Colors.text.primary ? Colors.brand.primary : tile.color} />
                </View>
                <Text style={[styles.summaryValue, { color: tile.color }]}>{tile.value}</Text>
                <Text style={styles.summaryLabel}>{tile.label}</Text>
              </View>
            </MotiView>
          ))}
        </View>

        {/* Earnings — cocoa card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 240 }}
          style={styles.earningsCard}
        >
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Total earned</Text>
            <Text style={styles.earningsValue}>₹{stats.totalEarned.toFixed(0)}</Text>
          </View>
          <View style={styles.earningsDivider} />
          <View style={styles.earningsItem}>
            <Text style={styles.earningsLabel}>Pending</Text>
            <Text style={[styles.earningsValue, { color: Colors.brand.accent }]}>₹{stats.pendingEarnings.toFixed(0)}</Text>
          </View>
        </MotiView>

        {/* Filter Tabs */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 380, delay: 320 }} style={styles.filterContainer}>
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'completed', label: 'Done', count: stats.completed },
            { key: 'pending', label: 'Pending', count: stats.pending },
            { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
          ].map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setFilter(tab.key as any)}
              >
                <Text style={[styles.filterTabText, active && { color: '#FFFFFF' }]}>{tab.label}</Text>
                <View style={[styles.filterTabCount, active ? styles.filterTabCountActive : styles.filterTabCountIdle]}>
                  <Text style={[styles.filterTabCountText, active ? { color: Colors.brand.accent } : { color: Colors.text.secondary }]}>{tab.count}</Text>
                </View>
              </Pressable>
            );
          })}
        </MotiView>

        {/* Referrals List */}
        <View style={{ marginTop: Spacing[4] }}>
          {filteredReferrals.length === 0 ? (
            <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name={(filter === 'all' ? 'people-outline' : filter === 'completed' ? 'checkmark-circle-outline' : filter === 'pending' ? 'time-outline' : 'close-circle-outline') as any} size={34} color={Colors.brand.accent} />
              </View>
              <Text style={styles.emptyStateTitle}>No {filter === 'all' ? 'referrals' : filter} found</Text>
              <Text style={styles.emptyStateText}>
                {filter === 'all'
                  ? 'Share your referral code to start earning rewards'
                  : `No ${filter} referrals at the moment`}
              </Text>
            </MotiView>
          ) : (
            <View style={styles.listContainer}>
              {filteredReferrals.map((referral, index) => {
                const statusConfig = getStatusConfig(referral.status);
                return (
                  <MotiView
                    key={referral.id}
                    from={{ opacity: 0, translateY: 14 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 360, delay: index * 60 }}
                  >
                    <View style={styles.referralCard}>
                      <View style={styles.referralHeader}>
                        <View style={styles.referralAvatar}>
                          <Text style={styles.referralAvatarText}>{getInitials(referral.name)}</Text>
                        </View>
                        <View style={styles.referralInfo}>
                          <Text style={styles.referralName}>{referral.name}</Text>
                          <Text style={styles.referralEmail}>{referral.email}</Text>
                        </View>
                        <View style={[styles.referralStatus, { backgroundColor: statusConfig.bg }]}>
                          <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                          <Text style={[styles.referralStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                        </View>
                      </View>

                      <View style={styles.referralDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar-outline" size={14} color={Colors.text.muted} />
                          <Text style={styles.detailText}>Joined {formatDate(referral.date)}</Text>
                        </View>

                        {referral.status === 'completed' && referral.taskCompleted ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="checkmark-circle" size={14} color={Colors.semantic.success} />
                            <Text style={[styles.detailText, { color: Colors.semantic.success }]}>Completed: {referral.taskCompleted}</Text>
                          </View>
                        ) : null}

                        {referral.status === 'completed' && referral.taskDate ? (
                          <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={14} color={Colors.text.muted} />
                            <Text style={styles.detailText}>Task completed {formatDateTime(referral.taskDate)}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.referralEarnings}>
                        <Ionicons name="cash" size={14} color={referral.status === 'completed' ? Colors.semantic.success : Colors.semantic.warning} />
                        <Text style={[styles.referralEarningsText, { color: referral.status === 'completed' ? Colors.semantic.success : Colors.semantic.warning }]}>
                          {referral.status === 'completed' ? 'Earned' : 'Potential'}: ₹{referral.earnings.toFixed(0)}
                        </Text>
                      </View>
                    </View>
                  </MotiView>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[4] },
  loadingBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },

  scrollContent: { padding: Spacing[5], paddingBottom: 40 },

  summaryContainer: { flexDirection: 'row', gap: Spacing[2] },
  summaryCard: {
    paddingVertical: Spacing[4], borderRadius: BorderRadius.lg, alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  summaryIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2] },
  summaryValue: { fontSize: 22, fontFamily: Typography.fontFamily.bold },
  summaryLabel: { fontSize: 10, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 3 },

  earningsCard: {
    flexDirection: 'row', marginTop: Spacing[4],
    borderRadius: BorderRadius.xl, padding: Spacing[5],
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  earningsItem: { flex: 1, alignItems: 'center' },
  earningsDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 2 },
  earningsLabel: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.65)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  earningsValue: { fontSize: 24, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },

  filterContainer: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[4], flexWrap: 'wrap' },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.elevated, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  filterTabActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  filterTabText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  filterTabCount: { paddingHorizontal: Spacing[2], paddingVertical: 1, borderRadius: BorderRadius.pill },
  filterTabCountActive: { backgroundColor: '#FFFFFF' },
  filterTabCountIdle: { backgroundColor: Colors.surface.tertiary },
  filterTabCountText: { fontSize: 10.5, fontFamily: Typography.fontFamily.bold },

  emptyState: {
    alignItems: 'center', paddingVertical: Spacing[12], borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyStateTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyStateText: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[1], paddingHorizontal: Spacing[8], lineHeight: 19 },

  listContainer: { gap: Spacing[3] },
  referralCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3] },
  referralAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  referralAvatarText: { fontSize: 17, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  referralInfo: { flex: 1 },
  referralName: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  referralEmail: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  referralStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing[2] + 2, paddingVertical: 4, borderRadius: BorderRadius.pill,
  },
  referralStatusText: { fontSize: 10.5, fontFamily: Typography.fontFamily.semiBold },
  referralDetails: { gap: Spacing[2], marginBottom: Spacing[3] },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  detailText: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  referralEarnings: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    borderTopWidth: 1, borderTopColor: Colors.border.light, paddingTop: Spacing[3],
  },
  referralEarningsText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold },
});
