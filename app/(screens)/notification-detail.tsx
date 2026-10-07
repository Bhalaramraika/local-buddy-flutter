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
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';

export default function NotificationDetailScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { notifications, markAsRead } = useNotificationStore();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const isDark = theme === 'dark';

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

  const notification: any = notifications.find(n => n.id === id) || getMockNotification(id);

  React.useEffect(() => {
    if (notification && !notification.read) {
      markAsRead(notification.id);
    }
  }, [notification]);

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { icon: string; color: string; bgColor: string }> = {
      task: { icon: 'clipboard-outline', color: '#8B85FF', bgColor: '#8B85FF15' },
      message: { icon: 'chatbubbles-outline', color: '#10B981', bgColor: '#10B98115' },
      payment: { icon: 'card-outline', color: '#F59E0B', bgColor: '#F59E0B15' },
      system: { icon: 'information-circle-outline', color: '#6B7280', bgColor: '#6B728015' },
      promo: { icon: 'gift-outline', color: '#EC4899', bgColor: '#EC489915' },
      security: { icon: 'shield-outline', color: '#EF4444', bgColor: '#EF444415' },
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
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Notification</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Card */}
        <View style={[styles.notificationCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          {/* Type Badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
            <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
          </View>

          {/* Title */}
          <Text style={[styles.notificationTitle, { color: isDark ? '#fff' : '#000' }]}>
            {notification.title}
          </Text>

          {/* Time */}
          <Text style={[styles.notificationTime, { color: isDark ? '#888' : '#666' }]}>
            {notification.time}
          </Text>

          {/* Message */}
          <Text style={[styles.notificationMessage, { color: isDark ? '#ccc' : '#333' }]}>
            {notification.message}
          </Text>

          {/* Sender Info (if applicable) */}
          {notification.avatar && (
            <View style={styles.senderInfo}>
              <Image 
                source={{ uri: notification.avatar }} 
                style={styles.senderAvatar} 
              />
              <View style={styles.senderDetails}>
                <Text style={[styles.senderName, { color: isDark ? '#fff' : '#000' }]}>
                  {notification.data?.userName || 'LocalBuddy Team'}
                </Text>
                <Text style={[styles.senderRole, { color: isDark ? '#888' : '#666' }]}>
                  {notification.type === 'task' ? 'Task Applicant' : 
                   notification.type === 'message' ? 'Message from' : 'System Notification'}
                </Text>
              </View>
            </View>
          )}

          {/* Action Button */}
          {notification.data && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: typeConfig.color }]}
              onPress={handleAction}
            >
              <Text style={styles.actionButtonText}>
                {notification.type === 'task' ? 'View Task' : 
                 notification.type === 'message' ? 'Open Chat' : 
                 notification.type === 'payment' ? 'View Transaction' : 'View Details'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Additional Details */}
          <View style={styles.detailsSection}>
            <Text style={[styles.detailsTitle, { color: isDark ? '#fff' : '#000' }]}>Details</Text>
            <View style={styles.detailsList}>
              <DetailRow label="Notification ID" value={notification.id} isDark={isDark} />
              <DetailRow label="Type" value={notification.type.charAt(0).toUpperCase() + notification.type.slice(1)} isDark={isDark} />
              <DetailRow label="Status" value={notification.read ? 'Read' : 'Unread'} isDark={isDark} />
              <DetailRow label="Received" value={notification.time} isDark={isDark} />
            </View>
          </View>
        </View>

        {/* Related Actions */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => {
              markAsRead(notification.id);
              Alert.alert('Marked as read');
            }}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="checkmark-outline" size={22} color="#10B981" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Mark as Read</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => Alert.alert('Delete', 'Remove this notification?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => router.back() }
            ])}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? '#fff' : '#000' }]}>Delete Notification</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const DetailRow = ({ label, value, isDark }: any) => (
  <View style={styles.detailRow}>
    <Text style={[styles.detailLabel, { color: isDark ? '#888' : '#666' }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: isDark ? '#fff' : '#000' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  notificationCard: { borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#eee' },
  typeBadge: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    alignSelf: 'flex-start',
    marginBottom: 16 
  },
  notificationTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  notificationTime: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  notificationMessage: { fontSize: 16, fontFamily: 'Inter_400Regular', lineHeight: 24, marginBottom: 16 },
  senderInfo: { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee', marginBottom: 16 },
  senderAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  senderDetails: { flex: 1 },
  senderName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  senderRole: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  actionButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  actionButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  detailsSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  detailsTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  detailsList: { gap: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  detailValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  actionText: { fontSize: 16, fontFamily: 'Inter_500Medium', flex: 1 },
});