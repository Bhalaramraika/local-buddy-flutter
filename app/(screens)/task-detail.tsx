/**
 * Task Detail Screen - View full task details and apply
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatRelativeTime, formatDate } from '@/utils/helpers';
import { Colors } from '@/constants/design';

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
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
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

    const success = await applyToTask(taskId!, {
      message: `Hi, I'm interested in your task "${currentTask?.title}". I believe I can help with this.`,
      proposedBudget: currentTask?.budget?.amount,
    });

    if (success) {
      setApplied(true);
      showToast('Application submitted successfully!', 'success');
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
          // In real app: Linking.openURL(`tel:${currentTask.posterPhone}`)
        }},
      ]);
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
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Task Details</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#8B85FF" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading task...</Text>
        </View>
      </View>
    );
  }

  const task = currentTask;
  const isPoster = task.posterId === user?.id;
  const isApplied = applied || task.applications?.some((a: any) => a.applicantId === user?.id);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Task Details</Text>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={26} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Task Image */}
        {task.images && task.images.length > 0 && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: task.images[0]?.url }} 
              style={styles.taskImage}
              resizeMode="cover"
            />
            {task.isUrgent && (
              <View style={styles.urgentBadge}>
                <Ionicons name="flash-outline" size={14} color="#fff" />
                <Text style={styles.urgentBadgeText}>URGENT</Text>
              </View>
            )}
            {task.isRemote && (
              <View style={[styles.remoteBadge, { top: task.isUrgent ? 40 : 8 }]}>
                <Ionicons name="desktop-outline" size={14} color="#fff" />
                <Text style={styles.remoteBadgeText}>REMOTE</Text>
              </View>
            )}
          </View>
        )}

        <View style={[styles.content, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          {/* Title & Category */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: getCategoryColor(task.category) }
              ]}>
                <Text style={styles.categoryBadgeText}>{task.category}</Text>
              </View>
              {task.budget?.type === 'hourly' && (
                <View style={styles.hourlyBadge}>
                  <Text style={styles.hourlyBadgeText}>/hour</Text>
                </View>
              )}
            </View>
            <Text style={[styles.taskTitle, { color: isDark ? '#fff' : '#000' }]}>{task.title}</Text>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: isDark ? '#888' : '#666' }]}>Budget</Text>
              <Text style={[styles.budgetAmount, { color: isDark ? '#fff' : '#000' }]}>
                {formatCurrency(task.budget?.amount ?? 0)}{task.budget?.type === 'hourly' ? '/hr' : ''}
              </Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="map-marker" size={18} color={isDark ? '#888' : '#666'} />
                <Text style={[styles.metaText, { color: isDark ? '#fff' : '#000' }]}>{task.location?.area}, {task.location?.city}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={18} color={isDark ? '#888' : '#666'} />
                <Text style={[styles.metaText, { color: isDark ? '#fff' : '#000' }]}>
                  {task.deadline ? `Due ${formatRelativeTime(task.deadline)}` : 'No deadline'}
                </Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Feather name="user" size={18} color={isDark ? '#888' : '#666'} />
                <Text style={[styles.metaText, { color: isDark ? '#fff' : '#000' }]}>
                  Posted by {task.posterName}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color={isDark ? '#888' : '#666'} />
                <Text style={[styles.metaText, { color: isDark ? '#fff' : '#000' }]}>
                  Posted {formatRelativeTime(task.createdAt)}
                </Text>
              </View>
            </View>
            {task.skills && task.skills.length > 0 && (
              <View style={styles.skillsSection}>
                <Text style={[styles.skillsLabel, { color: isDark ? '#888' : '#666' }]}>Required Skills</Text>
                <View style={styles.skillsContainer}>
                  {task.skills.map((skill: string) => (
                    <View key={skill} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: isDark ? '#ddd' : '#333' }]}>{task.description}</Text>
          </View>

          {/* Poster Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Posted by</Text>
            <TouchableOpacity style={styles.posterCard} onPress={() => router.push({ pathname: `/(screens)/user-profile`, params: { userId: task.posterId } })}>
              <View style={styles.posterAvatar}>
                {task.posterAvatar ? (
                  <Image source={{ uri: task.posterAvatar }} style={styles.posterAvatarImage} />
                ) : (
                  <Text style={styles.posterAvatarText}>{task.posterName?.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.posterInfo}>
                <Text style={[styles.posterName, { color: isDark ? '#fff' : '#000' }]}>{task.posterName}</Text>
                <View style={styles.posterStats}>
                  <View style={styles.posterStat}>
                    <Text style={[styles.posterStatValue, { color: isDark ? '#fff' : '#000' }]}>{task.posterRating?.toFixed(1) || '4.5'}</Text>
                    <AntDesign name="star" size={12} color="#F59E0B" />
                  </View>
                  <Text style={[styles.posterStatDivider, { color: isDark ? '#555' : '#ddd' }]}>|</Text>
                  <View style={styles.posterStat}>
                    <Text style={[styles.posterStatValue, { color: isDark ? '#fff' : '#000' }]}>{task.posterCompletedTasks || 0}</Text>
                    <Text style={[styles.posterStatLabel, { color: isDark ? '#888' : '#666' }]}>Completed</Text>
                  </View>
                  <Text style={[styles.posterStatDivider, { color: isDark ? '#555' : '#ddd' }]}>|</Text>
                  <View style={styles.posterStat}>
                    <Text style={[styles.posterStatValue, { color: isDark ? '#fff' : '#000' }]}>{task.posterResponseRate || 90}%</Text>
                    <Text style={[styles.posterStatLabel, { color: isDark ? '#888' : '#666' }]}>Response</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Applications Count */}
          {task.applicationsCount && task.applicationsCount > 0 && (
            <View style={styles.section}>
              <View style={styles.applicationsHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  {task.applicationsCount} Application{task.applicationsCount > 1 ? 's' : ''}
                </Text>
                {isPoster && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllButtonText}>View All</Text>
                    <Ionicons name="chevron-forward-outline" size={18} color="#8B85FF" />
                  </TouchableOpacity>
                )}
              </View>
              {isPoster && task.applications && task.applications.length > 0 && (
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
                        <Text style={[styles.applicantName, { color: isDark ? '#fff' : '#000' }]}>{app.applicantName}</Text>
                        <Text style={[styles.applicantMessage, { color: isDark ? '#888' : '#666' }]}>{app.message}</Text>
                      </View>
                      <View style={styles.applicantActions}>
                        <TouchableOpacity style={styles.acceptButton}>
                          <Text style={styles.acceptButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineButton}>
                          <Text style={styles.declineButtonText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {isPoster ? (
              <>
                {task.status === 'open' && (
                  <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: `/(screens)/edit-task`, params: { taskId: task.id } })}>
                    <Ionicons name="create-outline" size={20} color="#8B85FF" />
                    <Text style={styles.editButtonText}>Edit Task</Text>
                  </TouchableOpacity>
                )}
                {task.status === 'open' && (
                  <TouchableOpacity style={styles.closeButton} onPress={() => Alert.alert('Close Task', 'Are you sure?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Close', style: 'destructive', onPress: () => showToast('Task closed', 'success') }
                  ])}>
                    <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                    <Text style={styles.closeButtonText}>Close Task</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {!isApplied && task.status === 'open' ? (
                  <TouchableOpacity 
                    style={[styles.applyButton, isApplying && styles.applyButtonDisabled]}
                    onPress={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? (
                      <>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.applyButtonText}>Applying...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="paper-plane-outline" size={20} color="#fff" />
                        <Text style={styles.applyButtonText}>Apply Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.appliedButton}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                    <Text style={styles.appliedButtonText}>Applied</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
                  <Ionicons name="chatbubble-outline" size={20} color="#8B85FF" />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Save/Report */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? Colors.brand.primary : (isDark ? '#888' : '#666')} />
              <Text style={[styles.saveButtonText, { color: saved ? Colors.brand.primary : (isDark ? '#fff' : '#000') }]}>
                {saved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
              <MaterialCommunityIcons name="flag-outline" size={22} color={isDark ? '#888' : '#666'} />
              <Text style={[styles.reportButtonText, { color: isDark ? '#fff' : '#000' }]}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Cleaning: '#10B981',
    Delivery: '#3B82F6',
    Handyman: '#F59E0B',
    Tutoring: '#8B5CF6',
    'Pet Care': '#EC4899',
    'Grocery Shopping': '#06B6D4',
    'Tech Support': '#6366F1',
    'Moving Help': '#EF4444',
    Gardening: '#22C55E',
    'Event Staffing': '#F97316',
    Photography: '#A855F7',
    Writing: '#14B8A6',
    Design: '#EAB308',
    Other: '#6B7280',
  };
  return colors[category] || '#6B7280';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  scrollContent: { paddingBottom: 100 },
  imageContainer: { height: 220, position: 'relative' },
  taskImage: { width: '100%', height: '100%' },
  urgentBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgentBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  remoteBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.brand.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  remoteBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  content: { borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  titleSection: { marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  categoryBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  hourlyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 28, backgroundColor: '#F59E0B20' },
  hourlyBadgeText: { color: '#F59E0B', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  taskTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  budgetRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  budgetLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  budgetAmount: { fontSize: 28, fontFamily: 'Inter_800ExtraBold' },
  metaSection: { marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  metaRow: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  metaText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  skillsSection: { marginTop: 12 },
  skillsLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#8B85FF15', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  skillTagText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.brand.primary },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  descriptionText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 24 },
  posterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#fafafa', borderRadius: 12 },
  posterAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  posterAvatarImage: { width: '100%', height: '100%' },
  posterAvatarText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  posterInfo: { flex: 1 },
  posterName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  posterStats: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  posterStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  posterStatValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  posterStatLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  posterStatDivider: { fontSize: 12 },
  applicationsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.brand.primary },
  applicationsList: { gap: 10 },
  applicationCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#fafafa', borderRadius: 10 },
  applicantAvatar: { width: 44, height: 44, borderRadius: 28, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  applicantAvatarImage: { width: '100%', height: '100%' },
  applicantAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  applicantInfo: { flex: 1, minWidth: 0 },
  applicantName: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  applicantMessage: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  applicantActions: { flexDirection: 'row', gap: 8 },
  acceptButton: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  acceptButtonText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  declineButton: { backgroundColor: '#EF4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  declineButtonText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  applyButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: Colors.brand.primary, borderRadius: 12 },
  applyButtonDisabled: { opacity: 0.7 },
  applyButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  appliedButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: '#10B981', borderRadius: 12 },
  appliedButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  chatButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: '#8B85FF15', borderRadius: 32, borderWidth: 1, borderColor: Colors.brand.primary },
  chatButtonText: { color: Colors.brand.primary, fontSize: 16, fontFamily: 'Inter_700Bold' },
  editButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: '#8B85FF15', borderRadius: 32, borderWidth: 1, borderColor: Colors.brand.primary },
  editButtonText: { color: Colors.brand.primary, fontSize: 16, fontFamily: 'Inter_700Bold' },
  closeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: '#EF444415', borderRadius: 32, borderWidth: 1, borderColor: '#EF4444' },
  closeButtonText: { color: '#EF4444', fontSize: 16, fontFamily: 'Inter_700Bold' },
  bottomActions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  saveButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  reportButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reportButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});