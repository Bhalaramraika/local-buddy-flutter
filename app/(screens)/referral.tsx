/**
 * Referral Program Screen - Referral program overview and sharing
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Share,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { apiGet } from '@/services/api';
import { Colors } from '@/constants/design';

export default function ReferralScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      const codeRes = await apiGet<{ code: string; shareUrl: string }>('/referral/code');
      const statsRes = await apiGet<{ stats: { total: number; completed: number; pending: number; rewards: number } }>('/referral/stats');
      const code = codeRes?.code || user?.referralCode || '';
      const stats = statsRes?.stats || { total: 0, completed: 0, pending: 0, rewards: 0 };
      setReferralData({
        code,
        totalReferrals: stats.total,
        successfulReferrals: stats.completed,
        pendingReferrals: stats.pending,
        totalEarned: stats.rewards,
        pendingEarnings: stats.pending * 50,
        referralLink: codeRes?.shareUrl || `https://localbuddy.app/r/${code}`,
        tier: stats.completed >= 20 ? 'Platinum' : stats.completed >= 10 ? 'Gold' : 'Silver',
        nextTierRequirement: stats.completed >= 20 ? 50 : 20,
        rewards: [
          { referrals: 1, reward: '₹50', description: 'First referral bonus' },
          { referrals: 5, reward: '₹250', description: '5 referrals milestone' },
          { referrals: 10, reward: '₹500', description: '10 referrals milestone' },
          { referrals: 20, reward: '₹1,250', description: '20 referrals milestone' },
        ],
        recentActivity: [],
      });
    } catch (e) {
      console.warn('[Referral] load failed:', e);
      setReferralData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);


  const copyReferralCode = () => {
    if (referralData) {
      // In a real app, use Clipboard.setString(referralData.code)
      setCopied(true);
      showToast('Referral code copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (referralData) {
      // In a real app, use Clipboard.setString(referralData.referralLink)
      showToast('Referral link copied!', 'success');
    }
  };

  const shareReferral = async () => {
    if (referralData) {
      try {
        await Share.share({
          message: `Join me on LocalBuddy! Use my referral code ${referralData.code} to get $10 off your first task. ${referralData.referralLink}`,
          title: 'Join LocalBuddy',
          url: referralData.referralLink,
        });
      } catch (error) {
        showToast('Failed to share', 'error');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Referral Program</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#8B85FF" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading referral data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Referral Program</Text>
          <TouchableOpacity onPress={() => router.push('/(screens)/my-referrals')}>
            <Text style={[styles.myReferralsText, { color: Colors.brand.primary }]}>My Referrals</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.heroTop}>
            <View style={styles.tierBadge}>
              <Text style={styles.tierLabel}>Your Tier</Text>
              <Text style={styles.tierName}>{referralData.tier}</Text>
            </View>
            <View style={styles.referralCodeCard}>
              <Text style={[styles.codeLabel, { color: isDark ? '#888' : '#666' }]}>Your Referral Code</Text>
              <View style={styles.codeContainer}>
                <Text style={[styles.codeText, { color: isDark ? '#fff' : '#000' }]}>{referralData.code}</Text>
                <TouchableOpacity 
                  style={[styles.copyButton, copied && styles.copyButtonCopied]}
                  onPress={copyReferralCode}
                >
                  <Ionicons name={copied ? 'checkmark-outline' : 'copy-outline'} size={20} color={copied ? '#10B981' : Colors.brand.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.codeCopied, { color: copied ? '#10B981' : 'transparent' }]}>Copied!</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: isDark ? '#fff' : '#000' }]}>${referralData.totalEarned.toFixed(2)}</Text>
              <Text style={[styles.heroStatLabel, { color: isDark ? '#888' : '#666' }]}>Total Earned</Text>
            </View>
            <View style={[styles.heroStat, { borderLeftWidth: 1, borderLeftColor: '#eee', borderRightWidth: 1, borderRightColor: '#eee' }]}>
              <Text style={[styles.heroStatValue, { color: isDark ? '#fff' : '#000' }]}>{referralData.successfulReferrals}</Text>
              <Text style={[styles.heroStatLabel, { color: isDark ? '#888' : '#666' }]}>Successful</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: isDark ? '#fff' : '#000' }]}>{referralData.pendingReferrals}</Text>
              <Text style={[styles.heroStatLabel, { color: isDark ? '#888' : '#666' }]}>Pending</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.shareButton, { backgroundColor: Colors.brand.primary }]} onPress={shareReferral}>
            <Ionicons name="share-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.shareButtonText}>Share Referral Link</Text>
          </TouchableOpacity>
        </View>

        {/* Progress to Next Tier */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <View style={styles.tierProgressHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Progress to {referralData.nextTier}</Text>
            <Text style={[styles.tierProgressText, { color: isDark ? '#888' : '#666' }]}>{referralData.successfulReferrals} / {referralData.nextTierRequirement} referrals</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: Colors.brand.primary,
                  width: `${Math.min((referralData.successfulReferrals / referralData.nextTierRequirement) * 100, 100)}%`
                }
              ]} 
            />
          </View>
          <Text style={[styles.tierProgressDetail, { color: isDark ? '#888' : '#666' }]}>{referralData.nextTierRequirement - referralData.successfulReferrals} more referrals to reach {referralData.nextTier}</Text>
        </View>

        {/* How It Works */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>How It Works</Text>
          <View style={styles.stepsContainer}>
            {[
              { number: 1, title: 'Share Your Code', description: 'Share your referral code or link with friends' },
              { number: 2, title: 'They Sign Up', description: 'Friends sign up using your code or link' },
              { number: 3, title: 'They Complete Tasks', description: 'Friends complete their first task' },
              { number: 4, title: 'You Both Earn', description: 'You get $30, they get $10 bonus' },
            ].map((step) => (
              <View key={step.number} style={styles.step}>
                <View style={styles.stepNumber}>{step.number}</View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepTitle, { color: isDark ? '#fff' : '#000' }]}>{step.title}</Text>
                  <Text style={[styles.stepDescription, { color: isDark ? '#888' : '#666' }]}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Rewards Tiers */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Milestone Rewards</Text>
          <View style={styles.rewardsList}>
            {referralData.rewards.map((reward: any, index: number) => {
              const achieved = referralData.successfulReferrals >= reward.referrals;
              const current = referralData.successfulReferrals >= reward.referrals && 
                (index === referralData.rewards.length - 1 || referralData.successfulReferrals < referralData.rewards[index + 1].referrals);
              
              return (
                <View key={reward.referrals} style={[styles.rewardItem, achieved && styles.rewardAchieved, current && styles.rewardCurrent]}>
                  <View style={[styles.rewardIcon, achieved && styles.rewardIconAchieved, current && styles.rewardIconCurrent]}>
                    <Ionicons name={achieved ? 'checkmark-outline' : 'lock-closed-outline'} size={20} color={achieved ? '#fff' : (isDark ? '#555' : '#999')} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <View style={styles.rewardHeader}>
                      <Text style={[styles.rewardReferrals, { color: isDark ? '#fff' : '#000' }]}>{reward.referrals} Referral{reward.referrals > 1 ? 's' : ''}</Text>
                      <Text style={[styles.rewardAmount, { color: achieved ? '#10B981' : (isDark ? '#888' : '#666')}]}>{reward.reward}</Text>
                    </View>
                    <Text style={[styles.rewardDescription, { color: isDark ? '#888' : '#666' }]}>{reward.description}</Text>
                  </View>
                  {achieved && <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />}
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16, marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(screens)/my-referrals')}>
              <Text style={[styles.seeAllText, { color: Colors.brand.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>
          {referralData.recentActivity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Ionicons name="people-outline" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyActivityText, { color: isDark ? '#fff' : '#000' }]}>No referrals yet</Text>
              <Text style={[styles.emptyActivitySubtext, { color: isDark ? '#888' : '#666' }]}>Share your code to start earning</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {referralData.recentActivity.slice(0, 5).map((activity: any) => {
                const statusConfig = getStatusConfig(activity.status);
                return (
                  <TouchableOpacity key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityAvatar}>
                      <Text style={styles.activityAvatarText}>{activity.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityName, { color: isDark ? '#fff' : '#000' }]}>{activity.name}</Text>
                      <Text style={[styles.activityDate, { color: isDark ? '#888' : '#666' }]}>{formatDate(activity.date)}</Text>
                    </View>
                    <View style={styles.activityEarnings}>
                      <View style={[styles.activityStatus, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.activityStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                      </View>
                      <Text style={[styles.activityAmount, { color: activity.status === 'completed' ? '#10B981' : (isDark ? '#888' : '#666')}]}>{activity.status === 'completed' ? '+' : ''}$${activity.earnings.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  myReferralsText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  heroCard: { borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  heroTop: { marginBottom: 20 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  tierLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.brand.primary },
  tierName: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.brand.primary },
  referralCodeCard: { backgroundColor: '#8B85FF15', borderRadius: 28, padding: 20 },
  codeLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  codeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeText: { fontSize: 28, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  copyButton: { width: 44, height: 44, borderRadius: 28, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center' },
  copyButtonCopied: { backgroundColor: '#10B981' },
  codeCopied: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 8, textAlign: 'center' },
  heroStats: { flexDirection: 'row', marginBottom: 20 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  heroStatLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  shareButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  section: { borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  tierProgressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tierProgressText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  progressBar: { height: 8, borderRadius: 28, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  tierProgressDetail: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 8 },
  stepsContainer: { gap: 20 },
  step: { flexDirection: 'row', gap: 16 },
  stepNumber: { width: 32, height: 32, borderRadius: 28, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  stepDescription: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 18 },
  rewardsList: { gap: 12 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 32, borderWidth: 1, borderColor: '#eee' },
  rewardAchieved: { borderColor: '#10B981', backgroundColor: '#10B98110' },
  rewardCurrent: { borderColor: Colors.brand.primary, backgroundColor: '#8B85FF10' },
  rewardIcon: { width: 44, height: 44, borderRadius: 28, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  rewardIconAchieved: { backgroundColor: '#10B981' },
  rewardIconCurrent: { backgroundColor: Colors.brand.primary },
  rewardInfo: { flex: 1 },
  rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardReferrals: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  rewardAmount: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  rewardDescription: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  emptyActivity: { alignItems: 'center', paddingVertical: 32 },
  emptyActivityText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginTop: 12 },
  emptyActivitySubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  activityList: { gap: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  activityAvatar: { width: 44, height: 44, borderRadius: 28, backgroundColor: '#8B85FF15', justifyContent: 'center', alignItems: 'center' },
  activityAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.brand.primary },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  activityDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  activityEarnings: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  activityStatusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  activityAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
});