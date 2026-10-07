/**
 * Stats Screen - User statistics and analytics
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTaskStore } from '@/store/taskStore';
import { apiGet } from '@/services/api';
import { Colors } from '@/constants/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useUIStore();
  const { tasks, completedTasks, postedTasks, appliedTasks } = useTaskStore();
  
  const isDark = theme === 'dark';
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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>My Stats</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#8B85FF" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading statistics...</Text>
        </View>
      </View>
    );
  }

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'grid-outline' },
    { key: 'tasks', label: 'Tasks', icon: 'clipboard-outline' },
    { key: 'earnings', label: 'Earnings', icon: 'cash-outline' },
    { key: 'activity', label: 'Activity', icon: 'pulse-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>My Stats</Text>
          <TouchableOpacity onPress={() => Alert.alert('Export Data', 'Export functionality coming soon!')}>
            <Ionicons name="download-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Selector */}
        <View style={[styles.timeRangeContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.timeRangeLabel, { color: isDark ? '#fff' : '#000' }]}>Time Range</Text>
          <View style={styles.timeRangeTabs}>
            {['week', 'month', 'year', 'all'].map((range) => (
              <TouchableOpacity 
                key={range}
                style={[styles.timeRangeTab, timeRange === range && styles.timeRangeTabActive]}
                onPress={() => setTimeRange(range as any)}
              >
                <Text style={[styles.timeRangeTabText, timeRange === range ? { color: '#fff' } : { color: isDark ? '#ddd' : '#333' }]}>{range.charAt(0).toUpperCase() + range.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabContainer, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
          <View style={styles.tabScroll}>
            {tabs.map((tab) => (
              <TouchableOpacity 
                key={tab.key}
                style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
                onPress={() => setSelectedTab(tab.key as any)}
              >
                <Ionicons name={tab.icon as any} size={20} color={selectedTab === tab.key ? '#fff' : isDark ? '#ddd' : '#666'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, selectedTab === tab.key ? { color: '#fff' } : { color: isDark ? '#ddd' : '#333' }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View style={{ marginTop: 16 }}>
          {selectedTab === 'overview' && <OverviewTab stats={stats.overview} isDark={isDark} formatCurrency={formatCurrency} />}
          {selectedTab === 'tasks' && <TasksTab stats={stats.tasks} isDark={isDark} />}
          {selectedTab === 'earnings' && <EarningsTab stats={stats.earnings} isDark={isDark} formatCurrency={formatCurrency} />}
          {selectedTab === 'activity' && <ActivityTab stats={stats.activity} isDark={isDark} />}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Overview Tab
const OverviewTab = ({ stats, isDark, formatCurrency }: any) => (
  <View>
    {/* Level & XP */}
    <View style={[styles.levelCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
      <View style={styles.levelHeader}>
        <View style={styles.levelInfo}>
          <Text style={[styles.levelLabel, { color: isDark ? '#888' : '#666' }]}>Current Level</Text>
          <Text style={[styles.levelNumber, { color: isDark ? '#fff' : '#000' }]}>Level {stats.level}</Text>
        </View>
        <View style={[styles.levelProgressContainer, { backgroundColor: '#8B85FF15' }]}>
          <Text style={[styles.levelProgressText, { color: Colors.brand.primary }]}>{stats.xp} / {stats.nextLevelXp} XP</Text>
        </View>
      </View>
      <View style={styles.levelProgressBar}>
        <View style={[styles.levelProgressFill, { backgroundColor: Colors.brand.primary, width: `${(stats.xp / stats.nextLevelXp) * 100}%` }]} />
      </View>
    </View>

    {/* Key Stats Grid */}
    <View style={styles.statsGrid}>
      <StatCard 
        title="Tasks Completed" 
        value={stats.totalTasksCompleted} 
        icon="check-circle-outline" 
        color="#10B981" 
        isDark={isDark} 
      />
      <StatCard 
        title="Tasks Posted" 
        value={stats.totalTasksPosted} 
        icon="add-circle-outline" 
        color="#8B85FF" 
        isDark={isDark} 
      />
      <StatCard 
        title="Total Earned" 
        value={formatCurrency(stats.totalEarned)} 
        icon="cash-outline" 
        color="#F59E0B" 
        isDark={isDark} 
      />
      <StatCard 
        title="Total Spent" 
        value={formatCurrency(stats.totalSpent)} 
        icon="card-outline" 
        color="#EF4444" 
        isDark={isDark} 
      />
      <StatCard 
        title="Rating" 
        value={stats.avgRating.toFixed(1)} 
        icon="star-outline" 
        color="#F59E0B" 
        isDark={isDark} 
        subtitle={`${stats.completionRate}% completion`}
      />
      <StatCard 
        title="Response Rate" 
        value={`${stats.responseRate}%`} 
        icon="chatbubble-outline" 
        color="#8B5CF6" 
        isDark={isDark} 
        subtitle={stats.responseTime}
      />
    </View>

    {/* Streaks */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Streaks</Text>
      <View style={styles.streakRow}>
        <View style={styles.streakItem}>
          <View style={[styles.streakIcon, { backgroundColor: '#EF444415' }]}>
            <Ionicons name="flame-outline" size={24} color="#EF4444" />
          </View>
          <Text style={[styles.streakValue, { color: isDark ? '#fff' : '#000' }]}>{stats.currentStreak}</Text>
          <Text style={[styles.streakLabel, { color: isDark ? '#888' : '#666' }]}>Current Streak</Text>
          <Text style={[styles.streakSub, { color: '#EF4444' }]}>days</Text>
        </View>
        <View style={[styles.streakDivider, { backgroundColor: '#eee' }]} />
        <View style={styles.streakItem}>
          <View style={[styles.streakIcon, { backgroundColor: '#F59E0B15' }]}>
            <Ionicons name="trophy-outline" size={24} color="#F59E0B" />
          </View>
          <Text style={[styles.streakValue, { color: isDark ? '#fff' : '#000' }]}>{stats.longestStreak}</Text>
          <Text style={[styles.streakLabel, { color: isDark ? '#888' : '#666' }]}>Longest Streak</Text>
          <Text style={[styles.streakSub, { color: '#F59E0B' }]}>days</Text>
        </View>
      </View>
    </View>

    {/* Member Since */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Member Since</Text>
      <View style={styles.memberSinceRow}>
        <View style={[styles.memberSinceIcon, { backgroundColor: '#8B85FF15' }]}>
          <Ionicons name="calendar-outline" size={24} color="#8B85FF" />
        </View>
        <View>
          <Text style={[styles.memberSinceDate, { color: isDark ? '#fff' : '#000' }]}>{new Date(stats.memberSince).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={[styles.memberSinceLabel, { color: isDark ? '#888' : '#666' }]}>Joined LocalBuddy</Text>
        </View>
      </View>
    </View>
  </View>
);

// Tasks Tab
const TasksTab = ({ stats, isDark }: any) => (
  <View>
    {/* Category Breakdown */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Tasks by Category</Text>
      <View style={styles.categoryList}>
        {stats.byCategory.map((cat: any, i: number) => (
          <View key={cat.category} style={[styles.categoryRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 12 }]}>
            <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: isDark ? '#fff' : '#000' }]}>{cat.category}</Text>
              <Text style={[styles.categoryCount, { color: isDark ? '#888' : '#666' }]}>{cat.count} tasks</Text>
            </View>
            <View style={styles.categoryBar}>
              <View style={[styles.categoryBarFill, { backgroundColor: cat.color, width: `${(cat.count / Math.max(...stats.byCategory.map((c: any) => c.count))) * 100}%` }]} />
            </View>
            <Text style={[styles.categoryValue, { color: isDark ? '#fff' : '#000' }]}>{cat.count}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* Monthly Chart */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Monthly Activity</Text>
      <View style={styles.chartContainer}>
        {stats.byMonth.map((month: any) => (
          <View key={month.month} style={styles.chartBarGroup}>
            <View style={styles.chartBars}>
              <View style={[styles.chartBar, { height: `${(month.completed / 10) * 100}%`, backgroundColor: '#10B981' }]} />
              <View style={[styles.chartBar, { height: `${(month.posted / 10) * 100}%`, backgroundColor: Colors.brand.primary, marginLeft: 4 }]} />
            </View>
            <Text style={[styles.chartLabel, { color: isDark ? '#888' : '#666' }]}>{month.month}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#ddd' : '#333' }]}>Completed</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.brand.primary }]} />
          <Text style={[styles.legendText, { color: isDark ? '#ddd' : '#333' }]}>Posted</Text>
        </View>
      </View>
    </View>

    {/* Summary Cards */}
    <View style={styles.statsGrid}>
      <StatCard title="In Progress" value={stats.inProgress} icon="time-outline" color="#F59E0B" isDark={isDark} />
      <StatCard title="Cancelled" value={stats.cancelled} icon="close-circle-outline" color="#EF4444" isDark={isDark} />
      <StatCard title="Applied" value={stats.applied} icon="send-outline" color="#8B5CF6" isDark={isDark} />
    </View>
  </View>
);

// Earnings Tab
const EarningsTab = ({ stats, isDark, formatCurrency }: any) => (
  <View>
    {/* Net Earnings Card */}
    <View style={[styles.netEarningsCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
      <Text style={[styles.netEarningsLabel, { color: isDark ? '#888' : '#666' }]}>Net Earnings</Text>
      <Text style={[styles.netEarningsValue, { color: stats.netEarnings >= 0 ? '#10B981' : '#EF4444' }]}>{formatCurrency(stats.netEarnings)}</Text>
      <View style={styles.netEarningsBreakdown}>
        <View style={styles.netEarningsItem}>
          <Text style={[styles.netEarningsItemLabel, { color: isDark ? '#888' : '#666' }]}>Earned</Text>
          <Text style={[styles.netEarningsItemValue, { color: '#10B981' }]}>+{formatCurrency(stats.totalEarned)}</Text>
        </View>
        <View style={[styles.netEarningsDivider, { backgroundColor: '#eee' }]} />
        <View style={styles.netEarningsItem}>
          <Text style={[styles.netEarningsItemLabel, { color: isDark ? '#888' : '#666' }]}>Spent</Text>
          <Text style={[styles.netEarningsItemValue, { color: '#EF4444' }]}>-{formatCurrency(stats.totalSpent)}</Text>
        </View>
      </View>
    </View>

    {/* Monthly Earnings Chart */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Monthly Earnings</Text>
      <View style={styles.chartContainer}>
        {stats.monthly.map((month: any) => (
          <View key={month.month} style={styles.chartBarGroup}>
            <View style={styles.chartBars}>
              <View style={[styles.chartBar, { height: `${(month.earned / 250) * 100}%`, backgroundColor: '#10B981' }]} />
              <View style={[styles.chartBar, { height: `${(month.spent / 250) * 100}%`, backgroundColor: '#EF4444', marginLeft: 4 }]} />
            </View>
            <Text style={[styles.chartLabel, { color: isDark ? '#888' : '#666' }]}>{month.month}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#ddd' : '#333' }]}>Earned</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#ddd' : '#333' }]}>Spent</Text>
        </View>
      </View>
    </View>

    {/* Earnings by Category */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Earnings by Category</Text>
      <View style={styles.categoryList}>
        {stats.byCategory.map((cat: any, i: number) => (
          <View key={cat.category} style={[styles.categoryRow, i > 0 && { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12, marginTop: 12 }]}>
            <View style={[styles.categoryColor, { backgroundColor: cat.color }]} />
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryName, { color: isDark ? '#fff' : '#000' }]}>{cat.category}</Text>
              <Text style={[styles.categoryCount, { color: isDark ? '#888' : '#666' }]}>{cat.count} tasks</Text>
            </View>
            <Text style={[styles.categoryValue, { color: '#10B981' }]}>{formatCurrency(cat.earned)}</Text>
          </View>
        ))}
      </View>
    </View>

    {/* Summary Stats */}
    <View style={styles.statsGrid}>
      <StatCard title="This Month" value={formatCurrency(stats.thisMonth)} icon="calendar-outline" color="#8B85FF" isDark={isDark} />
      <StatCard title="Last Month" value={formatCurrency(stats.lastMonth)} icon="calendar-outline" color="#8B5CF6" isDark={isDark} />
      <StatCard title="Avg/Task" value={formatCurrency(stats.avgPerTask)} icon="calculator-outline" color="#10B981" isDark={isDark} />
      <StatCard title="Highest" value={formatCurrency(stats.highestEarning)} icon="trending-up-outline" color="#F59E0B" isDark={isDark} />
    </View>
  </View>
);

// Activity Tab
const ActivityTab = ({ stats, isDark }: any) => (
  <View>
    {/* Weekly Activity */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Weekly Activity</Text>
      <View style={styles.chartContainer}>
        {stats.weeklyActivity.map((day: any) => (
          <View key={day.day} style={styles.chartBarGroup}>
            <View style={styles.chartBars}>
              <View style={[styles.chartBar, { height: `${(day.tasks / 5) * 100}%`, backgroundColor: Colors.brand.primary }]} />
              <View style={[styles.chartBar, { height: `${(day.hours / 5) * 100}%`, backgroundColor: '#10B981', marginLeft: 4 }]} />
            </View>
            <Text style={[styles.chartLabel, { color: isDark ? '#888' : '#666' }]}>{day.day}</Text>
          </View>
        ))}
      </View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.brand.primary }]} />
          <Text style={[styles.legendText, { color: isDark ? '#ddd' : '#333' }]}>Tasks</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#ddd' : '#333' }]}>Hours</Text>
        </View>
      </View>
    </View>

    {/* Activity Stats */}
    <View style={styles.statsGrid}>
      <StatCard title="Login Streak" value={stats.loginStreak} icon="flame-outline" color="#EF4444" isDark={isDark} subtitle="days" />
      <StatCard title="Tasks This Week" value={stats.tasksThisWeek} icon="calendar-outline" color="#8B85FF" isDark={isDark} />
      <StatCard title="Tasks This Month" value={stats.tasksThisMonth} icon="calendar-outline" color="#10B981" isDark={isDark} />
      <StatCard title="Hours Active" value={stats.hoursActive} icon="time-outline" color="#F59E0B" isDark={isDark} />
      <StatCard title="Messages Sent" value={stats.messagesSent} icon="chatbubble-outline" color="#8B5CF6" isDark={isDark} />
      <StatCard title="Reviews Written" value={stats.reviewsWritten} icon="star-outline" color="#F59E0B" isDark={isDark} />
      <StatCard title="Referrals Made" value={stats.referralsMade} icon="person-add-outline" color="#8B85FF" isDark={isDark} />
      <StatCard title="Achievements" value={stats.achievementsUnlocked} icon="trophy-outline" color="#EF4444" isDark={isDark} />
    </View>

    {/* Last Active */}
    <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }, { marginTop: 16 }]}>
      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Last Active</Text>
      <View style={styles.memberSinceRow}>
        <View style={[styles.memberSinceIcon, { backgroundColor: '#10B98115' }]}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#10B981" />
        </View>
        <View>
          <Text style={[styles.memberSinceDate, { color: isDark ? '#fff' : '#000' }]}>{new Date(stats.lastActive).toLocaleString()}</Text>
          <Text style={[styles.memberSinceLabel, { color: isDark ? '#888' : '#666' }]}>Currently active</Text>
        </View>
      </View>
    </View>
  </View>
);

// Stat Card Component
const StatCard = ({ title, value, icon, color, isDark, subtitle }: any) => (
  <View style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: isDark ? '#888' : '#666' }]}>{title}</Text>
    {subtitle && <Text style={[styles.statSubtitle, { color: color }]}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  timeRangeContainer: { borderRadius: 28, padding: 16, borderWidth: 1, borderColor: '#eee' },
  timeRangeLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  timeRangeTabs: { flexDirection: 'row', gap: 8 },
  timeRangeTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 32, borderWidth: 1, borderColor: '#eee' },
  timeRangeTabActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary },
  timeRangeTabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  tabContainer: { borderRadius: 28, padding: 4, borderWidth: 1, borderColor: '#eee' },
  tabScroll: { flexDirection: 'row', gap: 4 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  tabActive: { backgroundColor: Colors.brand.primary },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  statCard: { width: '48%', borderRadius: 28, padding: 16, borderWidth: 1, borderColor: '#eee', alignItems: 'center' },
  statIcon: { width: 48, height: 48, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  statTitle: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center', marginTop: 4 },
  statSubtitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  sectionCard: { borderRadius: 28, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  levelCard: { borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  levelInfo: { flex: 1 },
  levelLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  levelNumber: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  levelProgressContainer: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  levelProgressText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  levelProgressBar: { height: 8, borderRadius: 28, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  levelProgressFill: { height: '100%', borderRadius: 4 },
  streakRow: { flexDirection: 'row' },
  streakItem: { flex: 1, alignItems: 'center', gap: 8 },
  streakIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  streakValue: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  streakLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  streakSub: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  streakDivider: { width: 1, height: 60 },
  memberSinceRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  memberSinceIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  memberSinceDate: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  memberSinceLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  categoryList: { gap: 0 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryColor: { width: 12, height: 12, borderRadius: 6 },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  categoryCount: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  categoryBar: { width: 60, height: 6, borderRadius: 5, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  categoryValue: { fontSize: 14, fontFamily: 'Inter_700Bold', minWidth: 50, textAlign: 'right' },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 120, paddingVertical: 16 },
  chartBarGroup: { alignItems: 'center', flex: 1 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 100, justifyContent: 'center', gap: 4 },
  chartBar: { width: 16, borderRadius: 4 },
  chartLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 8, color: '#666' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendColor: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  netEarningsCard: { borderRadius: 28, padding: 24, borderWidth: 1, borderColor: '#eee', marginBottom: 16, alignItems: 'center' },
  netEarningsLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  netEarningsValue: { fontSize: 36, fontFamily: 'Inter_700Bold' },
  netEarningsBreakdown: { flexDirection: 'row', alignItems: 'center', marginTop: 16, width: '100%' },
  netEarningsItem: { flex: 1, alignItems: 'center' },
  netEarningsItemLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  netEarningsItemValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  netEarningsDivider: { width: 1, height: 40 },
});