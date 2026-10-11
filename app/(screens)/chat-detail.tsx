/**
 * Chat Detail Screen - Individual conversation view
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime, formatTime } from '@/utils/helpers';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const {
    messages: messagesMap,
    currentConversation,
    fetchMessages,
    sendMessage,
    markAsRead,
    isLoading: chatLoading,
    isSending,
  } = useChatStore();
  const messages = (conversationId && messagesMap[conversationId]) || [];
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const isDark = false;
  const [messageText, setMessageText] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const flatListRef = useRef<FlatList<any>>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (conversationId && isAuthenticated) {
      fetchMessages(conversationId);
      markAsRead(conversationId);
    }
  }, [conversationId, isAuthenticated, fetchMessages, markAsRead]);

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId) return;
    
    const text = messageText.trim();
    setMessageText('');
    
    await sendMessage(conversationId, text, 'text');
  };

  const handleImagePick = () => {
    // In real app: ImagePicker.launchImageLibraryAsync()
    Alert.alert('Feature coming soon', 'Image sharing will be available soon');
  };

  const handleLocationShare = () => {
    // In real app: Share location
    Alert.alert('Feature coming soon', 'Location sharing will be available soon');
  };

  const handleCall = () => {
    if (currentConversation?.otherUser?.phone) {
      Alert.alert('Call', `Call ${currentConversation.otherUser.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {} },
      ]);
    }
  };

  const handleVideoCall = () => {
    Alert.alert('Feature coming soon', 'Video calls will be available soon');
  };

  const handleViewProfile = () => {
    if (currentConversation?.otherUser?.id) {
      router.push({ pathname: `/(screens)/user-profile`, params: { userId: currentConversation.otherUser.id } });
    }
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {} },
    ]);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwn = item.senderId === user?.id;
    const showTime = !item.isContinuation;
    const showAvatar = !isOwn && !item.isContinuation;

    return (
      <View style={styles.messageContainer}>
        {showAvatar && (
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              {item.senderAvatar ? (
                <Image source={{ uri: item.senderAvatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{item.senderName?.charAt(0).toUpperCase()}</Text>
              )}
            </View>
          </View>
        )}
          <View style={[styles.messageWrapper, isOwn && styles.messageWrapperOwn]}>
          {!isOwn && !item.isContinuation && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <View style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
            isOwn ? Shadows.button : {},
          ]}>
            {item.type === 'image' && item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
            )}
            {item.type === 'text' && (
              <Text style={[
                styles.messageText,
                { color: isOwn ? '#fff' : Colors.text.primary }
              ]}>
                {item.content}
              </Text>
            )}
            {item.type === 'task' && (
              <View style={[styles.taskMessageCard, !isOwn && { backgroundColor: Colors.brand.accentSoft }]}>
                <Text style={[styles.taskMessageTitle, { color: isOwn ? '#fff' : Colors.text.primary }]}>{item.taskTitle}</Text>
                <Text style={[styles.taskMessageBudget, { color: isOwn ? '#FFD9CE' : Colors.brand.accentPressed }]}>{item.taskBudget}</Text>
              </View>
            )}
            {item.type === 'location' && (
              <View style={[styles.locationMessageCard, !isOwn && { backgroundColor: Colors.brand.accentSoft }]}>
                <MaterialCommunityIcons name="map-marker" size={20} color={isOwn ? '#fff' : Colors.brand.accent} />
                <Text style={[styles.locationMessageText, { color: isOwn ? '#fff' : Colors.text.primary }]}>
                  {item.locationName || 'Shared Location'}
                </Text>
              </View>
            )}
            {showTime && (
              <Text style={[
                styles.messageTime,
                { color: isOwn ? '#FFFFFFA6' : Colors.text.muted }
              ]}>
                {formatTime(item.createdAt)}
                {isOwn && item.status ? ' ' : ''}
                {isOwn && item.status ? (item.status === 'read' ? '✓✓' : '✓') : ''}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Chat" onBack={() => router.back()} />
        <View style={styles.authPrompt}>
          <View style={styles.authIconWrap}>
            <Ionicons name="chatbubbles" size={40} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Sign in to chat</Text>
          <Text style={styles.authSubtitle}>Log in to start messaging</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom chat header — no native bar */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerCircleBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={19} color={Colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerUser} onPress={handleViewProfile}>
            <View style={styles.headerAvatar}>
              {currentConversation?.otherUser?.avatar ? (
                <Image source={{ uri: currentConversation.otherUser.avatar }} style={styles.headerAvatarImage} />
              ) : (
                <Text style={styles.headerAvatarText}>{currentConversation?.otherUser?.name?.charAt(0).toUpperCase()}</Text>
              )}
              {currentConversation?.otherUser?.isOnline ? (
                <View style={styles.onlineIndicator} />
              ) : null}
            </View>
            <View style={styles.headerUserInfo}>
              <Text style={styles.headerUserName} numberOfLines={1}>
                {currentConversation?.otherUser?.name || 'Loading...'}
              </Text>
              <Text style={styles.headerUserStatus}>
                {currentConversation?.otherUser?.isOnline ? 'Online' : `Last seen ${formatRelativeTime(currentConversation?.otherUser?.lastSeen ?? new Date().toISOString())}`}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(true)} style={styles.headerCircleBtn} hitSlop={8} accessibilityLabel="Chat options">
            <Ionicons name="ellipsis-vertical" size={17} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        inverted
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyMessages}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubble-outline" size={30} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyMessagesText}>No messages yet</Text>
            <Text style={styles.emptyMessagesSubtext}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainerWrapper}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.inputActions}>
            <TouchableOpacity onPress={handleImagePick} style={styles.attachBtn} hitSlop={6} accessibilityLabel="Send photo">
              <Ionicons name="image" size={19} color={Colors.brand.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLocationShare} style={styles.attachBtn} hitSlop={6} accessibilityLabel="Share location">
              <MaterialCommunityIcons name="map-marker" size={19} color={Colors.brand.accent} />
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={1000}
              onFocus={() => setKeyboardVisible(true)}
              onBlur={() => setKeyboardVisible(false)}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              messageText.trim() ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <Ionicons name="hourglass" size={19} color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color={messageText.trim() ? '#fff' : Colors.text.muted} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Options Modal */}
      {showOptions && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowOptions(false)}>
          <View style={styles.modalContent} onTouchStart={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            {[
              { icon: 'call' as const, label: 'Voice call', onPress: handleCall, tint: 'accent' },
              { icon: 'videocam' as const, label: 'Video call', onPress: handleVideoCall, tint: 'accent' },
              { icon: 'person' as const, label: 'View profile', onPress: handleViewProfile, tint: 'accent' },
            ].map((opt) => (
              <TouchableOpacity key={opt.label} style={styles.modalItem} onPress={() => { setShowOptions(false); opt.onPress(); }}>
                <View style={[styles.modalItemIcon, { backgroundColor: Colors.brand.accentSoft }]}>
                  <Ionicons name={opt.icon} size={17} color={Colors.brand.accent} />
                </View>
                <Text style={styles.modalItemText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalDivider} />
            {[
              { icon: 'trash-outline' as const, label: 'Clear chat', onPress: handleClearChat },
            ].map((opt) => (
              <TouchableOpacity key={opt.label} style={styles.modalItem} onPress={() => { setShowOptions(false); opt.onPress(); }}>
                <View style={[styles.modalItemIcon, { backgroundColor: Colors.semantic.errorSoft }]}>
                  <Ionicons name={opt.icon} size={17} color={Colors.semantic.error} />
                </View>
                <Text style={[styles.modalItemText, { color: Colors.semantic.error }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowOptions(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  header: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  headerCircleBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light,
    alignItems: 'center', justifyContent: 'center', ...Shadows.cardPressed,
  },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden',
  },
  headerAvatarImage: { width: '100%', height: '100%' },
  headerAvatarText: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  onlineIndicator: {
    position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.semantic.success, borderWidth: 2, borderColor: Colors.surface.primary,
  },
  headerUserInfo: { flex: 1 },
  headerUserName: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  headerUserStatus: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },

  messagesContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[5] },
  messageContainer: { flexDirection: 'row', marginBottom: Spacing[2] },
  avatarWrapper: { width: 34, marginRight: Spacing[2], marginTop: 4 },
  avatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  messageWrapper: { flex: 1, maxWidth: '78%' },
  messageWrapperOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  senderName: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary, marginBottom: 3, marginLeft: 6 },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  messageBubbleOwn: { borderBottomRightRadius: 6, backgroundColor: Colors.brand.primary },
  messageBubbleOther: {
    borderBottomLeftRadius: 6, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.cardPressed,
  },
  messageText: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, lineHeight: 21 },
  messageTime: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, marginTop: 4, textAlign: 'right' },
  messageImage: { width: 200, height: 200, borderRadius: 16, marginBottom: 4 },
  taskMessageCard: { backgroundColor: 'rgba(255,255,255,0.14)', padding: 12, borderRadius: 14, marginTop: 4 },
  taskMessageTitle: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold },
  taskMessageBudget: { fontSize: 13, fontFamily: Typography.fontFamily.bold, marginTop: 2 },
  locationMessageCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)', padding: 12, borderRadius: 14, marginTop: 4 },
  locationMessageText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body },

  emptyMessages: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyMessagesText: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginTop: Spacing[4] },
  emptyMessagesSubtext: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[1] },

  inputContainerWrapper: { flex: 1 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3], gap: Spacing[2],
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  inputActions: { flexDirection: 'row', gap: 6, marginBottom: 3 },
  attachBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing[4], paddingVertical: 6,
    maxHeight: 120, backgroundColor: Colors.surface.elevated,
    borderWidth: 1.5, borderColor: Colors.border.light,
  },
  textInput: { fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary, minHeight: 24 },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  sendButtonActive: { backgroundColor: Colors.brand.accent, ...Shadows.buttonOrange },
  sendButtonInactive: { backgroundColor: Colors.surface.tertiary },

  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  authIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  authTitle: { fontSize: 24, fontFamily: Typography.fontFamily.display, marginTop: Spacing[4], textAlign: 'center', color: Colors.text.primary },
  authSubtitle: { fontSize: 14, fontFamily: Typography.fontFamily.body, marginTop: Spacing[2], textAlign: 'center', color: Colors.text.secondary },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(30,18,9,0.42)', justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    paddingVertical: Spacing[3], paddingBottom: Spacing[6], backgroundColor: Colors.surface.elevated,
    borderTopWidth: 1, borderColor: Colors.border.light, ...Shadows.floating,
  },
  modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: Colors.border.medium, alignSelf: 'center', marginBottom: Spacing[3] },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingHorizontal: Spacing[5], paddingVertical: Spacing[3] + 2 },
  modalItemIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  modalItemText: { fontSize: 15, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  modalDivider: { height: 1, marginHorizontal: Spacing[5], marginVertical: 2, backgroundColor: Colors.border.light },
  modalCancel: {
    alignItems: 'center', marginHorizontal: Spacing[5], marginTop: Spacing[2],
    paddingVertical: Spacing[3], borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface.tertiary,
  },
  modalCancelText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
});