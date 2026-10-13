/**
 * Task Applications Screen — Soft Modern
 * Sky/green/red status pills, white applicant cards with cocoa avatars,
 * accept (green) + reject (soft red) pill CTAs. Logic unchanged.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftScreenSkeleton } from '@/components/ui';
import { useTaskStore } from '@/store/taskStore';
import { useUIStore } from '@/store/uiStore';

export default function TaskApplicationsScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams();
  const {
    applications,
    refreshApplications,
    acceptApplication,
    rejectApplication,
    isLoading: applicationsLoading,
  } = useTaskStore();
  const { showToast } = useUIStore();

  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Load real applications from the backend when the screen opens
  // (poster-only endpoint; applications arrive enriched with profile info).
  useEffect(() => {
    if (!taskId) return;
    refreshApplications(taskId as string).catch((e: any) => {
      Alert.alert('Error', e?.message || 'Could not load applications');
    });
  }, [taskId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshApplications(taskId as string);
    } catch {
      // error already surfaced via store
    } finally {
      setRefreshing(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const handleAccept = (application: any) => {
    Alert.alert(
      'Accept Application',
      `Accept ${application.applicantName}'s application? The task will be assigned to them and a chat will be created.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setBusyId(application.id);
            try {
              await acceptApplication(taskId as string, application.id);
              showToast(`${application.applicantName} accepted — task assigned`, 'success');
            } catch (e: any) {
              Alert.alert('Could not accept', e?.message || 'Please try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleReject = (application: any) => {
    Alert.alert(
      'Reject Application',
      `Reject ${application.applicantName}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setBusyId(application.id);
            try {
              await rejectApplication(taskId as string, application.id);
              showToast('Application rejected', 'info');
            } catch (e: any) {
              Alert.alert('Could not reject', e?.message || 'Please try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (applicantId: string) => {
    router.push({ pathname: `/(screens)/user-profile`, params: { userId: applicantId } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return Colors.semantic.warning;
      case 'accepted': return Colors.semantic.success;
      case 'rejected': return Colors.semantic.error;
      default: return Colors.text.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const renderApplicationCard = ({ item, index }: any) => {
    const statusColor = getStatusColor(item.status);
    return (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 380, delay: Math.min(index, 8) * 55 }}
      >
        <Pressable
          style={({ pressed }) => [styles.applicationCard, pressed && { transform: [{ scale: 0.985 }] }]}
          onPress={() => handleViewProfile(item.applicantId)}
        >
          <View style={styles.applicationHeader}>
            <View style={styles.applicantInfo}>
              <View style={styles.avatar}>
                {item.applicantAvatar ? (
                  <Image source={{ uri: item.applicantAvatar }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{(item.applicantName || 'A').charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.applicantDetails}>
                <Text style={styles.applicantName} numberOfLines={1}>{item.applicantName}</Text>
                <View style={styles.metaStarsRow}>
                  <Ionicons name="star" size={12} color={Colors.semantic.warning} />
                  <Text style={styles.applicantMeta}>
                    {(item.applicantRating ?? 0).toFixed(1)} • {item.applicantCompletedTasks ?? 0} tasks{item.applicantDistance != null ? ` • ${item.applicantDistance}km` : ''}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '1A' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getStatusLabel(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.messageBubble}>
            <Text style={styles.applicationMessage}>{item.message || '—'}</Text>
          </View>

          <View style={styles.applicationMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="cash" size={13} color={Colors.semantic.success} />
              <Text style={[styles.metaText, { color: Colors.semantic.success, fontFamily: Typography.fontFamily.semiBold }]}>₹{item.proposedBudget ?? '—'}</Text>
            </View>
            {item.estimatedHours ? (
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={Colors.text.muted} />
                <Text style={styles.metaText}>{item.estimatedHours}h</Text>
              </View>
            ) : null}
            {item.appliedAt || item.createdAt ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={Colors.text.muted} />
                <Text style={styles.metaText}>
                  {new Date(item.appliedAt || item.createdAt).toLocaleDateString('en-IN')}
                </Text>
              </View>
            ) : null}
          </View>

          {item.status === 'pending' ? (
            <View style={styles.applicationActions}>
              <Pressable
                style={({ pressed }) => [styles.rejectButton, (pressed || busyId === item.id) && { opacity: 0.6 }]}
                disabled={busyId === item.id}
                onPress={(e) => { e.stopPropagation(); handleReject(item); }}
              >
                {busyId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.semantic.error} />
                ) : (
                  <>
                    <Ionicons name="close" size={15} color={Colors.semantic.error} />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.acceptButton, (pressed || busyId === item.id) && { opacity: 0.7 }]}
                disabled={busyId === item.id}
                onPress={(e) => { e.stopPropagation(); handleAccept(item); }}
              >
                {busyId === item.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </MotiView>
    );
  };

  const renderEmptyState = () => (
    <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }}>
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="people-outline" size={34} color={Colors.brand.accent} />
        </View>
        <Text style={styles.emptyTitle}>No applications</Text>
        <Text style={styles.emptyDesc}>
          {filter !== 'all' ? `No ${getStatusLabel(filter).toLowerCase()} applications` : 'No one has applied to this task yet'}
        </Text>
      </View>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      {/* In-page header */}
      <ScreenHeader
        title="Applications"
        subtitle={`${applications.length} total`}
        onBack={() => router.back()}
      />

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              style={[styles.filterTab, active && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterTabText, active && { color: '#FFFFFF' }]}>
                {f === 'all' ? 'All' : getStatusLabel(f)}
              </Text>
              <View style={[styles.filterBadge, active ? styles.filterBadgeActive : styles.filterBadgeIdle]}>
                <Text style={[styles.filterBadgeText, active && { color: Colors.brand.primary }]}>
                  {applications.filter(a => f === 'all' || a.status === f).length}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Applications List */}
      <FlatList
        data={filteredApplications}
        renderItem={renderApplicationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
        ListEmptyComponent={
          // Skeleton while applications load — never a false "No applications".
          applicationsLoading && applications.length === 0 ? (
            <SoftScreenSkeleton cards={4} style={{ paddingHorizontal: 0 }} />
          ) : (
            renderEmptyState()
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  topRow: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: Spacing[5], paddingTop: Spacing[4], gap: Spacing[2] },
  pageTitle: { fontFamily: Typography.fontFamily.display, fontSize: 26, color: Colors.text.primary },
  pageSub: { fontFamily: Typography.fontFamily.body, fontSize: 12.5, color: Colors.text.secondary },

  filterContainer: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], gap: Spacing[2] },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 2, borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.elevated, borderWidth: 1.5, borderColor: Colors.border.light,
  },
  filterTabActive: { backgroundColor: Colors.brand.primary, borderColor: Colors.brand.primary, ...Shadows.button },
  filterTabText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  filterBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filterBadgeActive: { backgroundColor: '#FFFFFF' },
  filterBadgeIdle: { backgroundColor: Colors.surface.tertiary },
  filterBadgeText: { fontSize: 10, fontFamily: Typography.fontFamily.bold, color: Colors.text.secondary },

  listContent: { paddingHorizontal: Spacing[5], paddingBottom: 40, gap: Spacing[3] },
  applicationCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing[2], marginBottom: Spacing[3] },
  applicantInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  applicantDetails: { flex: 1 },
  applicantName: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  metaStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  applicantMeta: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing[2] + 2, paddingVertical: 3, borderRadius: BorderRadius.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusBadgeText: { fontSize: 10.5, fontFamily: Typography.fontFamily.semiBold, textTransform: 'capitalize' },

  messageBubble: {
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[3], marginBottom: Spacing[3],
  },
  applicationMessage: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, lineHeight: 19, color: Colors.text.secondary },
  applicationMeta: { flexDirection: 'row', gap: Spacing[4], flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },

  applicationActions: { flexDirection: 'row', gap: Spacing[3], paddingTop: Spacing[4], marginTop: Spacing[3], borderTopWidth: 1, borderTopColor: Colors.border.light },
  rejectButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: Spacing[3], borderRadius: BorderRadius.pill,
    backgroundColor: Colors.semantic.errorSoft, borderWidth: 1.5, borderColor: Colors.semantic.error + '40',
  },
  rejectButtonText: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.error },
  acceptButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: Spacing[3], borderRadius: BorderRadius.pill,
    backgroundColor: Colors.semantic.success, ...Shadows.button,
  },
  acceptButtonText: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  emptyState: {
    paddingVertical: Spacing[12], alignItems: 'center', borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    marginTop: Spacing[4], ...Shadows.card,
  },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyTitle: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[1], paddingHorizontal: Spacing[8], lineHeight: 20 },
});
