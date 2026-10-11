/**
 * Task Detail Screen — Soft Modern (enriched)
 * Full info grid (location, deadline, posted, type, duration, seats),
 * poster card with "Chat with poster" + Call, buddy card with
 * "Chat with buddy" for posters, apply/edit/close CTAs, Moti entrances.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { ScreenHeader, SoftButton } from '@/components/ui';
import { formatCurrency, formatRelativeTime, formatDate } from '@/utils/helpers';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';

export default function TaskDetailScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { 
    currentTask, 
    fetchTaskById, 
    applyToTask, 
    isLoading: taskLoading,
    isApplying,
    clearCurrentTask,
  } = useTaskStore();
  const { user, isAuthenticated } = useAuthStore();
  const { createConversation } = useChatStore();
  const { showToast } = useUIStore();
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchTaskById(taskId);
    }
    return () => clearCurrentTask();
  }, [taskId, fetchTaskById, clearCurrentTask]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to apply for tasks', 'error');
      router.push('/login');
      return;
    }

    if (currentTask?.posterId === user?.id) {
      showToast('You cannot apply to your own task', 'error');
      return;
    }

    try {
      const success = await applyToTask(taskId!, {
        message: `Hi, I'm interested in your task "${currentTask?.title}". I believe I can help with this.`,
        proposedBudget: currentTask?.budget?.amount,
      });

      if (success) {
        setApplied(true);
        showToast('Application submitted successfully!', 'success');
      }
    } catch (err: any) {
      const msg = err?.message || 'Could not submit your application. Please try again.';
      if (String(msg).toLowerCase().includes('kyc')) {
        Alert.alert(
          'Complete KYC required',
          'Applying to tasks requires verified KYC. Please complete your KYC first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Complete KYC', onPress: () => router.push('/(screens)/kyc-status') },
          ]
        );
      } else {
        Alert.alert('Could not apply', msg);
      }
    }
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to save tasks', 'error');
      router.push('/login');
      return;
    }
    setSaved(!saved);
    showToast(saved ? 'Task unsaved' : 'Task saved for later', 'success');
  };

  const handleChat = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to chat', 'error');
      router.push('/login');
      return;
    }

    if (currentTask?.posterId === user?.id) {
      showToast('You cannot chat with yourself', 'error');
      return;
    }

    const conversation = await createConversation(currentTask!.posterId!, taskId!);
    if (conversation) {
      router.push({ pathname: `/(screens)/chat-detail`, params: { conversationId: conversation.id } });
    }
  };

  const handleCall = () => {
    if (currentTask?.posterPhone) {
      Alert.alert('Call', `Call ${currentTask.posterName}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {
          Linking.openURL(`tel:${currentTask.posterPhone}`).catch(() => showToast('Unable to open dialer', 'error'));
        }},
      ]);
    } else {
      showToast('Poster has not shared a phone number', 'info');
    }
  };

  const handleShare = () => {
    // In real app: Share.share({ title: currentTask?.title, url: `localbuddy://task/${taskId}` })
    showToast('Share feature coming soon', 'info');
  };

  const handleReport = () => {
    Alert.alert('Report Task', 'Are you sure you want to report this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => showToast('Task reported', 'success') },
    ]);
  };

  if (!currentTask) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Task details" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="clipboard" size={28} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading task…</Text>
        </View>
      </View>
    );
  }

  const task = currentTask;
  const isPoster = task.posterId === user?.id;
  // Applied state persists across visits: backend stores applicant ids in the
  // task's `applicants` array (realtime + REST both map it).
  const isApplied =
    applied ||
    (Array.isArray(task.applicants) && !!user?.id && task.applicants.includes(user.id)) ||
    task.applications?.some((a: any) => (a.applicantId || a.buddyId || a.id) === user?.id);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* In-page soft header (no native header bar) */}
        <ScreenHeader
          title="Task details"
          subtitle={task.location?.city ? `${task.location.area || ''} ${task.location.area ? '•' : ''} ${task.location.city}`.trim() : 'Task information'}
          onBack={() => router.back()}
          right={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={handleSave} style={styles.headerRoundBtn} accessibilityLabel="Save task">
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? Colors.brand.accent : Colors.text.primary} />
              </Pressable>
              <Pressable onPress={handleShare} style={styles.headerRoundBtn} accessibilityLabel="Share task">
                <Ionicons name="share-social-outline" size={18} color={Colors.text.primary} />
              </Pressable>
            </View>
          }
        />
        {/* Task Image */}
        {task.images && task.images.length > 0 ? (
          <MotiView from={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 440 }} style={styles.imageContainer}>
            <Image
              source={{ uri: task.images[0]?.url }}
              style={styles.taskImage}
              resizeMode="cover"
            />
            {task.isUrgent ? (
              <View style={styles.urgentBadge}>
                <Ionicons name="flash" size={13} color="#fff" />
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            ) : null}
            {task.isRemote ? (
              <View style={[styles.remoteBadge, { top: task.isUrgent ? 46 : 12 }]}>
                <Ionicons name="desktop" size={12} color="#fff" />
                <Text style={styles.remoteBadgeText}>REMOTE</Text>
              </View>
            ) : null}
          </MotiView>
        ) : null}

        <View style={[styles.content, !task.images?.length && { marginTop: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          {/* Title & Category */}
          <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 60 }} style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={styles.categoryBadge}>
                <Ionicons name="pricetag" size={11} color={Colors.brand.accentPressed} />
                <Text style={styles.categoryBadgeText}>{String(task.category).replace(/_/g, ' ')}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusColor(task.status).soft }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(task.status).solid }]} />
                <Text style={[styles.statusPillText, { color: statusColor(task.status).solid }]}>{String(task.status).replace(/_/g, ' ')}</Text>
              </View>
              {task.budget?.type === 'hourly' ? (
                <View style={styles.hourlyBadge}>
                  <Text style={styles.hourlyBadgeText}>per hour</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
          </MotiView>

          {/* Budget strip — orange hero inside content */}
          <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 140 }} style={styles.budgetCard}>
            <View>
              <Text style={styles.budgetLabel}>BUDGET</Text>
              <Text style={styles.budgetAmount}>
                {formatCurrency(task.budget?.amount ?? 0)}{task.budget?.type === 'hourly' ? '/hr' : ''}
              </Text>
            </View>
            <View style={styles.budgetMeta}>
              <View style={styles.budgetMetaItem}>
                <Ionicons name="card-outline" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.budgetMetaText}>{String(task.budget?.type || 'fixed')}</Text>
              </View>
              {(task as any).maxApplicants ? (
                <View style={styles.budgetMetaItem}>
                  <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.budgetMetaText}>{task.applicationsCount || 0}/{(task as any).maxApplicants} applied</Text>
                </View>
              ) : null}
            </View>
          </MotiView>

          {/* Info grid — key facts at a glance */}
          <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 200 }} style={styles.infoGrid}>
            <InfoTile icon="location" label="Location" value={task.location?.area ? `${task.location.area}, ${task.location.city || ''}` : (task.location?.city || 'Near you')} />
            <InfoTile icon="calendar" label="Deadline" value={task.deadline ? formatDate(task.deadline) : 'Flexible'} sub={task.deadline ? formatRelativeTime(task.deadline) : undefined} />
            <InfoTile icon="time" label="Posted" value={formatRelativeTime(task.createdAt)} sub={formatDate(task.createdAt)} />
            <InfoTile icon="person" label="Posted by" value={task.posterName || 'Poster'} />
            {(task as any).duration ? <InfoTile icon="hourglass" label="Duration" value={String((task as any).duration)} /> : null}
            <InfoTile icon={task.isRemote ? 'desktop' : 'walk'} label="Work mode" value={task.isRemote ? 'Remote' : 'On-site'} />
          </MotiView>

          {task.skills && task.skills.length > 0 ? (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 400, delay: 260 }} style={styles.skillsSection}>
              <Text style={styles.sectionTitle}>Required skills</Text>
              <View style={styles.skillsContainer}>
                {task.skills.map((skill: string) => (
                  <View key={skill} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </MotiView>
          ) : null}

          {/* Description */}
          <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 300 }} style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{task.description}</Text>
          </MotiView>

          {/* Poster Info */}
          <MotiView from={{ opacity: 0, translateY: 14 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 420, delay: 360 }} style={styles.section}>
            <Text style={styles.sectionTitle}>Posted by</Text>
            <Pressable
              style={({ pressed }) => [styles.posterCard, pressed && { transform: [{ scale: 0.99 }] }]}
              onPress={() => router.push({ pathname: `/(screens)/user-profile`, params: { userId: task.posterId } })}
            >
              <View style={styles.posterAvatar}>
                {task.posterAvatar ? (
                  <Image source={{ uri: task.posterAvatar }} style={styles.posterAvatarImage} />
                ) : (
                  <Text style={styles.posterAvatarText}>{task.posterName?.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.posterInfo}>
                <Text style={styles.posterName}>{task.posterName}</Text>
                <View style={styles.posterStats}>
                  <View style={styles.posterStat}>
                    <Ionicons name="star" size={12} color={Colors.semantic.warning} />
                    <Text style={styles.posterStatValue}>{task.posterRating?.toFixed(1) || '4.5'}</Text>
                  </View>
                  <Text style={styles.posterStatDivider}>•</Text>
                  <View style={styles.posterStat}>
                    <Text style={styles.posterStatValue}>{task.posterCompletedTasks || 0}</Text>
                    <Text style={styles.posterStatLabel}>completed</Text>
                  </View>
                  <Text style={styles.posterStatDivider}>•</Text>
                  <View style={styles.posterStat}>
                    <Text style={styles.posterStatValue}>{task.posterResponseRate || 90}%</Text>
                    <Text style={styles.posterStatLabel}>response</Text>
                  </View>
                </View>
              </View>
              <View style={styles.posterViewProfile}>
                <Ionicons name="chevron-forward" size={16} color={Colors.brand.accent} />
              </View>
            </Pressable>

            {/* Buddy ↔ Poster quick contact */}
            {!isPoster ? (
              <View style={styles.contactRow}>
                <Pressable style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.9 }]} onPress={handleChat}>
                  <Ionicons name="chatbubble-ellipses" size={17} color="#FFFFFF" />
                  <Text style={styles.contactBtnText}>Chat with poster</Text>
                </Pressable>
                {task.posterPhone ? (
                  <Pressable style={({ pressed }) => [styles.contactBtnGhost, pressed && { opacity: 0.85 }]} onPress={handleCall}>
                    <Ionicons name="call" size={16} color={Colors.brand.primary} />
                    <Text style={styles.contactBtnGhostText}>Call</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Poster side: chat with assigned buddy */}
            {isPoster && (task as any).buddyName ? (
              <Pressable
                style={({ pressed }) => [styles.buddyStrip, pressed && { transform: [{ scale: 0.99 }] }]}
                onPress={async () => {
                  const buddyId = (task as any).buddyId;
                  if (buddyId) {
                    const conv = await createConversation(buddyId, taskId!);
                    if (conv) router.push({ pathname: '/(screens)/chat-detail', params: { conversationId: conv.id } });
                  } else {
                    showToast('Buddy not assigned yet', 'info');
                  }
                }}
              >
                <View style={styles.buddyStripAvatar}>
                  <Ionicons name="hand-left" size={17} color={Colors.brand.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.buddyStripTitle}>Chat with buddy</Text>
                  <Text style={styles.buddyStripSub}>{(task as any).buddyName} is working on this task</Text>
                </View>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.brand.accent} />
              </Pressable>
            ) : null}
          </MotiView>

          {/* Applications Count */}
          {task.applicationsCount && task.applicationsCount > 0 ? (
            <View style={styles.section}>
              <View style={[styles.applicationsHeader, { justifyContent: 'space-between' }]}>
                <Text style={styles.sectionTitle}>
                  {task.applicationsCount} Application{task.applicationsCount > 1 ? 's' : ''}
                </Text>
                {isPoster ? (
                  <Pressable
                    style={styles.viewAllButton}
                    onPress={() => router.push({ pathname: '/(screens)/task-applications', params: { taskId: task.id } })}
                  >
                    <Text style={styles.viewAllButtonText}>View all</Text>
                    <Ionicons name="chevron-forward" size={15} color={Colors.brand.accent} />
                  </Pressable>
                ) : null}
              </View>
              {isPoster && task.applications && task.applications.length > 0 ? (
                <View style={styles.applicationsList}>
                  {task.applications.slice(0, 3).map((app: any) => (
                    <View key={app.id} style={styles.applicationCard}>
                      <View style={styles.applicantAvatar}>
                        {app.applicantAvatar ? (
                          <Image source={{ uri: app.applicantAvatar }} style={styles.applicantAvatarImage} />
                        ) : (
                          <Text style={styles.applicantAvatarText}>{app.applicantName?.charAt(0).toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={styles.applicantInfo}>
                        <Text style={styles.applicantName}>{app.applicantName}</Text>
                        <Text style={styles.applicantMessage} numberOfLines={2}>{app.message}</Text>
                      </View>
                      <View style={styles.applicantActions}>
                        <Pressable style={styles.acceptButton} onPress={() => router.push({ pathname: '/(screens)/task-applications', params: { taskId: task.id } })}>
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </Pressable>
                        <Pressable style={styles.declineButton} onPress={() => router.push({ pathname: '/(screens)/task-applications', params: { taskId: task.id } })}>
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isPoster ? (
              <>
                {task.status === 'open' ? (
                  <SoftButton
                    label="Edit task"
                    variant="primary"
                    icon="create-outline"
                    onPress={() => router.push({ pathname: `/(screens)/edit-task`, params: { taskId: task.id } })}
                    style={{ flex: 1 }}
                  />
                ) : null}
                {task.status === 'open' ? (
                  <SoftButton
                    label="Close task"
                    variant="danger"
                    icon="close-circle-outline"
                    onPress={() => Alert.alert('Close Task', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Close', style: 'destructive', onPress: () => showToast('Task closed', 'success') }
                    ])}
                    style={{ flex: 1 }}
                  />
                ) : null}
              </>
            ) : (
              <>
                {!isApplied && task.status === 'open' ? (
                  <SoftButton
                    label={isApplying ? 'Applying…' : 'Apply for this task'}
                    variant="accent"
                    size="lg"
                    icon={isApplying ? 'hourglass-outline' : 'paper-plane'}
                    onPress={handleApply}
                    loading={isApplying}
                    withGlow
                    style={{ flex: 1.3 }}
                  />
                ) : (
                  <View style={styles.appliedBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.semantic.success} />
                    <Text style={styles.appliedBadgeText}>Applied — poster will reach out soon</Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Bottom quick actions */}
          <View style={styles.bottomActions}>
            <Pressable style={styles.bottomAction} onPress={handleSave}>
              <View style={styles.bottomActionIcon}>
                <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={18} color={saved ? Colors.brand.accent : Colors.brand.primary} />
              </View>
              <Text style={[styles.bottomActionText, saved && { color: Colors.brand.accent }]}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </Pressable>
            <Pressable style={styles.bottomAction} onPress={handleReport}>
              <View style={styles.bottomActionIcon}>
                <Ionicons name="flag-outline" size={18} color={Colors.semantic.error} />
              </View>
              <Text style={[styles.bottomActionText, { color: Colors.semantic.error }]}>Report</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function statusColor(status: string): { solid: string; soft: string } {
  switch (status) {
    case 'open': return { solid: Colors.semantic.info, soft: Colors.semantic.infoSoft };
    case 'in_progress': return { solid: Colors.semantic.warning, soft: Colors.semantic.warningSoft };
    case 'completed': return { solid: Colors.semantic.success, soft: Colors.semantic.successSoft };
    case 'cancelled': case 'disputed': return { solid: Colors.semantic.error, soft: Colors.semantic.errorSoft };
    default: return { solid: Colors.text.muted, soft: Colors.surface.tertiary };
  }
}

const InfoTile = ({ icon, label, value, sub }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; sub?: string }) => (
  <View style={styles.infoTile}>
    <View style={styles.infoTileIcon}>
      <Ionicons name={icon} size={16} color={Colors.brand.accent} />
    </View>
    <Text style={styles.infoTileLabel}>{label}</Text>
    <Text style={styles.infoTileValue} numberOfLines={2}>{value}</Text>
    {sub ? <Text style={styles.infoTileSub}>{sub}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[3] },
  loadingBadge: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  scrollContent: { paddingBottom: 100 },

  headerRoundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface.elevated,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.cardPressed,
  },

  imageContainer: {
    height: 220, position: 'relative', marginHorizontal: Spacing[5],
    borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadows.card,
  },
  taskImage: { width: '100%', height: '100%' },
  urgentBadge: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.semantic.error, paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: BorderRadius.pill,
  },
  urgentBadgeText: { color: '#fff', fontSize: 10.5, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.8 },
  remoteBadge: {
    position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.brand.primary, paddingHorizontal: Spacing[3], paddingVertical: 4, borderRadius: BorderRadius.pill,
  },
  remoteBadgeText: { color: '#fff', fontSize: 10.5, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.8 },

  content: {
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    marginTop: -22, paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: 40,
  },

  titleSection: { marginBottom: Spacing[4] },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2], flexWrap: 'wrap' },
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 5,
  },
  categoryBadgeText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed, textTransform: 'capitalize' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, textTransform: 'capitalize' },
  hourlyBadge: { paddingHorizontal: Spacing[2], paddingVertical: 4, borderRadius: BorderRadius.pill, backgroundColor: Colors.semantic.warningSoft },
  hourlyBadgeText: { fontSize: 10.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.warning },
  taskTitle: {
    fontSize: 25, fontFamily: Typography.fontFamily.display, lineHeight: 32,
    color: Colors.text.primary, marginTop: 2,
  },

  budgetCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.lg,
    padding: Spacing[5], marginBottom: Spacing[5], ...Shadows.buttonOrange,
  },
  budgetLabel: { fontSize: 10.5, fontFamily: Typography.fontFamily.bold, color: 'rgba(255,255,255,0.8)', letterSpacing: 1.2, marginBottom: 4 },
  budgetAmount: { fontSize: 30, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  budgetMeta: { gap: 6, alignItems: 'flex-end' },
  budgetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  budgetMetaText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.9)', textTransform: 'capitalize' },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing[2], marginBottom: Spacing[5] },
  infoTile: {
    width: '48.5%', backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[3], ...Shadows.cardPressed,
  },
  infoTileIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  infoTileLabel: { fontSize: 10.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  infoTileValue: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginTop: 1 },
  infoTileSub: { fontSize: 11, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 1 },

  skillsSection: { marginBottom: Spacing[5] },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  skillTag: { backgroundColor: Colors.brand.accentSoft, paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: BorderRadius.pill },
  skillTagText: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.brand.accentPressed },

  section: { marginBottom: Spacing[6] },
  sectionTitle: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[3] },
  descriptionText: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, lineHeight: 23, color: Colors.text.secondary },

  posterCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[4], ...Shadows.card,
  },
  posterAvatar: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  posterAvatarImage: { width: '100%', height: '100%' },
  posterAvatarText: { fontSize: 21, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  posterInfo: { flex: 1 },
  posterName: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  posterStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginTop: 5, flexWrap: 'wrap' },
  posterStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  posterStatValue: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  posterStatLabel: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  posterStatDivider: { color: Colors.border.medium, fontSize: 12, fontFamily: Typography.fontFamily.body },
  posterViewProfile: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },

  contactRow: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[3] },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: Colors.brand.accent, borderRadius: BorderRadius.pill,
    paddingVertical: Spacing[3] + 2, ...Shadows.buttonOrange,
  },
  contactBtnText: { color: '#FFFFFF', fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold },
  contactBtnGhost: {
    paddingHorizontal: Spacing[5], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.pill,
    borderWidth: 1.5, borderColor: Colors.brand.primary,
  },
  contactBtnGhostText: { color: Colors.brand.primary, fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold },

  buddyStrip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.brand.accent + '40',
    padding: Spacing[4], marginTop: Spacing[3],
  },
  buddyStripAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  buddyStripTitle: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  buddyStripSub: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },

  applicationsHeader: { flexDirection: 'row', alignItems: 'center' },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  viewAllButtonText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accent },
  applicationsList: { gap: Spacing[3] },
  applicationCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[3], backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.cardPressed,
  },
  applicantAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  applicantAvatarImage: { width: '100%', height: '100%' },
  applicantAvatarText: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  applicantInfo: { flex: 1, minWidth: 0 },
  applicantName: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  applicantMessage: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 },
  applicantActions: { flexDirection: 'row', gap: Spacing[2] },
  acceptButton: { backgroundColor: Colors.semantic.success, paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: BorderRadius.pill },
  acceptButtonText: { color: '#fff', fontSize: 11.5, fontFamily: Typography.fontFamily.semiBold },
  declineButton: { backgroundColor: Colors.semantic.errorSoft, paddingHorizontal: Spacing[3], paddingVertical: 6, borderRadius: BorderRadius.pill },
  declineButtonText: { color: Colors.semantic.error, fontSize: 11.5, fontFamily: Typography.fontFamily.semiBold },

  actionButtons: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[2] },
  appliedBadge: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: Spacing[4], borderRadius: BorderRadius.pill,
    backgroundColor: Colors.semantic.successSoft, borderWidth: 1.5, borderColor: Colors.semantic.success + '40',
  },
  appliedBadgeText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.semantic.success },

  bottomActions: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing[8],
    marginTop: Spacing[6], paddingTop: Spacing[5],
    borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  bottomAction: { alignItems: 'center', gap: 4 },
  bottomActionIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface.elevated,
    alignItems: 'center', justifyContent: 'center', ...Shadows.cardPressed,
  },
  bottomActionText: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
});