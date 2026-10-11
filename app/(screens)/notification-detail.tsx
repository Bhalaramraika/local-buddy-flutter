/**
 * Notification Detail Screen - View full notification details
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useNotificationStore } from '@/store/notificationStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { notifications, markAsRead } = useNotificationStore();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const getMockNotification = (id: string) => ({
    id,
    type: 'task',
    title: 'New Task Application',
    message: 'John Doe applied for your task "Grocery Shopping"',
    time: '2 hours ago',
    read: false,
    data: { taskId: 'task_123', userId: 'user_456' },
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  });

  // Resolution order: realtime/store copy → params passed by the
  // notifications list → (last resort) placeholder.
  const fromStore: any = notifications.find(n => n.id === id);
  const notification: any = fromStore
    ? {
        ...fromStore,
        read: fromStore.read ?? fromStore.isRead ?? false,
        message: fromStore.message ?? fromStore.body ?? '',
        time: fromStore.time ?? fromStore.createdAt ?? '',
      }
    : params.title
      ? {
          id,
          type: String(params.type || 'system'),
          title: String(params.title),
          message: String(params.message || ''),
          time: String(params.time || ''),
          read: params.read === '1',
        }
      : getMockNotification(id);

  React.useEffect(() => {
    if (notification && !notification.read) {
      markAsRead(notification.id);
    }
  }, [notification]);

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: string; color: string; bgColor: string }> = {
      task: { icon: 'clipboard', color: Colors.brand.accent, bgColor: Colors.brand.accentSoft },
      message: { icon: 'chatbubbles', color: Colors.semantic.info, bgColor: Colors.semantic.infoSoft },
      payment: { icon: 'card', color: Colors.semantic.success, bgColor: Colors.semantic.successSoft },
      system: { icon: 'information-circle', color: Colors.brand.primary, bgColor: '#1E120912' },
      promo: { icon: 'gift', color: Colors.semantic.error, bgColor: Colors.semantic.errorSoft },
      security: { icon: 'shield', color: Colors.semantic.error, bgColor: Colors.semantic.errorSoft },
    };
    return configs[type] || configs.system;
  };

  const typeConfig = getTypeConfig(notification.type);

  const handleAction = () => {
    if (notification.data?.taskId) {
      router.push({ pathname: `/(screens)/task-detail`, params: { taskId: notification.data.taskId } });
    } else if (notification.data?.chatId) {
      router.push({ pathname: `/(screens)/chat-detail`, params: { conversationId: notification.data.chatId } });
    } else if (notification.data?.walletId) {
      router.push({ pathname: `/(screens)/wallet-details`, params: { id: notification.data.walletId } });
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notification" subtitle={notification.title} onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.notificationCard}
        >
          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
            <Ionicons name={typeConfig.icon as any} size={22} color={typeConfig.color} />
          </View>

          {/* Title */}
          <Text style={styles.notificationTitle}>
            {notification.title}
          </Text>

          {/* Time */}
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={12} color={Colors.text.muted} />
            <Text style={styles.notificationTime}>{notification.time}</Text>
          </View>

          {/* Message */}
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>

          {/* Sender Info (if applicable) */}
          {notification.avatar ? (
            <View style={styles.senderInfo}>
              <Image source={{ uri: notification.avatar }} style={styles.senderAvatar} />
              <View style={styles.senderDetails}>
                <Text style={styles.senderName}>
                  {notification.data?.userName || 'LocalBuddy Team'}
                </Text>
                <Text style={styles.senderRole}>
                  {notification.type === 'task' ? 'Task Applicant' :
                   notification.type === 'message' ? 'Message from' : 'System Notification'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Action Button */}
          {notification.data ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: typeConfig.color === Colors.brand.primary ? Colors.brand.primary : typeConfig.color }]}
              onPress={handleAction}
            >
              <Ionicons name="arrow-forward" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>
                {notification.type === 'task' ? 'View Task' :
                 notification.type === 'message' ? 'Open Chat' :
                 notification.type === 'payment' ? 'View Transaction' : 'View Details'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Additional Details */}
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Details</Text>
            <View style={styles.detailsList}>
              <DetailRow label="Notification ID" value={String(notification.id).slice(0, 10) + '…'} />
              <DetailRow label="Type" value={notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} />
              <DetailRow label="Status" value={notification.read ? 'Read' : 'Unread'} valueColor={notification.read ? Colors.semantic.success : Colors.semantic.warning} />
              <DetailRow label="Received" value={notification.time} last />
            </View>
          </View>
        </MotiView>

        {/* Related Actions */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 120 }}
          style={[styles.notificationCard, { marginTop: Spacing[3] }]}
        >
          <Text style={styles.detailsTitle}>Actions</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              markAsRead(notification.id);
              Alert.alert('Marked as read');
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.semantic.successSoft }]}>
              <Ionicons name="checkmark-done" size={17} color={Colors.semantic.success} />
            </View>
            <Text style={styles.actionText}>Mark as read</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => Alert.alert('Delete', 'Remove this notification?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => router.back() }
            ])}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.semantic.errorSoft }]}>
              <Ionicons name="trash-outline" size={17} color={Colors.semantic.error} />
            </View>
            <Text style={[styles.actionText, { color: Colors.semantic.error }]}>Delete notification</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.semantic.error} />
          </TouchableOpacity>
        </MotiView>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const DetailRow = ({ label, value, valueColor, last }: any) => (
  <View style={[styles.detailRow, last && { borderBottomWidth: 0 }]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueColor && { color: valueColor }]} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingBottom: 40 },
  notificationCard: {
    borderRadius: BorderRadius.lg, padding: Spacing[5],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  typeBadge: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing[4],
  },
  notificationTitle: { fontSize: 22, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[1], lineHeight: 28 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing[3] },
  notificationTime: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  notificationMessage: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 22, marginBottom: Spacing[4] },
  senderInfo: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing[3],
    borderTopWidth: 1, borderTopColor: Colors.border.light, marginBottom: Spacing[4],
  },
  senderAvatar: { width: 46, height: 46, borderRadius: 23, marginRight: Spacing[3] },
  senderDetails: { flex: 1 },
  senderName: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: 2 },
  senderRole: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingVertical: Spacing[3] + 2, borderRadius: BorderRadius.pill, marginBottom: Spacing[4],
    ...Shadows.button,
  },
  actionButtonText: { color: '#fff', fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold },
  detailsSection: { paddingTop: Spacing[4], borderTopWidth: 1, borderTopColor: Colors.border.light },
  detailsTitle: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: Spacing[3] },
  detailsList: { gap: 0 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing[2] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  detailLabel: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  detailValue: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[3] + 2 },
  actionIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 14.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, flex: 1 },
});