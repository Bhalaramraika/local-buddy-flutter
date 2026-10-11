/**
 * Referral Program Screen — Soft Modern
 * Orange hero with referral code chip, tier progress bar,
 * numbered "how it works" steps, milestone reward cards.
 * Data loading / share logic unchanged.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { apiGet } from '@/services/api';
import { ScreenHeader } from '@/components/ui';

export default function ReferralScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { showToast } = useUIStore();

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
        nextTier: stats.completed >= 20 ? 'Platinum' : stats.completed >= 10 ? 'Platinum' : 'Gold',
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

  const shareReferral = async () => {
    if (referralData) {
      try {
        await Share.share({
          message: `Join me on Local Buddy! Use my referral code ${referralData.code} to get ₹10 off your first task. ${referralData.referralLink}`,
          title: 'Join Local Buddy',
          url: referralData.referralLink,
        });
      } catch (error) {
        showToast('Failed to share', 'error');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="gift" size={30} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading referral data...</Text>
        </View>
      </View>
    );
  }

  if (!referralData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Refer & earn" subtitle="Invite friends, earn rewards" onBack={() => router.back()} />
        {/* Orange hero with referral code */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440 }}
          style={styles.heroCard}
        >
          <View style={styles.tierBadge}>
            <Ionicons name="gift" size={15} color="#FFFFFF" />
            <Text style={styles.tierLabel}>Your tier</Text>
            <Text style={styles.tierName}>{referralData.tier}</Text>
          </View>

          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{referralData.code}</Text>
              <Pressable
                style={[styles.copyButton, copied && styles.copyButtonCopied]}
                onPress={copyReferralCode}
                accessibilityLabel="Copy referral code"
              >
                <Ionicons name={copied ? 'checkmark' : 'copy'} size={19} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text style={[styles.codeCopied, { opacity: copied ? 1 : 0 }]}>Copied!</Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>₹{referralData.totalEarned.toFixed(0)}</Text>
              <Text style={styles.heroStatLabel}>Total Earned</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{referralData.successfulReferrals}</Text>
              <Text style={styles.heroStatLabel}>Successful</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{referralData.pendingReferrals}</Text>
              <Text style={styles.heroStatLabel}>Pending</Text>
            </View>
          </View>

          <Pressable style={styles.shareButton} onPress={shareReferral}>
            <Ionicons name="share-social" size={18} color={Colors.brand.accent} />
            <Text style={styles.shareButtonText}>Share referral link</Text>
          </Pressable>
        </MotiView>

        {/* My Referrals shortcut */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 120 }}>
          <Pressable style={styles.myReferralsRow} onPress={() => router.push('/(screens)/my-referrals')}>
            <View style={styles.myReferralsIcon}>
              <Ionicons name="people" size={18} color={Colors.brand.accent} />
            </View>
            <Text style={styles.myReferralsText}>See all my referrals</Text>
            <Ionicons name="chevron-forward" size={17} color={Colors.text.muted} />
          </Pressable>
        </MotiView>

        {/* Progress to Next Tier */}
        <MotableSection index={1} title={`Progress to ${referralData.nextTier}`}>
          <View style={styles.tierProgressHeader}>
            <Text style={styles.tierProgressText}>{referralData.successfulReferrals} / {referralData.nextTierRequirement} referrals</Text>
          </View>
          <View style={styles.progressBar}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: `${Math.min((referralData.successfulReferrals / referralData.nextTierRequirement) * 100, 100)}%` }}
              transition={{ type: 'timing', duration: 800, delay: 350 }}
              style={styles.progressFill}
            />
          </View>
          <Text style={styles.tierProgressDetail}>{referralData.nextTierRequirement - referralData.successfulReferrals} more referrals to reach {referralData.nextTier}</Text>
        </MotableSection>

        {/* How It Works */}
        <MotableSection index={2} title="How it works">
          <View style={styles.stepsContainer}>
            {[
              { number: 1, title: 'Share your code', description: 'Share your referral code or link with friends' },
              { number: 2, title: 'They sign up', description: 'Friends join using your code or link' },
              { number: 3, title: 'They complete tasks', description: 'Friends finish their first task' },
              { number: 4, title: 'You both earn', description: 'You get ₹30, they get ₹10 bonus' },
            ].map((step) => (
              <View key={step.number} style={styles.step}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </MotableSection>

        {/* Rewards Tiers */}
        <MotableSection index={3} title="Milestone rewards">
          <View style={styles.rewardsList}>
            {referralData.rewards.map((reward: any, index: number) => {
              const achieved = referralData.successfulReferrals >= reward.referrals;
              const current = referralData.successfulReferrals >= reward.referrals &&
                (index === referralData.rewards.length - 1 || referralData.successfulReferrals < referralData.rewards[index + 1].referrals);

              return (
                <View key={reward.referrals} style={[styles.rewardItem, achieved && styles.rewardAchieved, current && !achieved && styles.rewardCurrent]}>
                  <View style={[styles.rewardIcon, achieved ? styles.rewardIconAchieved : current ? styles.rewardIconCurrent : null]}>
                    <Ionicons name={achieved ? 'checkmark' : 'lock-closed'} size={18} color={achieved || current ? '#FFFFFF' : Colors.text.muted} />
                  </View>
                  <View style={styles.rewardInfo}>
                    <View style={styles.rewardHeader}>
                      <Text style={styles.rewardReferrals}>{reward.referrals} Referral{reward.referrals > 1 ? 's' : ''}</Text>
                      <Text style={[styles.rewardAmount, achieved && { color: Colors.semantic.success }]}>{reward.reward}</Text>
                    </View>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                  {achieved ? <Ionicons name="checkmark-circle" size={20} color={Colors.semantic.success} /> : null}
                </View>
              );
            })}
          </View>
        </MotableSection>

        {/* Recent Activity */}
        <MotableSection index={4} title="Recent activity">
          {referralData.recentActivity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="people-outline" size={30} color={Colors.brand.accent} />
              </View>
              <Text style={styles.emptyActivityText}>No referrals yet</Text>
              <Text style={styles.emptyActivitySubtext}>Share your code to start earning</Text>
            </View>
          ) : (
            <View style={styles.activityList}>
              {referralData.recentActivity.slice(0, 5).map((activity: any) => {
                const statusConfig = getStatusConfig(activity.status);
                return (
                  <View key={activity.id} style={styles.activityItem}>
                    <View style={styles.activityAvatar}>
                      <Text style={styles.activityAvatarText}>{activity.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityName}>{activity.name}</Text>
                      <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
                    </View>
                    <View style={styles.activityEarnings}>
                      <View style={[styles.activityStatus, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                        <Text style={[styles.activityStatusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
                      </View>
                      <Text style={[styles.activityAmount, { color: activity.status === 'completed' ? Colors.semantic.success : Colors.text.muted }]}>
                        {activity.status === 'completed' ? '+' : ''}₹{activity.earnings.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </MotableSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MotableSection({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: index * 80 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </MotiView>
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

  heroCard: {
    borderRadius: BorderRadius['2xl'], padding: Spacing[6],
    backgroundColor: Colors.brand.accent, marginBottom: Spacing[4], ...Shadows.buttonOrange,
  },
  tierBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 6, marginBottom: Spacing[5],
  },
  tierLabel: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.9)' },
  tierName: { fontSize: 13, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  codeCard: {
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: BorderRadius.lg,
    padding: Spacing[4], marginBottom: Spacing[5],
  },
  codeLabel: { fontSize: 10.5, fontFamily: Typography.fontFamily.bold, color: 'rgba(255,255,255,0.75)', letterSpacing: 1.4, marginBottom: Spacing[2] },
  codeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeText: { fontSize: 27, fontFamily: Typography.fontFamily.bold, letterSpacing: 2.5, color: '#FFFFFF' },
  copyButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  copyButtonCopied: { backgroundColor: Colors.semantic.success },
  codeCopied: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: '#FFFFFF', marginTop: Spacing[2], textAlign: 'right' },
  heroStats: { flexDirection: 'row', marginBottom: Spacing[5] },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 4 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 22, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  heroStatLabel: { fontSize: 11, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.8)', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.6 },
  shareButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2],
    paddingVertical: Spacing[4], borderRadius: BorderRadius.pill, backgroundColor: '#FFFFFF',
  },
  shareButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed },

  myReferralsRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[4],
    marginBottom: Spacing[4], ...Shadows.card,
  },
  myReferralsIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  myReferralsText: { flex: 1, fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },

  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5], marginBottom: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },
  tierProgressHeader: { marginBottom: Spacing[3], marginTop: -Spacing[2] },
  tierProgressText: { fontSize: 13, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
  progressBar: { height: 10, borderRadius: 5, backgroundColor: Colors.surface.tertiary, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: Colors.brand.accent },
  tierProgressDetail: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2] },

  stepsContainer: { gap: Spacing[4] },
  step: { flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start' },
  stepNumber: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brand.accent,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0, ...Shadows.buttonOrange,
  },
  stepNumberText: { color: '#FFFFFF', fontSize: 14, fontFamily: Typography.fontFamily.bold },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  stepDescription: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2, lineHeight: 18 },

  rewardsList: { gap: Spacing[3] },
  rewardItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[4], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border.light, backgroundColor: Colors.surface.primary,
  },
  rewardAchieved: { borderColor: Colors.semantic.success, backgroundColor: Colors.semantic.successSoft },
  rewardCurrent: { borderColor: Colors.brand.accent, backgroundColor: Colors.brand.accentSoft },
  rewardIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface.tertiary,
    justifyContent: 'center', alignItems: 'center',
  },
  rewardIconAchieved: { backgroundColor: Colors.semantic.success },
  rewardIconCurrent: { backgroundColor: Colors.brand.accent },
  rewardInfo: { flex: 1 },
  rewardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardReferrals: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  rewardAmount: { fontSize: 15, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  rewardDescription: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 },

  emptyActivity: { alignItems: 'center', paddingVertical: Spacing[6] },
  emptyIconWrap: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyActivityText: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyActivitySubtext: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 4 },
  activityList: { gap: Spacing[2] },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[2] },
  activityAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  activityAvatarText: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accentPressed },
  activityInfo: { flex: 1 },
  activityName: { fontSize: 14, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  activityDate: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 1 },
  activityEarnings: { alignItems: 'flex-end', gap: 4 },
  activityStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing[2], paddingVertical: 3, borderRadius: BorderRadius.pill },
  activityStatusText: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold },
  activityAmount: { fontSize: 14, fontFamily: Typography.fontFamily.bold },
});
