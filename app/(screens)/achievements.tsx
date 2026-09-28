/**
 * Achievements Screen - User achievements and badges
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function AchievementsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'milestone' | 'social' | 'earnings' | 'special'>('all');
  const [animationValues, setAnimationValues] = useState<Animated.Value[]>([]);

  const loadAchievements = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock achievements data
    const mockAchievements = [
      // Milestone Achievements
      { id: 'first_task', category: 'milestone', title: 'First Steps', description: 'Complete your first task', icon: 'footsteps', color: '#4F46E5', unlocked: true, unlockedAt: '2024-01-10T10:00:00Z', progress: 1, target: 1, rarity: 'common', xp: 50 },
      { id: 'ten_tasks', category: 'milestone', title: 'Getting Started', description: 'Complete 10 tasks', icon: 'check-circle-outline', color: '#10B981', unlocked: true, unlockedAt: '2024-01-20T14:30:00Z', progress: 12, target: 10, rarity: 'common', xp: 100 },
      { id: 'fifty_tasks', category: 'milestone', title: 'Task Master', description: 'Complete 50 tasks', icon: 'trophy-outline', color: '#F59E0B', unlocked: false, unlockedAt: null, progress: 12, target: 50, rarity: 'rare', xp: 500 },
      { id: 'hundred_tasks', category: 'milestone', title: 'Centurion', description: 'Complete 100 tasks', icon: 'medal-outline', color: '#EF4444', unlocked: false, unlockedAt: null, progress: 12, target: 100, rarity: 'epic', xp: 1000 },
      { id: 'five_hundred_tasks', category: 'milestone', title: 'Legend', description: 'Complete 500 tasks', icon: 'crown-outline', color: '#8B5CF6', unlocked: false, unlockedAt: null, progress: 12, target: 500, rarity: 'legendary', xp: 5000 },

      // Social Achievements
      { id: 'first_referral', category: 'social', title: 'Connector', description: 'Refer your first friend', icon: 'person-add-outline', color: '#4F46E5', unlocked: true, unlockedAt: '2024-01-12T09:00:00Z', progress: 1, target: 1, rarity: 'common', xp: 100 },
      { id: 'five_referrals', category: 'social', title: 'Networker', description: 'Refer 5 friends', icon: 'people-outline', color: '#10B981', unlocked: true, unlockedAt: '2024-01-25T16:00:00Z', progress: 8, target: 5, rarity: 'rare', xp: 300 },
      { id: 'ten_referrals', category: 'social', title: 'Influencer', description: 'Refer 10 friends', icon: 'megaphone-outline', color: '#F59E0B', unlocked: false, unlockedAt: null, progress: 8, target: 10, rarity: 'epic', xp: 800 },
      { id: 'twenty_five_referrals', category: 'social', title: 'Ambassador', description: 'Refer 25 friends', icon: 'star-outline', color: '#EF4444', unlocked: false, unlockedAt: null, progress: 8, target: 25, rarity: 'legendary', xp: 2000 },
      { id: 'helpful_reviewer', category: 'social', title: 'Helpful Reviewer', description: 'Write 10 helpful reviews', icon: 'chatbubble-outline', color: '#8B5CF6', unlocked: false, unlockedAt: null, progress: 3, target: 10, rarity: 'rare', xp: 200 },

      // Earnings Achievements
      { id: 'first_earning', category: 'earnings', title: 'First Dollar', description: 'Earn your first $10', icon: 'cash-outline', color: '#10B981', unlocked: true, unlockedAt: '2024-01-10T12:00:00Z', progress: 1, target: 1, rarity: 'common', xp: 50 },
      { id: 'hundred_earned', category: 'earnings', title: 'Hundred Club', description: 'Earn $100 total', icon: 'currency-dollar-outline', color: '#4F46E5', unlocked: true, unlockedAt: '2024-01-22T11:00:00Z', progress: 240, target: 100, rarity: 'rare', xp: 200 },
      { id: 'thousand_earned', category: 'earnings', title: 'Big Earner', description: 'Earn $1,000 total', icon: 'diamond-outline', color: '#F59E0B', unlocked: false, unlockedAt: null, progress: 240, target: 1000, rarity: 'epic', xp: 1000 },
      { id: 'five_thousand_earned', category: 'earnings', title: 'High Roller', description: 'Earn $5,000 total', icon: 'cash-outline', color: '#EF4444', unlocked: false, unlockedAt: null, progress: 240, target: 5000, rarity: 'legendary', xp: 5000 },
      { id: 'perfect_rating', category: 'earnings', title: 'Five Star', description: 'Maintain 5.0 rating for 20 tasks', icon: 'star-outline', color: '#8B5CF6', unlocked: false, unlockedAt: null, progress: 12, target: 20, rarity: 'epic', xp: 500 },

      // Special Achievements
      { id: 'early_bird', category: 'special', title: 'Early Bird', description: 'Complete a task before 8 AM', icon: 'sunny-outline', color: '#F59E0B', unlocked: true, unlockedAt: '2024-01-15T07:30:00Z', progress: 1, target: 1, rarity: 'rare', xp: 150 },
      { id: 'night_owl', category: 'special', title: 'Night Owl', description: 'Complete a task after 10 PM', icon: 'moon-outline', color: '#8B5CF6', unlocked: false, unlockedAt: null, progress: 0, target: 1, rarity: 'rare', xp: 150 },
      { id: 'weekend_warrior', category: 'special', title: 'Weekend Warrior', description: 'Complete 10 tasks on weekends', icon: 'calendar-outline', color: '#4F46E5', unlocked: true, unlockedAt: '2024-01-21T10:00:00Z', progress: 12, target: 10, rarity: 'rare', xp: 200 },
      { id: 'streak_7', category: 'special', title: 'Week Streak', description: 'Complete tasks 7 days in a row', icon: 'flame-outline', color: '#EF4444', unlocked: false, unlockedAt: null, progress: 3, target: 7, rarity: 'epic', xp: 300 },
      { id: 'streak_30', category: 'special', title: 'Monthly Master', description: 'Complete tasks 30 days in a row', icon: 'calendar-outline', color: '#8B5CF6', unlocked: false, unlockedAt: null, progress: 3, target: 30, rarity: 'legendary', xp: 2000 },
      { id: 'kyc_verified', category: 'special', title: 'Verified Buddy', description: 'Complete KYC verification', icon: 'shield-checkmark-outline', color: '#10B981', unlocked: true, unlockedAt: '2024-01-16T14:20:00Z', progress: 1, target: 1, rarity: 'epic', xp: 500 },
      { id: 'profile_complete', category: 'special', title: 'Profile Pro', description: 'Complete 100% of your profile', icon: 'person-outline', color: '#4F46E5', unlocked: true, unlockedAt: '2024-01-10T10:30:00Z', progress: 1, target: 1, rarity: 'common', xp: 100 },
    ];
    
    setAchievements(mockAchievements);
    setAnimationValues(mockAchievements.map(() => new Animated.Value(0)));
    setLoading(false);
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
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'milestone', label: 'Milestones', icon: 'trophy-outline' },
    { key: 'social', label: 'Social', icon: 'people-outline' },
    { key: 'earnings', label: 'Earnings', icon: 'cash-outline' },
    { key: 'special', label: 'Special', icon: 'sparkles-outline' },
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const getRarityConfig = (rarity: string) => {
    switch (rarity) {
      case 'common': return { label: 'Common', color: '#9CA3AF', bg: '#9CA3AF15', border: '#9CA3AF33' };
      case 'rare': return { label: 'Rare', color: '#4F46E5', bg: '#4F46E515', border: '#4F46E533' };
      case 'epic': return { label: 'Epic', color: '#8B5CF6', bg: '#8B5CF615', border: '#8B5CF633' };
      case 'legendary': return { label: 'Legendary', color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B33' };
      default: return { label: 'Common', color: '#9CA3AF', bg: '#9CA3AF15', border: '#9CA3AF33' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getProgressPercent = (progress: number, target: number) => {
    return Math.min((progress / target) * 100, 100);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Achievements</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#4F46E5" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading achievements...</Text>
        </View>
      </View>
    );
  }

  // Stats
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const totalXP = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.xp, 0);
  const completionRate = Math.round((unlockedAchievements / totalAchievements) * 100);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Achievements</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Overview */}
        <View style={[styles.progressCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: isDark ? '#fff' : '#000' }]}>Your Progress</Text>
            <View style={[styles.progressPercentContainer, { backgroundColor: '#4F46E515' }]}>
              <Text style={[styles.progressPercent, { color: '#4F46E5' }]}>{completionRate}%</Text>
              <Text style={[styles.progressPercentLabel, { color: isDark ? '#888' : '#666' }]}>Complete</Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { backgroundColor: '#4F46E5', width: `${completionRate}%` }
                ]} 
              />
            </View>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatValue, { color: isDark ? '#fff' : '#000' }]}>{unlockedAchievements}/{totalAchievements}</Text>
                <Text style={[styles.progressStatLabel, { color: isDark ? '#888' : '#666' }]}>Unlocked</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatValue, { color: '#F59E0B' }]}>{totalXP} XP</Text>
                <Text style={[styles.progressStatLabel, { color: isDark ? '#888' : '#666' }]}>Total XP</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[styles.progressStatValue, { color: '#10B981' }]}>{achievements.filter(a => a.unlocked && a.rarity === 'legendary').length}</Text>
                <Text style={[styles.progressStatLabel, { color: isDark ? '#888' : '#666' }]}>Legendary</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Category Tabs */}
        <View style={[styles.categoryContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <View style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.key}
                style={[styles.categoryTab, selectedCategory === cat.key && styles.categoryTabActive]}
                onPress={() => setSelectedCategory(cat.key as any)}
              >
                <Ionicons name={cat.icon as any} size={20} color={selectedCategory === cat.key ? '#fff' : isDark ? '#ddd' : '#666'} style={{ marginRight: 6 }} />
                <Text style={[styles.categoryTabText, selectedCategory === cat.key ? { color: '#fff' } : { color: isDark ? '#ddd' : '#333' }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Achievements Grid */}
        <View style={{ marginTop: 16 }}>
          {filteredAchievements.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
              <Ionicons name="trophy-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyStateTitle, { color: isDark ? '#fff' : '#000' }, { marginTop: 16 }]}>No achievements in this category</Text>
              <Text style={[styles.emptyStateText, { color: isDark ? '#888' : '#666' }, { marginTop: 8 }]}>Check back later or try another category</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredAchievements.map((achievement, index) => (
                <TouchableOpacity 
                  key={achievement.id}
                  style={[styles.achievementCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: achievement.unlocked ? getRarityConfig(achievement.rarity).border : '#eee' }]}
                  onPress={() => showAchievementDetail(achievement)}
                  activeOpacity={0.8}
                >
                  {/* Rarity Badge */}
                  <View style={[styles.rarityBadge, { backgroundColor: getRarityConfig(achievement.rarity).bg }]}>
                    <Text style={[styles.rarityBadgeText, { color: getRarityConfig(achievement.rarity).color }]}>{getRarityConfig(achievement.rarity).label}</Text>
                  </View>

                  {/* Locked Overlay */}
                  {!achievement.unlocked && (
                    <View style={styles.lockedOverlay}>
                      <Ionicons name="lock-closed-outline" size={32} color={isDark ? '#666' : '#999'} />
                    </View>
                  )}

                  {/* Icon */}
                  <View style={[styles.achievementIcon, { backgroundColor: achievement.unlocked ? `${achievement.color}15` : '#f0f0f0' }]}>
                    <Ionicons 
                      name={achievement.icon} 
                      size={36} 
                      color={achievement.unlocked ? achievement.color : (isDark ? '#666' : '#999')} 
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.achievementContent}>
                    <Text style={[styles.achievementTitle, { color: achievement.unlocked ? (isDark ? '#fff' : '#000') : (isDark ? '#666' : '#999') }]}>{achievement.title}</Text>
                    <Text style={[styles.achievementDesc, { color: isDark ? '#888' : '#666' }]}>{achievement.description}</Text>
                    
                    {/* Progress Bar for locked achievements */}
                    {!achievement.unlocked && achievement.target > 1 && (
                      <View style={styles.achievementProgress}>
                        <View style={styles.achievementProgressBar}>
                          <View 
                            style={[
                              styles.achievementProgressFill, 
                              { backgroundColor: achievement.color, width: `${getProgressPercent(achievement.progress, achievement.target)}%` }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.achievementProgressText, { color: isDark ? '#888' : '#666' }]}>
                          {achievement.progress}/{achievement.target}
                        </Text>
                      </View>
                    )}

                    {/* Unlocked Info */}
                    {achievement.unlocked && (
                      <View style={styles.achievementUnlocked}>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={[styles.achievementUnlockedText, { color: '#10B981' }]}>Unlocked {formatDate(achievement.unlockedAt!)}</Text>
                        <View style={[styles.xpBadge, { backgroundColor: '#F59E0B15' }]}>
                          <Ionicons name="flash-outline" size={12} color="#F59E0B" style={{ marginRight: 2 }} />
                          <Text style={[styles.xpBadgeText, { color: '#F59E0B' }]}>+{achievement.xp} XP</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );

  const showAchievementDetail = (achievement: any) => {
    Alert.alert(
      achievement.title,
      `${achievement.description}\n\n${achievement.unlocked ? `Unlocked on ${formatDate(achievement.unlockedAt!)}` : `Progress: ${achievement.progress}/${achievement.target}`}\n\nRarity: ${getRarityConfig(achievement.rarity).label}\nXP Reward: ${achievement.xp}`,
      [{ text: 'OK' }]
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  progressCard: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  progressPercentContainer: { flexDirection: 'row', alignItems: 'baseline', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  progressPercent: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  progressPercentLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  progressBarContainer: { gap: 16 },
  progressBar: { height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-around' },
  progressStat: { alignItems: 'center' },
  progressStatValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  progressStatLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryContainer: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  categoryScroll: { flexDirection: 'row', gap: 10 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#eee' },
  categoryTabActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  categoryTabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  emptyState: { alignItems: 'center', paddingVertical: 48, borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
  emptyStateTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyStateText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 32 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  achievementCard: { 
    width: '48%', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#eee',
    overflow: 'hidden',
  },
  rarityBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, zIndex: 10 },
  rarityBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  lockedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 5 },
  achievementIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  achievementContent: { gap: 6 },
  achievementTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', lineHeight: 18 },
  achievementDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  achievementProgress: { marginTop: 8, gap: 4 },
  achievementProgressBar: { height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  achievementProgressFill: { height: '100%', borderRadius: 2 },
  achievementProgressText: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'right' },
  achievementUnlocked: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eee' },
  achievementUnlockedText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  xpBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 'auto' },
  xpBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
});