/**
 * Stats Screen — Soft Modern
 * Cocoa segmented tabs, white stat tiles with tinted icon chips,
 * orange level progress bar, animated bar charts. Stats logic unchanged.
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { apiGet } from '@/services/api';
import { ScreenHeader } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';

export default function StatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { tasks, completedTasks, postedTasks, appliedTasks } = useTaskStore();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tasks' | 'earnings' | 'activity'>('overview');

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await apiGet<{ stats: any }>('/users/me/stats');
      const server = (res as any)?.stats || res || {};
      const myCompletedTasks = completedTasks.filter(t => t.status === 'completed');
      const myPostedTasks = postedTasks;
      const myAppliedTasks = appliedTasks;
      const totalEarned = server.totalEarnings ?? myCompletedTasks.reduce((sum, t) => sum + (t.budget?.amount || 0), 0);
      const totalSpent = server.totalSpent ?? myPostedTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.budget?.amount || 0), 0);
      const avgRating = (user as any)?.rating?.average ?? 0;
      const completionRate = server.completionRate ?? (myPostedTasks.length > 0
        ? Math.round((myPostedTasks.filter(t => t.status === 'completed').length / myPostedTasks.length) * 100)
        : 0);
      setStats({
        overview: {
          totalTasksCompleted: server.tasksCompleted ?? myCompletedTasks.length,
          totalTasksPosted: server.tasksPosted ?? myPostedTasks.length,
          totalEarned,
          totalSpent,
          avgRating,
          completionRate,
          currentStreak: 0,
          longestStreak: 0,
          responseRate: completionRate,
          responseTime: '-',
          memberSince: user?.createdAt || '',
          level: Math.floor((server.tasksCompleted ?? myCompletedTasks.length) / 10) + 1,
          xp: (server.tasksCompleted ?? myCompletedTasks.length) * 50 + (server.tasksPosted ?? myPostedTasks.length) * 10,
          nextLevelXp: ((Math.floor((server.tasksCompleted ?? myCompletedTasks.length) / 10) + 1) * 10) * 50,
        },
        tasks: {
          completed: server.tasksCompleted ?? myCompletedTasks.length,
          posted: server.tasksPosted ?? myPostedTasks.length,
          applied: myAppliedTasks.length,
          inProgress: tasks.filter(t => t.status === 'in_progress').length,
          cancelled: tasks.filter(t => t.status === 'cancelled').length,
          byCategory: [],
          byMonth: [],
        },
        earnings: {
          totalEarned,
          totalSpent,
          netEarnings: totalEarned - totalSpent,
          thisMonth: 0,
          lastMonth: 0,
          avgPerTask: myCompletedTasks.length > 0 ? totalEarned / myCompletedTasks.length : 0,
          highestEarning: Math.max(...myCompletedTasks.map(t => t.budget?.amount || 0), 0),
          byCategory: [],
          monthly: [],
        },
        activity: {
          loginStreak: 0,
          tasksThisWeek: 0,
          tasksThisMonth: 0,
          hoursActive: 0,
          messagesSent: 0,
          reviewsWritten: 0,
          referralsMade: 0,
          achievementsUnlocked: 0,
          lastActive: user?.lastActiveAt || new Date().toISOString(),
          weeklyActivity: [],
        },
      });
    } catch (e) {
      console.warn('[Stats] load failed:', e);
      setStats({
        overview: { totalTasksCompleted: 0, totalTasksPosted: 0, totalEarned: 0, totalSpent: 0, avgRating: 0, completionRate: 0, currentStreak: 0, longestStreak: 0, responseRate: 0, responseTime: '-', memberSince: '', level: 1, xp: 0, nextLevelXp: 500 },
        tasks: { completed: 0, posted: 0, applied: 0, inProgress: 0, cancelled: 0, byCategory: [], byMonth: [] },
        earnings: { totalEarned: 0, totalSpent: 0, netEarnings: 0, thisMonth: 0, lastMonth: 0, avgPerTask: 0, highestEarning: 0, byCategory: [], monthly: [] },
        activity: { loginStreak: 0, tasksThisWeek: 0, tasksThisMonth: 0, hoursActive: 0, messagesSent: 0, reviewsWritten: 0, referralsMade: 0, achievementsUnlocked: 0, lastActive: '', weeklyActivity: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="analytics" size={30} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'grid' as const },
    { key: 'tasks', label: 'Tasks', icon: 'clipboard' as const },
    { key: 'earnings', label: 'Earnings', icon: 'cash' as const },
    { key: 'activity', label: 'Activity', icon: 'pulse' as const },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* In-page header with export */}
        <ScreenHeader
          title="My stats"
          subtitle="Your progress at a glance"
          onBack={() => router.back()}
          right={
            <Pressable onPress={() => Alert.alert('Export Data', 'Export functionality coming soon!')} style={styles.exportBtn} hitSlop={8}>
              <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            </Pressable>
          }
        />

        {/* Time Range Selector */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 80 }} style={styles.rangeWrap}>
          {(['week', 'month', 'year', 'all'] as const).map((range) => {
            const active = timeRange === range;
            return (
              <Pressable
                key={range}
                style={[styles.rangeTab, active && styles.rangeTabActive]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.rangeTabText, active && styles.rangeTabTextActive]}>{range.charAt(0).toUpperCase() + range.slice(1)}</Text>
              </Pressable>
            );
          })}
        </MotiView>

        {/* Tab Navigation */}
        <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 160 }} style={styles.tabContainer}>
          {tabs.map((tab) => {
            const active = selectedTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setSelectedTab(tab.key as any)}
              >
                <Ionicons name={tab.icon} size={15} color={active ? '#FFFFFF' : Colors.text.secondary} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </MotiView>

        {/* Tab Content */}
        <MotiView key={selectedTab} from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 350 }} style={{ marginTop: Spacing[5] }}>
          {selectedTab === 'overview' && <OverviewTab stats={stats.overview} formatCurrency={formatCurrency} />}
          {selectedTab === 'tasks' && <TasksTab stats={stats.tasks} />}
          {selectedTab === 'earnings' && <EarningsTab stats={stats.earnings} formatCurrency={formatCurrency} />}
          {selectedTab === 'activity' && <ActivityTab stats={stats.activity} />}
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================
// Shared pieces
// ============================================================

const SectionCard = ({ title, children, delay = 0 }: any) => (
  <MotiView
    from={{ opacity: 0, translateY: 14 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 400, delay }}
    style={styles.sectionCard}
  >
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </MotiView>
);

const StatCard = ({ title, value, icon, color, subtitle }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color + '1A' }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{value}</Text>
    <Text style={styles.statTitle} numberOfLines={2}>{title}</Text>
    {subtitle ? <Text style={[styles.statSubtitle, { color }]}>{subtitle}</Text> : null}
  </View>
);

const BarChart = ({ groups, legend }: { groups: Array<{ label: string; bars: Array<{ value: number; max: number; color: string }> }>; legend: Array<{ label: string; color: string }> }) => (
  <View>
    <View style={styles.chartContainer}>
      {groups.map((g, gi) => (
        <View key={g.label} style={styles.chartBarGroup}>
          <View style={styles.chartBars}>
            {g.bars.map((b, bi) => (
              <MotiView
                key={bi}
                from={{ height: 4 }}
                animate={{ height: Math.max(4, Math.min(100, (b.value / (b.max || 1)) * 100)) }}
                transition={{ type: 'timing', duration: 600, delay: 200 + gi * 60 }}
                style={[styles.chartBar, { backgroundColor: b.color }]}
              />
            ))}
          </View>
          <Text style={styles.chartLabel}>{g.label}</Text>
        </View>
      ))}
    </View>
    <View style={styles.chartLegend}>
      {legend.map((l) => (
        <View key={l.label} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: l.color }]} />
          <Text style={styles.legendText}>{l.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

const EmptyNote = ({ text }: { text: string }) => (
  <View style={styles.emptyNote}>
    <Ionicons name="bar-chart-outline" size={26} color={Colors.brand.accent} />
    <Text style={styles.emptyNoteText}>{text}</Text>
  </View>
);

// ============================================================
// Overview Tab
// ============================================================
const OverviewTab = ({ stats, formatCurrency }: any) => (
  <View>
    {/* Level & XP — cocoa hero */}
    <MotiView
      from={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 420 }}
      style={styles.levelCard}
    >
      <View style={styles.levelHeader}>
        <View style={styles.levelInfo}>
          <Text style={styles.levelLabel}>CURRENT LEVEL</Text>
          <Text style={styles.levelNumber}>Level {stats.level}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Ionicons name="trophy" size={16} color={Colors.brand.accent} />
          <Text style={styles.levelBadgeText}>{stats.xp} / {stats.nextLevelXp} XP</Text>
        </View>
      </View>
      <View style={styles.levelProgressBar}>
        <MotiView
          from={{ width: '0%' }}
          animate={{ width: `${Math.min(100, (stats.xp / stats.nextLevelXp) * 100)}%` }}
          transition={{ type: 'timing', duration: 800, delay: 300 }}
          style={styles.levelProgressFill}
        />
      </View>
    </MotiView>

    {/* Key Stats Grid */}
    <View style={styles.statsGrid}>
      <StatCard title="Tasks Completed" value={stats.totalTasksCompleted} icon="checkmark-circle" color={Colors.semantic.success} />
      <StatCard title="Tasks Posted" value={stats.totalTasksPosted} icon="add-circle" color={Colors.brand.accent} />
      <StatCard title="Total Earned" value={formatCurrency(stats.totalEarned)} icon="cash" color={Colors.semantic.success} />
      <StatCard title="Total Spent" value={formatCurrency(stats.totalSpent)} icon="card" color={Colors.semantic.error} />
      <StatCard title="Rating" value={stats.avgRating.toFixed(1)} icon="star" color={Colors.semantic.warning} subtitle={`${stats.completionRate}% completion`} />
      <StatCard title="Response Rate" value={`${stats.responseRate}%`} icon="chatbubble" color={Colors.semantic.info} subtitle={stats.responseTime} />
    </View>

    {/* Streaks */}
    <SectionCard title="Streaks" delay={140}>
      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <View style={[styles.streakIcon, { backgroundColor: Colors.semantic.errorSoft }]}>
            <Ionicons name="flame" size={26} color={Colors.semantic.error} />
          </View>
          <Text style={styles.streakValue}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>Current streak</Text>
          <Text style={[styles.streakSub, { color: Colors.semantic.error }]}>days</Text>
        </View>
        <View style={styles.streakDivider} />
        <View style={styles.streakItem}>
          <View style={[styles.streakIcon, { backgroundColor: Colors.semantic.warningSoft }]}>
            <Ionicons name="trophy" size={26} color={Colors.semantic.warning} />
          </View>
          <Text style={styles.streakValue}>{stats.longestStreak}</Text>
          <Text style={styles.streakLabel}>Longest streak</Text>
          <Text style={[styles.streakSub, { color: Colors.semantic.warning }]}>days</Text>
        </View>
      </View>
    </SectionCard>

    {/* Member Since */}
    <SectionCard title="Member since" delay={220}>
      <View style={styles.memberRow}>
        <View style={[styles.memberIcon, { backgroundColor: Colors.brand.accentSoft }]}>
          <Ionicons name="calendar" size={22} color={Colors.brand.accent} />
        </View>
        <View>
          <Text style={styles.memberDate}>{stats.memberSince ? new Date(stats.memberSince).toLocaleDateString('en-IN', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</Text>
          <Text style={styles.memberLabel}>Joined Local Buddy</Text>
        </View>
      </View>
    </SectionCard>
  </View>
);

// ============================================================
// Tasks Tab
// ============================================================
const TasksTab = ({ stats }: any) => (
  <View>
    <SectionCard title="Tasks by category">
      {stats.byCategory.length === 0 ? (
        <EmptyNote text="Category breakdown appears once tasks flow in." />
      ) : (
        <View>
          {stats.byCategory.map((cat: any, i: number) => (
            <View key={cat.category} style={[styles.categoryRow, i > 0 && styles.categoryRowDivider]}>
              <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <Text style={styles.categoryCount}>{cat.count} tasks</Text>
              </View>
              <View style={styles.categoryBar}>
                <View style={[styles.categoryBarFill, { backgroundColor: cat.color, width: `${(cat.count / Math.max(...stats.byCategory.map((c: any) => c.count))) * 100}%` }]} />
              </View>
              <Text style={styles.categoryValue}>{cat.count}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>

    <SectionCard title="Monthly activity" delay={120}>
      {stats.byMonth.length === 0 ? (
        <EmptyNote text="Monthly chart appears as you complete more tasks." />
      ) : (
        <BarChart
          groups={stats.byMonth.map((m: any) => ({
            label: m.month,
            bars: [
              { value: m.completed, max: 10, color: Colors.semantic.success },
              { value: m.posted, max: 10, color: Colors.brand.accent },
            ],
          }))}
          legend={[
            { label: 'Completed', color: Colors.semantic.success },
            { label: 'Posted', color: Colors.brand.accent },
          ]}
        />
      )}
    </SectionCard>

    <View style={styles.statsGrid}>
      <StatCard title="In Progress" value={stats.inProgress} icon="time" color={Colors.semantic.warning} />
      <StatCard title="Cancelled" value={stats.cancelled} icon="close-circle" color={Colors.semantic.error} />
      <StatCard title="Applied" value={stats.applied} icon="send" color={Colors.semantic.info} />
    </View>
  </View>
);

// ============================================================
// Earnings Tab
// ============================================================
const EarningsTab = ({ stats, formatCurrency }: any) => (
  <View>
    {/* Net Earnings hero */}
    <MotiView
      from={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'timing', duration: 420 }}
      style={styles.netCard}
    >
      <Text style={styles.netLabel}>NET EARNINGS</Text>
      <Text style={[styles.netValue, { color: stats.netEarnings >= 0 ? '#FFFFFF' : '#FFD6D6' }]}>{formatCurrency(stats.netEarnings)}</Text>
      <View style={styles.netBreakdown}>
        <View style={styles.netItem}>
          <Text style={styles.netItemLabel}>Earned</Text>
          <Text style={[styles.netItemValue, { color: '#7CF2C4' }]}>+{formatCurrency(stats.totalEarned)}</Text>
        </View>
        <View style={styles.netDivider} />
        <View style={styles.netItem}>
          <Text style={styles.netItemLabel}>Spent</Text>
          <Text style={[styles.netItemValue, { color: '#FFB4B4' }]}>−{formatCurrency(stats.totalSpent)}</Text>
        </View>
      </View>
    </MotiView>

    <SectionCard title="Monthly earnings" delay={120}>
      {stats.monthly.length === 0 ? (
        <EmptyNote text="Earnings trends show up after your first payouts." />
      ) : (
        <BarChart
          groups={stats.monthly.map((m: any) => ({
            label: m.month,
            bars: [
              { value: m.earned, max: 250, color: Colors.semantic.success },
              { value: m.spent, max: 250, color: Colors.semantic.error },
            ],
          }))}
          legend={[
            { label: 'Earned', color: Colors.semantic.success },
            { label: 'Spent', color: Colors.semantic.error },
          ]}
        />
      )}
    </SectionCard>

    <SectionCard title="Earnings by category" delay={200}>
      {stats.byCategory.length === 0 ? (
        <EmptyNote text="No category earnings yet." />
      ) : (
        <View>
          {stats.byCategory.map((cat: any, i: number) => (
            <View key={cat.category} style={[styles.categoryRow, i > 0 && styles.categoryRowDivider]}>
              <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{cat.category}</Text>
                <Text style={styles.categoryCount}>{cat.count} tasks</Text>
              </View>
              <Text style={[styles.categoryValue, { color: Colors.semantic.success }]}>{formatCurrency(cat.earned)}</Text>
            </View>
          ))}
        </View>
      )}
    </SectionCard>

    <View style={styles.statsGrid}>
      <StatCard title="This Month" value={formatCurrency(stats.thisMonth)} icon="calendar" color={Colors.brand.accent} />
      <StatCard title="Last Month" value={formatCurrency(stats.lastMonth)} icon="calendar-outline" color={Colors.semantic.info} />
      <StatCard title="Avg / Task" value={formatCurrency(stats.avgPerTask)} icon="calculator" color={Colors.semantic.success} />
      <StatCard title="Highest" value={formatCurrency(stats.highestEarning)} icon="trending-up" color={Colors.semantic.warning} />
    </View>
  </View>
);

// ============================================================
// Activity Tab
// ============================================================
const ActivityTab = ({ stats }: any) => (
  <View>
    <SectionCard title="Weekly activity">
      {stats.weeklyActivity.length === 0 ? (
        <EmptyNote text="Your weekly rhythm appears here once active." />
      ) : (
        <BarChart
          groups={stats.weeklyActivity.map((d: any) => ({
            label: d.day,
            bars: [
              { value: d.tasks, max: 5, color: Colors.brand.accent },
              { value: d.hours, max: 5, color: Colors.semantic.success },
            ],
          }))}
          legend={[
            { label: 'Tasks', color: Colors.brand.accent },
            { label: 'Hours', color: Colors.semantic.success },
          ]}
        />
      )}
    </SectionCard>

    <View style={styles.statsGrid}>
      <StatCard title="Login Streak" value={stats.loginStreak} icon="flame" color={Colors.semantic.error} subtitle="days" />
      <StatCard title="Tasks This Week" value={stats.tasksThisWeek} icon="calendar" color={Colors.brand.accent} />
      <StatCard title="Tasks This Month" value={stats.tasksThisMonth} icon="calendar-outline" color={Colors.semantic.success} />
      <StatCard title="Hours Active" value={stats.hoursActive} icon="time" color={Colors.semantic.warning} />
      <StatCard title="Messages Sent" value={stats.messagesSent} icon="chatbubble" color={Colors.semantic.info} />
      <StatCard title="Reviews Written" value={stats.reviewsWritten} icon="star" color={Colors.semantic.warning} />
      <StatCard title="Referrals Made" value={stats.referralsMade} icon="person-add" color={Colors.brand.accent} />
      <StatCard title="Achievements" value={stats.achievementsUnlocked} icon="trophy" color={Colors.semantic.error} />
    </View>

    <SectionCard title="Last active" delay={200}>
      <View style={styles.memberRow}>
        <View style={[styles.memberIcon, { backgroundColor: Colors.semantic.successSoft }]}>
          <Ionicons name="checkmark-circle" size={22} color={Colors.semantic.success} />
        </View>
        <View>
          <Text style={styles.memberDate}>{stats.lastActive ? new Date(stats.lastActive).toLocaleString('en-IN') : '—'}</Text>
          <Text style={styles.memberLabel}>Currently active</Text>
        </View>
      </View>
    </SectionCard>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[4] },
  loadingBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },

  scrollContent: { padding: Spacing[5], paddingBottom: 40 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing[4] },
  pageTitle: { fontFamily: Typography.fontFamily.display, fontSize: 27, color: Colors.text.primary },
  pageSub: { fontFamily: Typography.fontFamily.body, fontSize: 12.5, color: Colors.text.secondary, marginTop: 2 },
  exportBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.primary,
    alignItems: 'center', justifyContent: 'center', ...Shadows.button,
  },

  rangeWrap: {
    flexDirection: 'row', backgroundColor: Colors.surface.tertiary,
    borderRadius: BorderRadius.pill, padding: 5, marginBottom: Spacing[4],
  },
  rangeTab: { flex: 1, alignItems: 'center', paddingVertical: Spacing[2] + 2, borderRadius: BorderRadius.pill },
  rangeTabActive: { backgroundColor: Colors.brand.primary, ...Shadows.button },
  rangeTabText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  rangeTabTextActive: { color: '#FFFFFF' },

  tabContainer: {
    flexDirection: 'row', backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.lg, padding: 5, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: Spacing[2] + 3, borderRadius: BorderRadius.md },
  tabActive: { backgroundColor: Colors.brand.accent, ...Shadows.buttonOrange },
  tabText: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  tabTextActive: { color: '#FFFFFF' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing[3], marginTop: Spacing[4] },
  statCard: {
    width: '48.5%', borderRadius: BorderRadius.lg, padding: Spacing[4],
    borderWidth: 1, borderColor: Colors.border.light, backgroundColor: Colors.surface.elevated,
    alignItems: 'center', ...Shadows.card,
  },
  statIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[2] },
  statValue: { fontSize: 21, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  statTitle: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: 4 },
  statSubtitle: { fontSize: 10.5, fontFamily: Typography.fontFamily.semiBold, marginTop: 2 },

  sectionCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[5], marginTop: Spacing[4],
    borderWidth: 1, borderColor: Colors.border.light, backgroundColor: Colors.surface.elevated,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 17, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },

  levelCard: {
    borderRadius: BorderRadius.xl, padding: Spacing[5],
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[4] },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.65)', letterSpacing: 1 },
  levelNumber: { fontSize: 28, fontFamily: Typography.fontFamily.display, color: '#FFFFFF', marginTop: 2 },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 6,
  },
  levelBadgeText: { fontSize: 11.5, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
  levelProgressBar: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  levelProgressFill: { height: '100%', borderRadius: 5, backgroundColor: Colors.brand.accent },

  streakRow: { flexDirection: 'row' },
  streakItem: { flex: 1, alignItems: 'center', gap: 6 },
  streakIcon: { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  streakValue: { fontSize: 28, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  streakLabel: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center' },
  streakSub: { fontSize: 10.5, fontFamily: Typography.fontFamily.semiBold, textTransform: 'uppercase', letterSpacing: 0.6 },
  streakDivider: { width: 1, backgroundColor: Colors.border.light, marginVertical: 8 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
  memberIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  memberDate: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  memberLabel: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[2] },
  categoryRowDivider: { borderTopWidth: 1, borderTopColor: Colors.border.light, paddingTop: Spacing[3], marginTop: Spacing[2] },
  categoryColor: { width: 12, height: 12, borderRadius: 6 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  categoryCount: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 1 },
  categoryBar: { width: 64, height: 8, borderRadius: 4, backgroundColor: Colors.surface.tertiary, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 4 },
  categoryValue: { fontSize: 14, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary, minWidth: 44, textAlign: 'right' },

  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 130, paddingVertical: Spacing[3] },
  chartBarGroup: { alignItems: 'center', flex: 1 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 96, justifyContent: 'center', gap: 4 },
  chartBar: { width: 14, borderRadius: 6 },
  chartLabel: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, marginTop: 6, color: Colors.text.muted },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing[5], marginTop: Spacing[3] },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },

  netCard: {
    borderRadius: BorderRadius.xl, padding: Spacing[6], alignItems: 'center',
    backgroundColor: Colors.brand.primary, ...Shadows.button,
  },
  netLabel: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.65)', letterSpacing: 1.2, marginBottom: Spacing[1] },
  netValue: { fontSize: 38, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.3 },
  netBreakdown: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing[4], width: '100%' },
  netItem: { flex: 1, alignItems: 'center' },
  netItemLabel: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.65)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.8 },
  netItemValue: { fontSize: 15, fontFamily: Typography.fontFamily.bold },
  netDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },

  emptyNote: { alignItems: 'center', paddingVertical: Spacing[5], gap: Spacing[2] },
  emptyNoteText: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', lineHeight: 18 },
});
