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
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime, formatTime } from '@/utils/helpers';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { 
    messages, 
    currentConversation,
    fetchMessages,
    sendMessage,
    markAsRead,
    isLoading: chatLoading,
    isSending,
  } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
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
      router.push(`/(screens)/profile/${currentConversation.otherUser.id}`);
    }
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => {} },
    ]);
  };

  const handleBlockUser = () => {
    Alert.alert('Block User', 'Are you sure you want to block this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => {} },
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
            <Text style={[styles.senderName, { color: isDark ? '#888' : '#666' }]}>{item.senderName}</Text>
          )}
          <View style={[
            styles.messageBubble,
            isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther,
            { backgroundColor: isOwn ? '#4F46E5' : (isDark ? '#2a2a2a' : '#f0f0f0') }
          ]}>
            {item.type === 'image' && item.imageUrl && (
              <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
            )}
            {item.type === 'text' && (
              <Text style={[
                styles.messageText,
                { color: isOwn ? '#fff' : (isDark ? '#fff' : '#000') }
              ]}>
                {item.content}
              </Text>
            )}
            {item.type === 'task' && (
              <View style={styles.taskMessageCard}>
                <Text style={[styles.taskMessageTitle, { color: isDark ? '#fff' : '#000' }]}>{item.taskTitle}</Text>
                <Text style={[styles.taskMessageBudget, { color: isOwn ? '#fff' : '#4F46E5' }]}>{item.taskBudget}</Text>
              </View>
            )}
            {item.type === 'location' && (
              <View style={styles.locationMessageCard}>
                <MaterialCommunityIcons name="map-marker" size={20} color={isOwn ? '#fff' : '#4F46E5'} />
                <Text style={[styles.locationMessageText, { color: isOwn ? '#fff' : (isDark ? '#ddd' : '#333') }]}>
                  {item.locationName || 'Shared Location'}
                </Text>
              </View>
            )}
            {showTime && (
              <Text style={[
                styles.messageTime,
                { color: isOwn ? '#fff8' : (isDark ? '#888' : '#999') }
              ]}>
                {formatTime(item.createdAt)}
                {isOwn && item.status && (
                  <MaterialCommunityIcons 
                    name={item.status === 'read' ? 'check-all' : 'check'} 
                    size={12} 
                    color={item.status === 'read' ? '#4F46E5' : '#fff8'}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Chat</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.authPrompt, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <MaterialCommunityIcons name="message-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Sign in to Chat</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Log in to start messaging</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerUser} onPress={handleViewProfile}>
            <View style={styles.headerAvatar}>
              {currentConversation?.otherUser?.avatar ? (
                <Image source={{ uri: currentConversation.otherUser.avatar }} style={styles.headerAvatarImage} />
              ) : (
                <Text style={styles.headerAvatarText}>{currentConversation?.otherUser?.name?.charAt(0).toUpperCase()}</Text>
              )}
              {currentConversation?.otherUser?.isOnline && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <View style={styles.headerUserInfo}>
              <Text style={[styles.headerUserName, { color: isDark ? '#fff' : '#000' }]}>
                {currentConversation?.otherUser?.name || 'Loading...'}
              </Text>
              <Text style={[styles.headerUserStatus, { color: isDark ? '#888' : '#666' }]}>
                {currentConversation?.otherUser?.isOnline ? 'Online' : `Last seen ${formatRelativeTime(currentConversation?.otherUser?.lastSeen)}`}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <Ionicons name="more-vert-outline" size={28} color={isDark ? '#fff' : '#000'} />
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
          <View style={[styles.emptyMessages, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
            <Ionicons name="chatbubble-outline" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyMessagesText, { color: isDark ? '#fff' : '#000' }]}>No messages yet</Text>
            <Text style={[styles.emptyMessagesSubtext, { color: isDark ? '#888' : '#666' }]}>Start the conversation!</Text>
          </View>
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainerWrapper}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.inputActions}>
            <TouchableOpacity onPress={handleImagePick}>
              <Ionicons name="image-outline" size={24} color={isDark ? '#888' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLocationShare}>
              <MaterialCommunityIcons name="map-marker-outline" size={24} color={isDark ? '#888' : '#666'} />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
            <TextInput
              style={styles.textInput}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor={isDark ? '#888' : '#999'}
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
              { backgroundColor: messageText.trim() ? '#4F46E5' : (isDark ? '#333' : '#ddd') }
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? (
              <Ionicons name="refresh" size={22} color="#fff" style={styles.spinning} />
            ) : (
              <Ionicons name="send-outline" size={22} color={messageText.trim() ? '#fff' : (isDark ? '#666' : '#999')} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Options Modal */}
      {showOptions && (
        <View style={styles.modalOverlay} onTouchStart={() => setShowOptions(false)}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <TouchableOpacity style={styles.modalItem} onPress={handleCall}>
              <Ionicons name="call-outline" size={24} color={isDark ? '#fff' : '#000'} style={styles.modalIcon} />
              <Text style={[styles.modalItemText, { color: isDark ? '#fff' : '#000' }]}>Voice Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={handleVideoCall}>
              <Ionicons name="videocam-outline" size={24} color={isDark ? '#fff' : '#000'} style={styles.modalIcon} />
              <Text style={[styles.modalItemText, { color: isDark ? '#fff' : '#000' }]}>Video Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={handleViewProfile}>
              <MaterialCommunityIcons name="account-outline" size={24} color={isDark ? '#fff' : '#000'} style={styles.modalIcon} />
              <Text style={[styles.modalItemText, { color: isDark ? '#fff' : '#000' }]}>View Profile</Text>
            </TouchableOpacity>
            <View style={[styles.modalDivider, { backgroundColor: isDark ? '#444' : '#eee' }]} />
            <TouchableOpacity style={styles.modalItem} onPress={handleClearChat}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" style={styles.modalIcon} />
              <Text style={{ color: '#EF4444', fontSize: 16, fontFamily: 'Inter_500Medium' }}>Clear Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={handleBlockUser}>
              <MaterialCommunityIcons name="account-off-outline" size={24} color="#EF4444" style={styles.modalIcon} />
              <Text style={{ color: '#EF4444', fontSize: 16, fontFamily: 'Inter_500Medium' }}>Block User</Text>
            </TouchableOpacity>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  headerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  headerAvatarImage: { width: '100%', height: '100%' },
  headerAvatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },
  headerUserInfo: { flex: 1 },
  headerUserName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  headerUserStatus: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  messagesContent: { padding: 16, paddingBottom: 20 },
  messageContainer: { flexDirection: 'row', marginBottom: 8 },
  avatarWrapper: { width: 36, marginRight: 8, marginTop: 4 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  messageWrapper: { flex: 1, maxWidth: '75%' },
  messageWrapperOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  senderName: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 2, marginLeft: 4 },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  messageBubbleOwn: { borderBottomRightRadius: 4 },
  messageBubbleOther: { borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  messageTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'right' },
  messageImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 4 },
  taskMessageCard: { backgroundColor: '#fff2', padding: 12, borderRadius: 10, marginTop: 4 },
  taskMessageTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  taskMessageBudget: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  locationMessageCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff2', padding: 12, borderRadius: 10, marginTop: 4 },
  locationMessageText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyMessages: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyMessagesText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16 },
  emptyMessagesSubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8 },
  inputContainerWrapper: { flex: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eee', gap: 8 },
  inputActions: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  inputWrapper: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, maxHeight: 120 },
  textInput: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#000' },
  sendButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sendButtonActive: {},
  sendButtonInactive: {},
  spinning: { animation: 'spin 1s linear infinite' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0008', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 8 },
  modalItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  modalIcon: { width: 28, marginRight: 16 },
  modalItemText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  modalDivider: { height: 1, marginHorizontal: 20 },
  modalCancel: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  modalCancelText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#4F46E5' },
});