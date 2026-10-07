/**
 * Profile Screen - User profile, stats, settings access
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image,
  RefreshControl,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency } from '@/utils/helpers';

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    isLoading: authLoading,
    logout,
    updateProfile,
  } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const systemScheme = useColorScheme();
  const [refreshing, setRefreshing] = useState(false);

  // System-aware: 'system' follows the OS scheme so text/background always contrast
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh user data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        { id: 'edit-profile', icon: 'person-outline', label: 'Edit Profile', route: '/(screens)/edit-profile', color: '#8B85FF' },
        { id: 'kyc-status', icon: 'shield-checkmark-outline', label: 'KYC Status', route: '/(screens)/kyc-status', color: '#10B981' },
        { id: 'kyc-documents', icon: 'card-outline', label: 'KYC Documents', route: '/(screens)/kyc-documents', color: '#06B6D4' },
        { id: 'referral', icon: 'share-outline', label: 'Refer & Earn', route: '/(screens)/referral', color: '#F59E0B' },
        { id: 'my-referrals', icon: 'account-group-outline', label: 'My Referrals', route: '/(screens)/my-referrals', color: '#8B5CF6' },
      ],
    },
    {
      section: 'Activity',
      items: [
        { id: 'achievements', icon: 'trophy-outline', label: 'Achievements', route: '/(screens)/achievements', color: '#F59E0B' },
        { id: 'stats', icon: 'chart-bar-outline', label: 'My Stats', route: '/(screens)/stats', color: '#8B85FF' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { id: 'settings', icon: 'settings-outline', label: 'Settings', route: '/(screens)/settings', color: '#6B7280' },
        { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', route: '/(screens)/notifications', color: '#EF4444' },
        { id: 'security', icon: 'lock-outline', label: 'Security', route: '/(screens)/security-settings', color: '#8B5CF6' },
        { id: 'appearance', icon: 'palette-outline', label: 'Appearance', route: '/(screens)/appearance-settings', color: '#EC4899' },
        { id: 'language', icon: 'translate-outline', label: 'Language', route: '/(screens)/language-settings', color: '#14B8A6' },
      ],
    },
    {
      section: 'Support',
      items: [
        { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', route: '/(screens)/help', color: '#8B85FF' },
        { id: 'faq', icon: 'question-mark-circle-outline', label: 'FAQ', route: '/(screens)/faq', color: '#06B6D4' },
        { id: 'contact', icon: 'headset-outline', label: 'Contact Support', route: '/(screens)/contact-support', color: '#10B981' },
        { id: 'terms', icon: 'document-text-outline', label: 'Terms of Service', route: '/(screens)/terms', color: '#6B7280' },
        { id: 'privacy', icon: 'shield-outline', label: 'Privacy Policy', route: '/(screens)/privacy', color: '#6B7280' },
        { id: 'guidelines', icon: 'book-outline', label: 'Community Guidelines', route: '/(screens)/guidelines', color: '#6B7280' },
      ],
    },
  ];

  const stats = [
    { label: 'Tasks Posted', value: user?.stats?.tasksPosted || 0, icon: 'clipboard-outline', color: '#8B85FF' },
    { label: 'Tasks Completed', value: user?.stats?.completedTasks || 0, icon: 'check-circle-outline', color: '#10B981' },
    { label: 'Total Earnings', value: formatCurrency(user?.stats?.totalEarnings || 0), icon: 'currency-inr', color: '#F59E0B' },
    { label: 'Rating', value: user?.stats?.rating?.toFixed(1) || '0.0', icon: 'star-outline', color: '#EF4444' },
  ];

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <View style={styles.loadingSpinner} />
        <Text style={[styles.loadingText, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Loading profile...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
        <View style={styles.authPrompt}>
          <View style={[
            styles.authIcon,
            { backgroundColor: isDark ? '#8B85FF20' : '#EEF2FF' }
          ]}>
            <Ionicons name="person-circle-outline" size={64} color="#8B85FF" />
          </View>
          <Text style={[
            styles.authTitle,
            { color: isDark ? '#F1F5F9' : '#111827' }
          ]}>
            Welcome to LocalBuddy
          </Text>
          <Text style={[
            styles.authSubtitle,
            { color: isDark ? '#94A3B8' : '#6B7280' }
          ]}>
            Sign in to access your profile, tasks, and earnings
          </Text>
          <TouchableOpacity 
            style={styles.authButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#8B85FF']}
          progressBackgroundColor={isDark ? '#1E293B' : '#fff'}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Profile Header */}
      <View style={[
        styles.profileHeader,
        { backgroundColor: isDark ? '#1E293B' : '#fff' }
      ]}>
        {/* Cover */}
        <View style={[
          styles.coverImage,
          { backgroundColor: isDark ? '#334155' : '#EEF2FF' }
        ]}>
          <View style={styles.coverGradient} />
        </View>

        {/* Avatar & Info */}
        <View style={styles.profileInfo}>
          <View style={[
            styles.avatarContainer,
            { borderColor: isDark ? '#334155' : '#E5E7EB' }
          ]}>
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
                style={styles.avatarImage} 
              />
            ) : (
              <Text style={[
                styles.avatarInitial,
                { color: '#fff' }
              ]}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            )}
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.profileDetails}>
            <Text style={[
              styles.profileName,
              { color: isDark ? '#F1F5F9' : '#111827' }
            ]}>
              {user?.name || 'User'}
            </Text>
            <View style={styles.profileMeta}>
              <Text style={[
                styles.profileEmail,
                { color: isDark ? '#94A3B8' : '#6B7280' }
              ]}>
                {user?.email || 'user@localbuddy.com'}
              </Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={[
                  styles.ratingText,
                  { color: isDark ? '#94A3B8' : '#6B7280' }
                ]}>
                  {user?.stats?.rating?.toFixed(1) || '4.5'}
                </Text>
                <Text style={[
                  styles.reviewsCount,
                  { color: isDark ? '#64748B' : '#9CA3AF' }
                ]}>
                  ({user?.stats?.reviewCount || 0} reviews)
                </Text>
                {user?.isVerified && (
                  <>
                    <View style={styles.verifiedDot} />
                    <Text style={[
                      styles.verifiedText,
                      { color: '#10B981' }
                    ]}>
                      Verified
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={[
              styles.editProfileButton,
              { backgroundColor: isDark ? '#334155' : '#F1F5F9' }
            ]}
            onPress={() => router.push('/(screens)/edit-profile')}
          >
            <Ionicons 
              name="create-outline" 
              size={18} 
              color={isDark ? '#94A3B8' : '#6B7280'} 
            />
            <Text style={[
              styles.editProfileText,
              { color: isDark ? '#94A3B8' : '#6B7280' }
            ]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={stat.label}
              style={[
                styles.statCard,
                { backgroundColor: isDark ? '#1E293B' : '#fff' }
              ]}
              onPress={() => router.push('/(screens)/stats')}
            >
              <View style={[
                styles.statIcon,
                { backgroundColor: `${stat.color}20` }
              ]}>
                  <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[
                styles.statValue,
                { color: isDark ? '#F1F5F9' : '#111827' }
              ]}>
                {stat.value}
              </Text>
              <Text style={[
                styles.statLabel,
                { color: isDark ? '#94A3B8' : '#6B7280' }
              ]}>
                {stat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Wallet Quick Access */}
      <TouchableOpacity
        style={[
          styles.walletCard,
          { backgroundColor: isDark ? '#1E293B' : '#fff' }
        ]}
        onPress={() => router.push('/(tabs)/wallet')}
      >
        <View style={styles.walletCardHeader}>
          <View style={styles.walletIconWrapper}>
            <Ionicons name="wallet-outline" size={24} color="#8B85FF" />
          </View>
          <View style={styles.walletInfo}>
            <Text style={[
              styles.walletLabel,
              { color: isDark ? '#94A3B8' : '#6B7280' }
            ]}>
              Wallet Balance
            </Text>
            <Text style={[
              styles.walletAmount,
              { color: isDark ? '#F1F5F9' : '#111827' }
            ]}>
              {formatCurrency(user?.walletBalance || 0)}
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward-outline" 
            size={20} 
            color={isDark ? '#64748B' : '#9CA3AF'} 
          />
        </View>
        <View style={styles.walletActions}>
          <TouchableOpacity 
            style={styles.walletActionBtn}
            onPress={(e) => {
              e.stopPropagation();
              router.push('/(screens)/wallet-topup');
            }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#8B85FF" />
            <Text style={styles.walletActionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.walletActionBtn}
            onPress={(e) => {
              e.stopPropagation();
              router.push('/(screens)/wallet-withdraw');
            }}
          >
            <Ionicons name="remove-circle-outline" size={20} color="#10B981" />
            <Text style={styles.walletActionText}>Withdraw</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.walletActionBtn}
            onPress={(e) => {
              e.stopPropagation();
              router.push('/(screens)/wallet-history');
            }}
          >
            <Ionicons name="time-outline" size={20} color="#F59E0B" />
            <Text style={styles.walletActionText}>History</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Menu Sections */}
      {menuItems.map((section, sectionIndex) => (
        <View 
          key={section.section}
          style={[
            styles.menuSection,
            { backgroundColor: isDark ? '#1E293B' : '#fff' }
          ]}
        >
          <Text style={[
            styles.sectionTitle,
            { color: isDark ? '#94A3B8' : '#6B7280' }
          ]}>
            {section.section}
          </Text>
          <View style={styles.menuItems}>
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  itemIndex === section.items.length - 1 && styles.menuItemLast,
                  { backgroundColor: isDark ? '#1E293B' : '#fff' }
                ]}
                onPress={() => router.push(item.route)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.menuItemIcon,
                  { backgroundColor: `${item.color}20` }
                ]}>
                  <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={[
                  styles.menuItemLabel,
                  { color: isDark ? '#F1F5F9' : '#111827' }
                ]}>
                  {item.label}
                </Text>
                <Ionicons 
                  name="chevron-forward-outline" 
                  size={20} 
                  color={isDark ? '#64748B' : '#9CA3AF'} 
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <TouchableOpacity 
        style={[
          styles.logoutButton,
          { backgroundColor: isDark ? '#1E293B' : '#fff' }
        ]}
        onPress={handleLogout}
      >
        <View style={[
          styles.logoutIcon,
          { backgroundColor: '#FEF2F2' }
        ]}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        </View>
        <Text style={[
          styles.logoutText,
          { color: '#EF4444' }
        ]}>
          Logout
        </Text>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={[
          styles.versionText,
          { color: isDark ? '#64748B' : '#9CA3AF' }
        ]}>
          LocalBuddy v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#8B85FF',
    borderTopColor: 'transparent',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  authIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  authButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#8B85FF',
    borderRadius: 24,
    shadowColor: '#8B85FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  authButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  profileHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#B0A8FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  coverImage: {
    height: 120,
    position: 'relative',
  },
  coverGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  profileInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -48,
    shadowColor: '#B0A8FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.075,
    shadowRadius: 24,
    elevation: 4,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarInitial: {
    fontSize: 36,
    fontFamily: 'Inter_700Bold',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileDetails: {
    alignItems: 'center',
    marginTop: 12,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  profileMeta: {
    alignItems: 'center',
    marginTop: 6,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  reviewsCount: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  verifiedText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  editProfileText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  walletCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#B0A8FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  walletCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  walletAmount: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  walletActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletActionText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 4,
  },
  menuItems: {
    gap: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  menuItemLast: {
    borderTopWidth: 0,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  versionContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});