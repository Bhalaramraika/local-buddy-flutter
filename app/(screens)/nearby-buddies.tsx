/**
 * Nearby Buddies Screen — Soft Modern
 * Map-style cocoa hero, radius chips, white buddy cards with
 * cocoa avatars + online dots + skill chips. Load logic unchanged.
 * (Search-by-skill input converted to a real client-side filter.)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/services/api';
import { ScreenHeader } from '@/components/ui';

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
  avatarUrl?: string;
}

const RADIUS_STEPS = [2, 5, 10, 25, 50];

export default function NearbyBuddiesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [buddies, setBuddies] = useState<NearbyBuddy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'online' | 'top-rated' | 'closest'>('all');
  const [radius, setRadius] = useState(10); // km
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBuddies();
    setRefreshing(false);
  };

  const loadBuddies = async () => {
    setLoading(true);
    try {
      const lat = user?.coordinates?.latitude ?? 28.61;
      const lng = user?.coordinates?.longitude ?? 77.20;
      const res = await apiGet<{ buddies: any[] }>(`/location/nearby-buddies?lat=${lat}&lng=${lng}&radiusKm=${radius}`);
      setBuddies((res?.buddies || []).map((b: any) => ({
        id: b.id,
        name: b.name || 'Buddy',
        avatar: (b.name || 'B').slice(0, 2).toUpperCase(),
        distance: `${b.distanceKm} km`,
        rating: b.rating || 0,
        reviewCount: 0,
        skills: b.skills || [],
        hourlyRate: 0,
        isOnline: true,
        lastActive: '',
        completedTasks: b.completedTasks || 0,
        responseTime: '',
        avatarUrl: b.avatar,
      })));
    } catch (e) {
      console.warn('[NearbyBuddies] load failed:', e);
      setBuddies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Defer data loading past the first commit so no sync setState happens in the effect body
    void Promise.resolve().then(() => { loadBuddies(); });
  }, [radius]);

  const filteredBuddies = buddies.filter(buddy => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!buddy.name.toLowerCase().includes(q) && !buddy.skills.some(s => s.toLowerCase().includes(q))) return false;
    }
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
      'Cleaning': Colors.brand.accent,
      'Organization': Colors.semantic.success,
      'Pet Care': Colors.semantic.warning,
      'Handyman': Colors.semantic.error,
      'Furniture Assembly': Colors.semantic.info,
      'Repairs': Colors.semantic.error,
      'Tutoring': Colors.semantic.info,
      'Tech Support': Colors.brand.primary,
      'Grocery Shopping': Colors.semantic.success,
      'Errands': Colors.semantic.info,
      'Moving Help': Colors.semantic.error,
      'Transport': Colors.brand.accentPressed,
    };
    return colors[skill] || Colors.brand.accent;
  };

  const renderBuddy = (item: NearbyBuddy, index: number) => (
    <MotiView
      key={item.id}
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 380, delay: Math.min(index, 8) * 55 }}
    >
      <Pressable
        style={({ pressed }) => [styles.buddyCard, pressed && { transform: [{ scale: 0.985 }] }]}
        onPress={() => router.push({ pathname: `/(screens)/user-profile`, params: { userId: item.id } })}
      >
        <View style={styles.buddyHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.avatar}</Text>
            </View>
            {item.isOnline ? <View style={styles.onlineIndicator} /> : null}
          </View>
          <View style={styles.buddyInfo}>
            <View style={styles.buddyNameRow}>
              <Text style={styles.buddyName} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.ratingBadge, { backgroundColor: item.rating >= 4.8 ? Colors.semantic.warningSoft : Colors.brand.accentSoft }]}>
                <Ionicons name="star" size={11} color={item.rating >= 4.8 ? Colors.semantic.warning : Colors.brand.accent} />
                <Text style={[styles.ratingText, { color: item.rating >= 4.8 ? Colors.semantic.warning : Colors.brand.accentPressed }]}>{item.rating}</Text>
              </View>
            </View>
            <View style={styles.buddyMeta}>
              <View style={styles.metaChip}>
                <Ionicons name="location" size={11} color={Colors.brand.accent} />
                <Text style={styles.distanceText}>{item.distance} away</Text>
              </View>
              <Text style={styles.metaText}>{item.reviewCount} reviews • {item.completedTasks} tasks</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={17} color={Colors.text.muted} />
        </View>

        {item.skills.length > 0 ? (
          <View style={styles.skillsContainer}>
            {item.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={[styles.skillTag, { backgroundColor: `${getSkillColor(skill)}1A` }]}>
                <Text style={[styles.skillText, { color: getSkillColor(skill) }]}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 3 ? (
              <View style={[styles.skillTag, { backgroundColor: Colors.surface.tertiary }]}>
                <Text style={[styles.skillText, { color: Colors.text.secondary }]}>+{item.skills.length - 3}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.buddyFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Tasks</Text>
            <Text style={styles.footerValue}>{item.completedTasks}</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: item.isOnline ? Colors.semantic.success : Colors.text.muted }]} />
              <Text style={[styles.statusText, { color: item.isOnline ? Colors.semantic.success : Colors.text.muted }]}>{item.isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <Pressable
            style={styles.chatShortcut}
            onPress={() => router.push({ pathname: '/(screens)/user-profile', params: { userId: item.id } })}
          >
            <Ionicons name="chatbubble-ellipses" size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </Pressable>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: Spacing[5], paddingTop: Spacing[5] }}>
        <ScreenHeader title="Buddies nearby" subtitle="Verified helpers around you" onBack={() => router.back()} style={{ marginBottom: 0, paddingBottom: Spacing[4] }} />
      </View>
      {/* Cocoa hero */}
      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 420 }}
        style={styles.heroCard}
      >
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>{filteredBuddies.length} buddies nearby</Text>
            <Text style={styles.heroSub}>Verified helpers within {radius} km of you</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="map" size={26} color="#FFFFFF" />
          </View>
        </View>
        {/* Radius chips */}
        <View style={styles.radiusRow}>
          {RADIUS_STEPS.map((r) => {
            const active = radius === r;
            return (
              <Pressable
                key={r}
                onPress={() => setRadius(r)}
                style={[styles.radiusChip, active && styles.radiusChipActive]}
              >
                <Text style={[styles.radiusChipText, active && styles.radiusChipTextActive]}>{r === 50 ? '50 km' : `${r} km`}</Text>
              </Pressable>
            );
          })}
        </View>
      </MotiView>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or skill..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.muted}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={Colors.text.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'online', 'top-rated', 'closest'] as const).map((tab) => {
          const active = filter === tab;
          return (
            <Pressable
              key={tab}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.filterTabText, active && { color: '#FFFFFF' }]}>
                {tab === 'all' ? 'All' : tab === 'online' ? 'Online' : tab === 'top-rated' ? 'Top Rated' : 'Closest'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Buddies List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingBadge}>
              <Ionicons name="people" size={28} color={Colors.brand.accent} />
            </View>
            <Text style={styles.loadingText}>Finding nearby buddies...</Text>
          </View>
        ) : filteredBuddies.length === 0 ? (
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="people-outline" size={34} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyTitle}>No buddies found</Text>
            <Text style={styles.emptyDesc}>Try increasing your search radius or clearing filters</Text>
          </MotiView>
        ) : (
          filteredBuddies.map((b, i) => renderBuddy(b, i))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  heroCard: {
    marginHorizontal: Spacing[5], marginTop: Spacing[4],
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.xl,
    padding: Spacing[5], ...Shadows.button,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4] },
  heroTitle: { fontSize: 22, fontFamily: Typography.fontFamily.display, color: '#FFFFFF' },
  heroSub: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  heroIconWrap: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  radiusRow: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  radiusChip: {
    paddingHorizontal: Spacing[3] + 2, paddingVertical: Spacing[2],
    borderRadius: BorderRadius.pill, backgroundColor: 'rgba(255,255,255,0.14)',
  },
  radiusChipActive: { backgroundColor: '#FFFFFF' },
  radiusChipText: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: 'rgba(255,255,255,0.85)' },
  radiusChipTextActive: { color: Colors.brand.primary },

  searchWrap: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], height: 50, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, fontSize: 14.5, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },

  filterContainer: { flexDirection: 'row', gap: Spacing[2], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] },
  filterTab: {
    paddingHorizontal: Spacing[4] + 2, paddingVertical: Spacing[2] + 1, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.elevated, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  filterTabActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  filterTabText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },

  listContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },
  loadingContainer: { alignItems: 'center', paddingVertical: Spacing[14], gap: Spacing[3] },
  loadingBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  emptyState: {
    alignItems: 'center', paddingVertical: Spacing[12], borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    marginTop: Spacing[2], ...Shadows.card,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyTitle: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[1], paddingHorizontal: Spacing[8] },

  buddyCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[4], marginBottom: Spacing[3],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  buddyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[3] },
  avatarContainer: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  onlineIndicator: {
    position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.semantic.success, borderWidth: 2.5, borderColor: Colors.surface.elevated,
  },
  buddyInfo: { flex: 1 },
  buddyNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: 4 },
  buddyName: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flexShrink: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: BorderRadius.pill },
  ratingText: { fontSize: 11.5, fontFamily: Typography.fontFamily.bold },
  buddyMeta: { gap: 3 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[2], paddingVertical: 2,
  },
  distanceText: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: Colors.brand.accentPressed },
  metaText: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },

  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[3] },
  skillTag: { paddingHorizontal: Spacing[2] + 2, paddingVertical: 4, borderRadius: BorderRadius.pill },
  skillText: { fontSize: 11, fontFamily: Typography.fontFamily.medium },

  buddyFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  footerItem: { alignItems: 'center', flex: 1 },
  footerDivider: { width: 1, height: 28, backgroundColor: Colors.border.light },
  footerLabel: { fontSize: 10, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  footerValue: { fontSize: 14, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold },
  chatShortcut: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center', ...Shadows.buttonOrange,
  },
});
