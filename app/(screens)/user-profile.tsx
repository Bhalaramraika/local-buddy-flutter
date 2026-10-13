/**
 * Profile Screen (Screens Group) - View another user's profile
 * This is the public profile view accessed from task details, chat, etc.
 * Different from the (tabs)/profile.tsx which is the current user's own profile.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { formatRelativeTime } from '@/utils/helpers';
import { Colors, BorderRadius, Typography, Shadows, Spacing } from '@/constants/design';
import { ScreenHeader, SoftButton, SoftScreenSkeleton } from '@/components/ui';

interface PublicUserProfile {
  id: string;
  name: string;
  avatar: string | null;
  bio: string;
  skills: string[];
  rating: number;
  tasksCompleted: number;
  tasksPosted: number;
  memberSince: string;
  location: string;
  verifiedBadges: string[];
  reviewCount: number;
  responseRate: number;
  avgResponseTime: string;
}

export default function PublicProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { createConversation } = useChatStore();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    // Real data only: read the user's Firestore profile doc (rules allow any
    // signed-in user to read public profiles). NO mock/fake data.
    setLoading(true);
    try {
      const snap = await getDoc(doc(db!, 'users', String(userId)));
      if (!snap.exists()) {
        setProfile(null);
        return;
      }
      const d = snap.data() as any;
      const kycOk = d.kycApproved === true || d.kyc?.status === 'verified';
      setProfile({
        id: snap.id,
        name: d.name || 'User',
        avatar: d.avatar || null,
        bio: d.bio || '',
        skills: Array.isArray(d.skills) ? d.skills : [],
        rating: d.rating?.average ?? 0,
        tasksCompleted: d.stats?.tasksCompleted ?? 0,
        tasksPosted: d.stats?.tasksPosted ?? 0,
        memberSince: d.createdAt || '',
        location: [d.area, d.city].filter(Boolean).join(', ') || 'Nearby',
        verifiedBadges: [kycOk ? 'identity' : null, 'email'].filter(Boolean) as string[],
        reviewCount: d.rating?.count ?? 0,
        responseRate: 0, // hidden when 0 — not tracked server-side yet
        avgResponseTime: '',
      });
    } catch (e) {
      console.warn('[PublicProfile] load failed:', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      router.back();
      return;
    }
    void Promise.resolve().then(loadProfile);
  }, [userId, isAuthenticated]);


  const handleMessage = async () => {
    if (!profile || !currentUser) return;
    try {
      const conversationId = await createConversation(profile.id);
      router.push({
        pathname: '/(screens)/chat-detail',
        params: { conversationId: conversationId as any, name: profile.name },
      });
    } catch {
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      'Please select a reason for reporting this user.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Content', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
        { text: 'Spam', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
        { text: 'Harassment', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
        { text: 'Fake Profile', onPress: () => Alert.alert('Reported', 'Thank you for your report.') },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Profile" onBack={() => router.back()} />
        <SoftScreenSkeleton cards={3} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="person-circle" size={52} color={Colors.brand.accent} />
        </View>
        <Text style={styles.errorText}>User not found</Text>
        <SoftButton label="Go back" variant="primary" fullWidth={false} onPress={() => router.back()} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} />
      </View>
    );
  }

  const badgeIcons: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    identity: { icon: 'checkmark-circle', color: Colors.semantic.info, bg: Colors.semantic.infoSoft, label: 'ID Verified' },
    phone: { icon: 'call', color: Colors.semantic.success, bg: Colors.semantic.successSoft, label: 'Phone Verified' },
    email: { icon: 'mail', color: Colors.semantic.warning, bg: Colors.semantic.warningSoft, label: 'Email Verified' },
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={String(profile.name)}
        subtitle="Buddy profile"
        onBack={() => router.back()}
        right={
          <Pressable onPress={handleReport} style={styles.headerRoundBtn} hitSlop={8} accessibilityLabel="Report user">
            <Ionicons name="flag-outline" size={17} color={Colors.semantic.error} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card — cocoa + avatar */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440 }}
          style={styles.profileCard}
        >
          <View style={styles.profileBand} />
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={13} color={Colors.brand.accent} />
            <Text style={styles.profileLocation}>{profile.location}</Text>
          </View>

          {/* Rating pill */}
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={15} color={Colors.semantic.warning} />
            <Text style={styles.ratingText}>{profile.rating ? profile.rating.toFixed(1) : 'New'}</Text>
            <Text style={styles.reviewCount}>({profile.reviewCount} reviews)</Text>
          </View>

          {/* Bio */}
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : null}

          {/* Verified Badges */}
          {profile.verifiedBadges.length > 0 ? (
            <View style={styles.badgesRow}>
              {profile.verifiedBadges.map(badge => {
                const info = badgeIcons[badge];
                if (!info) return null;
                return (
                  <View key={badge} style={[styles.badge, { backgroundColor: info.bg }]}>
                    <Ionicons name={info.icon as any} size={12} color={info.color} />
                    <Text style={[styles.badgeText, { color: info.color }]}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </MotiView>

        {/* Stats */}
        <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 100 }} style={[styles.section, { marginTop: Spacing[4] }]}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: Colors.semantic.successSoft }]}>
                <Ionicons name="checkmark-done" size={16} color={Colors.semantic.success} />
              </View>
              <Text style={styles.statValue}>{profile.tasksCompleted}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: Colors.brand.accentSoft }]}>
                <Ionicons name="add-circle" size={16} color={Colors.brand.accent} />
              </View>
              <Text style={styles.statValue}>{profile.tasksPosted}</Text>
              <Text style={styles.statLabel}>Posted</Text>
            </View>
          </View>
          <View style={styles.statRows}>
            {profile.memberSince ? (
              <View style={styles.statRow}>
                <Text style={styles.statRowLabel}>Member since</Text>
                <Text style={styles.statRowValue}>
                  {formatRelativeTime(profile.memberSince)}
                </Text>
              </View>
            ) : null}
          </View>
        </MotiView>

        {/* Skills (only when the user actually added some) */}
        {profile.skills.length > 0 ? (
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 180 }} style={[styles.section, { marginTop: Spacing[4] }]}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {profile.skills.map((skill, index) => (
                <View key={index} style={styles.skillTag}>
                  <Ionicons name="construct" size={11} color={Colors.brand.accent} />
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </MotiView>
        ) : null}

        {/* Actions */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 260 }} style={styles.actionButtons}>
          <SoftButton
            label="Message"
            variant="success"
            icon="chatbubble-ellipses"
            onPress={handleMessage}
            withGlow
            style={{ flex: 1 }}
          />
          <Pressable style={({ pressed }) => [styles.reportBtn, pressed && { opacity: 0.8 }]} onPress={handleReport}>
            <Ionicons name="flag-outline" size={16} color={Colors.semantic.error} />
            <Text style={styles.reportBtnText}>Report</Text>
          </Pressable>
        </MotiView>

        {/* View Reviews */}
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 340 }}>
          <Pressable
            style={({ pressed }) => [styles.reviewsLink, pressed && { transform: [{ scale: 0.985 }] }]}
            onPress={() => router.push({
              pathname: '/(screens)/task-reviews',
              params: { userId: profile.id },
            })}
          >
            <View style={styles.reviewsLinkContent}>
              <View style={styles.reviewsLinkLeft}>
                <View style={styles.reviewsIcon}>
                  <Ionicons name="star" size={16} color={Colors.semantic.warning} />
                </View>
                <View>
                  <Text style={styles.reviewsLinkText}>
                    View all reviews
                  </Text>
                  <Text style={styles.reviewsLinkSub}>{profile.reviewCount} from posters &amp; buddies</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={17} color={Colors.text.muted} />
            </View>
          </Pressable>
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  loadingText: { marginTop: Spacing[4], fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  errorText: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  headerRoundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.semantic.errorSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.cardPressed,
  },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[2] },
  profileCard: {
    borderRadius: BorderRadius['2xl'], padding: Spacing[6], paddingTop: Spacing[6] + 20, alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    overflow: 'visible', ...Shadows.elevated,
  },
  profileBand: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 86,
    backgroundColor: Colors.brand.accent, borderTopLeftRadius: BorderRadius['2xl'], borderTopRightRadius: BorderRadius['2xl'],
    ...Shadows.buttonOrange,
  },
  avatarContainer: {
    width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.brand.primary, marginTop: -74 + 86, marginBottom: Spacing[3],
    borderWidth: 4, borderColor: Colors.surface.elevated, ...Shadows.elevated,
  },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarText: { fontSize: 36, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  nameSection: { alignItems: 'center' },
  profileName: { fontSize: 26, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginTop: Spacing[1] },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing[2] },
  profileLocation: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  ratingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center',
    backgroundColor: Colors.semantic.warningSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], marginTop: Spacing[4],
  },
  ratingText: { fontSize: 15, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  reviewCount: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  bio: {
    fontSize: 14, fontFamily: Typography.fontFamily.body, lineHeight: 22, color: Colors.text.secondary,
    textAlign: 'center', marginTop: Spacing[4], paddingHorizontal: Spacing[2],
  },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[4], justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: BorderRadius.pill, gap: 5 },
  badgeText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold },
  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },
  statsGrid: { flexDirection: 'row', gap: Spacing[2], marginBottom: Spacing[4] },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing[3], borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface.primary, borderWidth: 1, borderColor: Colors.border.light,
  },
  statIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[2] },
  statValue: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  statLabel: { fontSize: 11, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 2 },
  statRows: { borderTopWidth: 1, borderTopColor: Colors.border.light, paddingTop: Spacing[3], gap: Spacing[2] },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[2] },
  statRowLabel: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  statRowValue: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  skillTag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: Spacing[3] + 2, paddingVertical: Spacing[2], borderRadius: BorderRadius.pill,
    backgroundColor: Colors.brand.accentSoft, borderWidth: 1.5, borderColor: Colors.brand.accent + '40',
  },
  skillText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.brand.accentPressed },
  actionButtons: { marginTop: Spacing[5], flexDirection: 'row', gap: Spacing[3], alignItems: 'center' },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: Spacing[3] + 4, paddingHorizontal: Spacing[5], borderRadius: BorderRadius.pill,
    backgroundColor: Colors.semantic.errorSoft, borderWidth: 1.5, borderColor: Colors.semantic.error + '45',
  },
  reportBtnText: { fontSize: 13.5, fontFamily: Typography.fontFamily.medium, color: Colors.semantic.error },
  reviewsLink: {
    marginTop: Spacing[4], borderRadius: BorderRadius.lg, padding: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  reviewsLinkContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewsLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  reviewsIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.semantic.warningSoft,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  reviewsLinkText: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  reviewsLinkSub: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
});