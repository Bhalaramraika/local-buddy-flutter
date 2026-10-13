/**
 * Achievements Screen — Soft Modern
 * Cocoa progress hero with orange XP bar, pill category chips,
 * 2-column badge grid with rarity tints + locked overlays.
 * Loading and data logic unchanged.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { cachedApiGet, userCacheKey } from '@/services/cache';
import { CACHE_CONFIG } from '@/constants/app';
import { ScreenHeader } from '@/components/ui';
import { useRouter } from 'expo-router';

export default function AchievementsScreen() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'milestone' | 'social' | 'earnings' | 'special'>('all');

  const loadAchievements = async () => {
    setLoading(true);
    try {
      // 30-min TTL — achievements change only on task events.
      const res = await cachedApiGet<{ achievements: any[] }>(
        userCacheKey('achievements'), '/achievements', CACHE_CONFIG.achievements);
      setAchievements(res?.achievements || []);
    } catch (e) {
      console.warn('[Achievements] load failed:', e);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await loadAchievements();
    };
    load();
    return () => { mounted = false; };
  }, []);

  const categories = [
    { key: 'all', label: 'All', icon: 'grid' as const },
    { key: 'milestone', label: 'Milestones', icon: 'trophy' as const },
    { key: 'social', label: 'Social', icon: 'people' as const },
    { key: 'earnings', label: 'Earnings', icon: 'cash' as const },
    { key: 'special', label: 'Special', icon: 'sparkles' as const },
  ];

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'common': return { label: 'Common', color: Colors.text.muted, bg: '#A08A771A' };
      case 'rare': return { label: 'Rare', color: Colors.brand.accentPressed, bg: Colors.brand.accentSoft };
      case 'epic': return { label: 'Epic', color: Colors.semantic.info, bg: Colors.semantic.infoSoft };
      case 'legendary': return { label: 'Legendary', color: Colors.semantic.warning, bg: Colors.semantic.warningSoft };
      default: return { label: 'Common', color: Colors.text.muted, bg: '#A08A771A' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressPercent = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  const showAchievementDetail = (achievement: any) => {
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\n${achievement.unlocked ? `Unlocked on ${formatDate(achievement.unlockedAt!)}` : `Progress: ${achievement.progress}/${achievement.target}`}\n\nRarity: ${getRarityConfig(achievement.rarity).label}\nXP Reward: ${achievement.xp}`,
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="trophy" size={30} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      </View>
    );
  }

  // Stats
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
  const completionRate = totalAchievements > 0 ? Math.round((unlockedAchievements / totalAchievements) * 100) : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Achievements" subtitle="Badges you have earned" onBack={() => router.back()} />
        {/* Progress hero — cocoa card with orange progress */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440 }}
          style={styles.progressCard}
        >
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressEyebrow}>YOUR PROGRESS</Text>
              <Text style={styles.progressTitle}>Achievements</Text>
            </View>
            <View style={styles.progressPercentContainer}>
              <Text style={styles.progressPercent}>{completionRate}%</Text>
              <Text style={styles.progressPercentLabel}>complete</Text>
            </View>
          </View>

          <View style={styles.progressBar}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${completionRate}%` }}
              transition={{ type: 'timing', duration: 800, delay: 300 }}
              style={styles.progressFill}
            />
          </View>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{unlockedAchievements}/{totalAchievements}</Text>
              <Text style={styles.progressStatLabel}>Unlocked</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: Colors.brand.accent }]}>{totalXP} XP</Text>
              <Text style={styles.progressStatLabel}>Total XP</Text>
            </View>
            <View style={styles.progressDivider} />
            <View style={styles.progressStat}>
              <Text style={[styles.progressStatValue, { color: '#E8963C' }]}>{achievements.filter(a => a.unlocked && a.rarity === 'legendary').length}</Text>
              <Text style={styles.progressStatLabel}>Legendary</Text>
            </View>
          </View>
        </MotiView>

        {/* Category chips */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 120 }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categories.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  style={[styles.categoryTab, active && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(cat.key as any)}
                >
                  <Ionicons name={cat.icon} size={15} color={active ? '#FFFFFF' : Colors.brand.accent} style={{ marginRight: 5 }} />
                  <Text style={[styles.categoryTabText, active && { color: '#FFFFFF' }]}>{cat.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </MotiView>

        {/* Achievements Grid */}
        <View style={{ marginTop: Spacing[4] }}>
          {filteredAchievements.length === 0 ? (
            <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="trophy" size={34} color={Colors.brand.accent} />
              </View>
              <Text style={styles.emptyStateTitle}>No achievements in this category</Text>
              <Text style={styles.emptyStateText}>Check back later or try another category</Text>
            </MotiView>
          ) : (
            <View style={styles.gridContainer}>
              {filteredAchievements.map((achievement, index) => {
                const rarity = getRarityConfig(achievement.rarity);
                return (
                  <MotiView
                    key={achievement.id}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'timing', duration: 380, delay: 100 + index * 60 }}
                    style={styles.achievementCardWrap}
                  >
                    <Pressable
                      style={[styles.achievementCard, achievement.unlocked && { borderColor: rarity.color + '55' }]}
                      onPress={() => showAchievementDetail(achievement)}
                    >
                      {/* Rarity Badge */}
                      <View style={[styles.rarityBadge, { backgroundColor: rarity.bg }]}>
                        <Text style={[styles.rarityBadgeText, { color: rarity.color }]}>{rarity.label}</Text>
                      </View>

                      {/* Icon */}
                      <View style={[
                        styles.achievementIcon,
                        { backgroundColor: achievement.unlocked ? Colors.brand.accentSoft : Colors.surface.tertiary },
                      ]}>
                        <Ionicons
                          name={achievement.icon}
                          size={30}
                          color={achievement.unlocked ? Colors.brand.accent : Colors.text.muted}
                        />
                        {!achievement.unlocked ? (
                          <View style={styles.lockChip}>
                            <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </View>

                      {/* Content */}
                      <View style={styles.achievementContent}>
                        <Text style={[styles.achievementTitle, !achievement.unlocked && { color: Colors.text.muted }]} numberOfLines={2}>
                          {achievement.title}
                        </Text>
                        <Text style={styles.achievementDesc} numberOfLines={2}>{achievement.description}</Text>

                        {/* Progress Bar for locked achievements */}
                        {!achievement.unlocked && achievement.target > 1 ? (
                          <View style={styles.achievementProgress}>
                            <View style={styles.achievementProgressBar}>
                              <View
                                style={[
                                  styles.achievementProgressFill,
                                  { width: `${getProgressPercent(achievement.progress, achievement.target)}%` },
                                ]}
                              />
                            </View>
                            <Text style={styles.achievementProgressText}>
                              {achievement.progress}/{achievement.target}
                            </Text>
                          </View>
                        ) : null}

                        {/* Unlocked Info */}
                        {achievement.unlocked ? (
                          <View style={styles.achievementUnlocked}>
                            <Ionicons name="checkmark-circle" size={13} color={Colors.semantic.success} />
                            <Text style={styles.achievementUnlockedText}>{formatDate(achievement.unlockedAt!)}</Text>
                            <View style={styles.xpBadge}>
                              <Ionicons name="flash" size={10} color={Colors.semantic.warning} />
                              <Text style={styles.xpBadgeText}>+{achievement.xp}</Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
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

  progressCard: {
    borderRadius: BorderRadius['2xl'], padding: Spacing[5],
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  progressEyebrow: { fontSize: 10.5, fontFamily: Typography.fontFamily.bold, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.6 },
  progressTitle: { fontSize: 23, fontFamily: Typography.fontFamily.display, color: '#FFFFFF', marginTop: 2 },
  progressPercentContainer: {
    alignItems: 'flex-end', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.md, paddingHorizontal: Spacing[3], paddingVertical: Spacing[2],
  },
  progressPercent: { fontSize: 24, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accent },
  progressPercentLabel: { fontSize: 9.5, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 },
  progressBar: { height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.16)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: Colors.brand.accent },
  progressStats: { flexDirection: 'row', marginTop: Spacing[5] },
  progressDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.16)', marginVertical: 2 },
  progressStat: { flex: 1, alignItems: 'center' },
  progressStatValue: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  progressStatLabel: { fontSize: 10, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.65)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.8 },

  categoryScroll: { gap: Spacing[2], paddingVertical: Spacing[1] },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 2,
    borderRadius: BorderRadius.pill, backgroundColor: Colors.surface.elevated,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  categoryTabActive: { backgroundColor: Colors.brand.accent, borderColor: Colors.brand.accent, ...Shadows.buttonOrange },
  categoryTabText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },

  emptyState: {
    alignItems: 'center', paddingVertical: Spacing[12], borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyStateTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, textAlign: 'center' },
  emptyStateText: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[1], paddingHorizontal: Spacing[8] },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing[3] },
  achievementCardWrap: { width: '48.5%' },
  achievementCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[4], minHeight: 180,
    backgroundColor: Colors.surface.elevated, borderWidth: 1.5, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  rarityBadge: {
    position: 'absolute', top: 10, right: 10, paddingHorizontal: Spacing[2], paddingVertical: 2,
    borderRadius: BorderRadius.pill, zIndex: 10,
  },
  rarityBadgeText: { fontSize: 9, fontFamily: Typography.fontFamily.bold, textTransform: 'uppercase', letterSpacing: 0.6 },
  achievementIcon: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing[3],
  },
  lockChip: {
    position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.text.muted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.surface.elevated,
  },
  achievementContent: { gap: 5 },
  achievementTitle: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, lineHeight: 18 },
  achievementDesc: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 14.5 },
  achievementProgress: { marginTop: Spacing[1], gap: 4 },
  achievementProgressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.surface.tertiary, overflow: 'hidden' },
  achievementProgressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.brand.accent },
  achievementProgressText: { fontSize: 10, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, textAlign: 'right' },
  achievementUnlocked: {
    flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing[2],
    paddingTop: Spacing[2], borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  achievementUnlockedText: { fontSize: 10.5, fontFamily: Typography.fontFamily.medium, color: Colors.semantic.success, flex: 1 },
  xpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.semantic.warningSoft,
  },
  xpBadgeText: { fontSize: 10, fontFamily: Typography.fontFamily.bold, color: Colors.semantic.warning },
});
