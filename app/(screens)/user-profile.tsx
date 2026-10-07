/**
 * Profile Screen (Screens Group) - View another user's profile
 * This is the public profile view accessed from task details, chat, etc.
 * Different from the (tabs)/profile.tsx which is the current user's own profile.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { formatCurrency, formatRelativeTime } from '@/utils/helpers';

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
  const { theme } = useUIStore();
  const { createConversation } = useChatStore();

  const isDark = theme === 'dark';
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  const loadProfile = async () => {
    // Yield before touching state so React never sees sync setState in the mount effect
    await Promise.resolve();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setProfile({
      id: userId as string,
      name: 'Alex Johnson',
      avatar: null,
      bio: 'Experienced handyman and delivery partner. Love helping people in my neighborhood with everyday tasks.',
      skills: ['Handyman', 'Delivery', 'Moving', 'Assembly', 'Cleaning'],
      rating: 4.8,
      tasksCompleted: 156,
      tasksPosted: 23,
      memberSince: '2024-03-15T10:30:00Z',
      location: 'Downtown, 2.3 km away',
      verifiedBadges: ['identity', 'phone', 'email'],
      reviewCount: 142,
      responseRate: 98,
      avgResponseTime: '< 5 min',
    });
    setLoading(false);
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
      const conversationId = await createConversation(profile.id, profile.name);
      router.push({
        pathname: '/(screens)/chat-detail',
        params: { id: conversationId as any, name: profile.name },
      });
    } catch {
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    }
  };

  const handleBlock = () => {
    Alert.alert(
      `Block ${profile?.name}?`,
      'You won\'t see their tasks, messages, or notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            setIsBlocked(true);
            Alert.alert('Blocked', `${profile?.name} has been blocked.`);
          },
        },
      ]
    );
  };

  const handleUnblock = () => {
    setIsBlocked(false);
    Alert.alert('Unblocked', `${profile?.name} has been unblocked.`);
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
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#8B85FF" />
        <Text style={[styles.loadingText, { color: isDark ? '#aaa' : '#666' }]}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <Ionicons name="person-circle-outline" size={64} color={isDark ? '#555' : '#ccc'} />
        <Text style={[styles.errorText, { color: isDark ? '#aaa' : '#666' }]}>User not found</Text>
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const badgeIcons: Record<string, { icon: string; color: string; label: string }> = {
    identity: { icon: 'checkmark-circle', color: '#8B85FF', label: 'ID Verified' },
    phone: { icon: 'call', color: '#10B981', label: 'Phone Verified' },
    email: { icon: 'mail', color: '#F59E0B', label: 'Email Verified' },
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
            {profile.name}
          </Text>
          <TouchableOpacity onPress={handleReport} style={styles.headerBtn}>
            <Ionicons name="ellipsis-horizontal" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.avatarSection}>
            <View style={[styles.avatarContainer, { backgroundColor: isDark ? '#3a3a3a' : '#e0e0e0' }]}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <Text style={[styles.avatarText, { color: isDark ? '#fff' : '#666' }]}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.nameSection}>
              <Text style={[styles.profileName, { color: isDark ? '#fff' : '#000' }]}>
                {profile.name}
              </Text>
              <Text style={[styles.profileLocation, { color: isDark ? '#aaa' : '#666' }]}>
                <Ionicons name="location-outline" size={14} color={isDark ? '#aaa' : '#666'} /> {profile.location}
              </Text>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <AntDesign name="star" size={18} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: isDark ? '#fff' : '#000' }]}>
                {profile.rating}
              </Text>
              <Text style={[styles.reviewCount, { color: isDark ? '#aaa' : '#888' }]}>
                ({profile.reviewCount} reviews)
              </Text>
            </View>
          </View>

          {/* Bio */}
          {profile.bio ? (
            <Text style={[styles.bio, { color: isDark ? '#ccc' : '#444' }]}>{profile.bio}</Text>
          ) : null}

          {/* Verified Badges */}
          {profile.verifiedBadges.length > 0 && (
            <View style={styles.badgesRow}>
              {profile.verifiedBadges.map(badge => {
                const info = badgeIcons[badge];
                if (!info) return null;
                return (
                  <View key={badge} style={[styles.badge, { backgroundColor: isDark ? '#3a3a3a' : '#f0f0f0' }]}>
                    <Ionicons name={info.icon as any} size={16} color={info.color} />
                    <Text style={[styles.badgeText, { color: isDark ? '#ccc' : '#555' }]}>{info.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { borderRightWidth: 1, borderColor: isDark ? '#444' : '#eee' }]}>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{profile.tasksCompleted}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#aaa' : '#888' }]}>Completed</Text>
            </View>
            <View style={[styles.statItem, { borderRightWidth: 1, borderColor: isDark ? '#444' : '#eee' }]}>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{profile.tasksPosted}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#aaa' : '#888' }]}>Posted</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{profile.responseRate}%</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#aaa' : '#888' }]}>Response</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: isDark ? '#aaa' : '#888' }]}>Avg Response Time</Text>
            <Text style={[styles.statRowValue, { color: isDark ? '#fff' : '#000' }]}>{profile.avgResponseTime}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={[styles.statRowLabel, { color: isDark ? '#aaa' : '#888' }]}>Member Since</Text>
            <Text style={[styles.statRowValue, { color: isDark ? '#fff' : '#000' }]}>
              {formatRelativeTime(profile.memberSince)}
            </Text>
          </View>
        </View>

        {/* Skills */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Skills</Text>
          <View style={styles.skillsContainer}>
            {profile.skills.map((skill, index) => (
              <View key={index} style={[styles.skillTag, { backgroundColor: isDark ? '#3a3a3a' : '#e8e8ff' }]}>
                <Text style={[styles.skillText, { color: isDark ? '#ccc' : '#8B85FF' }]}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.messageBtn, { opacity: isBlocked ? 0.5 : 1 }]}
            onPress={handleMessage}
            disabled={isBlocked}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#fff" />
            <Text style={styles.messageBtnText}>Send Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.blockBtn, { borderColor: isDark ? '#555' : '#ddd' }]}
            onPress={isBlocked ? handleUnblock : handleBlock}
          >
            <Ionicons
              name={isBlocked ? 'checkmark-circle-outline' : 'ban-outline'}
              size={20}
              color={isBlocked ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.blockBtnText, { color: isBlocked ? '#10B981' : '#EF4444' }]}>
              {isBlocked ? 'Unblock User' : 'Block User'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Reviews */}
        <TouchableOpacity
          style={[styles.reviewsLink, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
          onPress={() => router.push({
            pathname: '/(screens)/task-reviews',
            params: { userId: profile.id },
          })}
        >
          <View style={styles.reviewsLinkContent}>
            <View style={styles.reviewsLinkLeft}>
              <AntDesign name="star" size={20} color="#F59E0B" />
              <Text style={[styles.reviewsLinkText, { color: isDark ? '#fff' : '#000' }]}>
                View All Reviews ({profile.reviewCount})
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDark ? '#aaa' : '#888'} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Inter_500Medium',
  },
  goBackBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#8B85FF',
    borderRadius: 12,
  },
  goBackText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
  },
  nameSection: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  ratingRow: {
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginLeft: 4,
  },
  bio: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statRowLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  statRowValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  actionButtons: {
    marginTop: 20,
    gap: 12,
  },
  messageBtn: {
    backgroundColor: '#8B85FF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  messageBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  blockBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  blockBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  reviewsLink: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  reviewsLinkContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewsLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewsLinkText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});