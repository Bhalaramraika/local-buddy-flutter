/**
 * Profile Screen — Soft Modern
 * White hero card with cocoa avatar + Playfair name, orange wallet strip,
 * rounded menu sections, soft-red logout. Staggered Moti entrances.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftScreenSkeleton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/helpers';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    logout,
  } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // KYC approval is synced in realtime from Firestore (kycApproved toggle)
  // into user.kyc.status — there is no separate `isVerified` field on the doc.
  const kycVerified = user?.kyc?.status === 'verified' || (user?.kyc as any)?.approved === true;

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
        { id: 'edit-profile', icon: 'person-outline', label: 'Edit Profile', route: '/(screens)/edit-profile' },
        { id: 'kyc-status', icon: 'shield-check-outline', label: 'KYC Status', route: '/(screens)/kyc-status' },
        { id: 'kyc-documents', icon: 'card-outline', label: 'KYC Documents', route: '/(screens)/kyc-documents' },
        { id: 'referral', icon: 'share-outline', label: 'Refer & Earn', route: '/(screens)/referral' },
        { id: 'my-referrals', icon: 'account-group-outline', label: 'My Referrals', route: '/(screens)/my-referrals' },
      ],
    },
    {
      section: 'Activity',
      items: [
        { id: 'my-tasks', icon: 'clipboard-outline', label: 'My Tasks', route: '/(screens)/my-tasks' },
        { id: 'achievements', icon: 'trophy-outline', label: 'Achievements', route: '/(screens)/achievements' },
        { id: 'stats', icon: 'chart-box-outline', label: 'My Stats', route: '/(screens)/stats' },
      ],
    },
    {
      section: 'Settings',
      items: [
        { id: 'settings', icon: 'settings-outline', label: 'Settings', route: '/(screens)/settings' },
        { id: 'notifications', icon: 'notifications-outline', label: 'Notifications', route: '/(screens)/notifications' },
        { id: 'appearance', icon: 'palette-outline', label: 'Appearance', route: '/(screens)/appearance-settings' },
        { id: 'language', icon: 'translate-outline', label: 'Language', route: '/(screens)/language-settings' },
      ],
    },
    {
      section: 'Support',
      items: [
        { id: 'help', icon: 'help-circle-outline', label: 'Help & Support', route: '/(screens)/help' },
        { id: 'faq', icon: 'frequently-asked-questions', label: 'FAQ', route: '/(screens)/faq' },
        { id: 'contact', icon: 'headset-outline', label: 'Contact Support', route: '/(screens)/contact-support' },
        { id: 'terms', icon: 'document-text-outline', label: 'Terms of Service', route: '/(screens)/terms' },
        { id: 'privacy', icon: 'shield-outline', label: 'Privacy Policy', route: '/(screens)/privacy' },
        { id: 'guidelines', icon: 'book-outline', label: 'Community Guidelines', route: '/(screens)/guidelines' },
      ],
    },
  ];

  // Real fields only: backend keeps task counts under `stats.tasksPosted /
  // stats.tasksCompleted` and the star rating under `rating.average`.
  const stats = [
    { label: 'Tasks Posted', value: user?.stats?.tasksPosted || 0, icon: 'clipboard-outline', color: Colors.brand.primary },
    { label: 'Tasks Completed', value: user?.stats?.tasksCompleted || 0, icon: 'check-circle-outline', color: Colors.semantic.success },
    { label: 'Total Earnings', value: formatCurrency(user?.stats?.totalEarnings || 0), icon: 'currency-inr', color: Colors.brand.accent },
    { label: 'Rating', value: (user?.rating?.average ?? 0).toFixed(1), icon: 'star-outline', color: Colors.semantic.warning },
  ];

  if (authLoading) {
    return (
      <View style={styles.container}>
        <SoftScreenSkeleton cards={4} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450 }}
          style={styles.authPrompt}
        >
          <View style={styles.authIcon}>
            <Ionicons name="person" size={44} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Welcome to{'\n'}Local Buddy</Text>
          <Text style={styles.authSubtitle}>
            Sign in to access your profile, tasks, and earnings
          </Text>
          <Pressable style={styles.authButton} onPress={() => router.push('/login')}>
            <Text style={styles.authButtonText}>Sign In</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </Pressable>
        </MotiView>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.brand.accent]}
          tintColor={Colors.brand.accent}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Profile Hero */}
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 440 }}
        style={styles.profileCard}
      >
        <View style={styles.coverBand} />

        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          )}
          {kycVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.profileDetails}>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@localbuddy.com'}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.brand.accent} />
            <Text style={styles.ratingText}>
              {(user?.rating?.average ?? 0).toFixed(1)}
            </Text>
            <Text style={styles.reviewsCount}>
              ({user?.rating?.count || 0} reviews)
            </Text>
            {kycVerified && (
              <View style={styles.kycPill}>
                <Ionicons name="shield-checkmark" size={11} color={Colors.semantic.success} />
                <Text style={styles.kycPillText}>KYC Verified</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.editProfileButton} onPress={() => router.push('/(screens)/edit-profile')}>
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </Pressable>
        </View>

        {/* Stats Grid — clean 2×2 */}
        <View style={styles.statsContainer}>
          {stats.map((stat, i) => (
            <MotiView
              key={stat.label}
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 380, delay: 120 + i * 60 }}
              style={styles.statCardWrap}
            >
              <Pressable style={styles.statCard} onPress={() => router.push('/(screens)/stats')}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.color}18` }]}>
                  <MaterialCommunityIcons name={stat.icon as any} size={16} color={stat.color} />
                </View>
                <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{stat.value}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              </Pressable>
            </MotiView>
          ))}
        </View>
      </MotiView>

      {/* Menu Sections */}
      {menuItems.map((section, sectionIndex) => (
        <MotiView
          key={section.section}
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 300 + sectionIndex * 80 }}
          style={styles.menuSection}
        >
          <Text style={styles.sectionTitle}>{section.section}</Text>
          <View style={styles.menuItems}>
            {section.items.map((item, itemIndex) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.menuItem,
                  itemIndex === section.items.length - 1 && styles.menuItemLast,
                  pressed && { backgroundColor: Colors.surface.creamSoft },
                ]}
                onPress={() => router.push(item.route)}
                accessibilityLabel={item.label}
              >
                <View style={styles.menuItemIcon}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={Colors.brand.accent} />
                </View>
                <Text style={styles.menuItemLabel} numberOfLines={1} ellipsizeMode="tail">{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </MotiView>
      ))}

      {/* Logout — soft red (negative action) */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 620 }}
      >
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color={Colors.semantic.error} />
          </View>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </MotiView>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Local Buddy v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  content: { paddingBottom: 120 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: Colors.surface.primary },
  loadingText: { fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },

  // ---- Auth gate ----
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8], gap: Spacing[4] },
  authIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    justifyContent: 'center', alignItems: 'center', ...Shadows.card,
  },
  authTitle: {
    fontSize: 30, lineHeight: 38, fontFamily: Typography.fontFamily.display,
    textAlign: 'center', color: Colors.text.primary, marginTop: Spacing[2],
  },
  authSubtitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, textAlign: 'center', lineHeight: 22, color: Colors.text.secondary },
  authButton: {
    marginTop: Spacing[3], flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    paddingHorizontal: Spacing[8], paddingVertical: Spacing[4],
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill, ...Shadows.buttonOrange,
  },
  authButtonText: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  // ---- Hero card ----
  profileCard: {
    marginHorizontal: Spacing[5], marginTop: Spacing[6], marginBottom: Spacing[4],
    borderRadius: BorderRadius.xl, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, overflow: 'hidden', ...Shadows.card,
  },
  coverBand: { height: 92, backgroundColor: Colors.brand.accentSoft },
  avatarContainer: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 4, borderColor: Colors.surface.elevated,
    backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginTop: -48, ...Shadows.card,
  },
  avatarImage: { width: 88, height: 88, borderRadius: 44 },
  avatarInitial: { fontSize: 36, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  verifiedBadge: {
    position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.semantic.success, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#FFFFFF',
  },
  profileDetails: { alignItems: 'center', marginTop: Spacing[3], paddingHorizontal: Spacing[5] },
  profileName: { fontSize: 24, fontFamily: Typography.fontFamily.display, color: Colors.text.primary },
  profileEmail: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing[2] },
  ratingText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  reviewsCount: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  kycPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: Spacing[2],
    backgroundColor: Colors.semantic.successSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[2], paddingVertical: 3,
  },
  kycPillText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.success },
  editProfileButton: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: Spacing[4], marginBottom: Spacing[5],
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[2] + 4,
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.pill, ...Shadows.button,
  },
  editProfileText: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  // ---- Stats — 2×2 grid ----
  statsContainer: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: Spacing[4], paddingBottom: Spacing[4], gap: Spacing[2],
  },
  // Exactly 2 per row (2×2 grid): two 48.5% cards + one gap column.
  statCardWrap: { width: '48.5%' },
  statCard: {
    alignItems: 'center', paddingVertical: Spacing[3], paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius.md, backgroundColor: Colors.surface.primary,
    borderWidth: 1, borderColor: Colors.border.light,
  },
  statIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[1] + 2 },
  statValue: { fontSize: 15, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary, maxWidth: '100%' },
  statLabel: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 2 },

  // ---- Menu ----
  menuSection: {
    marginHorizontal: Spacing[5], marginBottom: Spacing[4],
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed,
    textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[1],
  },
  menuItems: {},
  // One full-width row per option: icon chip (fixed) + title to its right,
  // no wrapping so the title never drops below the icon.
  menuItem: {
    flexDirection: 'row', alignItems: 'center', width: '100%',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] + 2,
    minHeight: 56,
    borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  menuItemLast: {},
  menuItemIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3], flexShrink: 0,
  },
  // lineHeight keeps Poppins descenders un-clipped on Android.
  menuItemLabel: { flex: 1, fontSize: 14.5, lineHeight: 21, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },

  // ---- Logout ----
  logoutButton: {
    marginHorizontal: Spacing[5], marginTop: Spacing[1], marginBottom: Spacing[4],
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[4],
    borderRadius: BorderRadius.lg, backgroundColor: Colors.semantic.errorSoft,
    borderWidth: 1, borderColor: Colors.semantic.error + '33',
  },
  logoutIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3],
  },
  logoutText: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.error },

  versionContainer: { paddingVertical: Spacing[4], alignItems: 'center' },
  versionText: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
});
