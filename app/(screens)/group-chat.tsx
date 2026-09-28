/**
 * Group Chat Screen - Group messaging for task collaboration
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';

export default function GroupChatScreen() {
  const router = useRouter();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { theme } = useUIStore();
  const { messages: messagesMap, sendMessage, fetchMessages, isLoading } = useChatStore();
  const messages = (chatId && messagesMap[chatId]) || [];
  
  const isDark = theme === 'dark';
  const [messageText, setMessageText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessage(chatId!, messageText.trim(), 'text');
    setMessageText('');
    inputRef.current?.blur();
  };

  const handleAttachmentPress = (type: string) => {
    setShowAttachments(false);
    Alert.alert(`${type} attachment`, `${type} attachment feature coming soon`);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const renderMessage = (message: any, index: number) => {
    const isOwn = message.senderId === 'current-user';
    const showDate = index === 0 || formatDate(new Date(messages[index - 1]?.createdAt || message.createdAt)) !== formatDate(new Date(message.createdAt));
    
    return (
      <View key={message.id} style={styles.messageContainer}>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={[styles.dateText, { color: isDark ? '#888' : '#999' }]}>{formatDate(message.createdAt)}</Text>
          </View>
        )}
        
        <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
          {!isOwn && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{message.senderName?.charAt(0) || 'U'}</Text>
            </View>
          )}
          
          <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther, { backgroundColor: isOwn ? '#4F46E5' : (isDark ? '#2a2a2a' : '#fff') }]}>
            {!isOwn && (
              <Text style={[styles.senderName, { color: '#4F46E5' }]}>{message.senderName}</Text>
            )}
            <Text style={[styles.messageText, { color: isOwn ? '#fff' : (isDark ? '#fff' : '#000') }]}>{message.content}</Text>
            <Text style={[styles.messageTime, { color: isOwn ? 'rgba(255,255,255,0.6)' : (isDark ? '#666' : '#999') }]}>{formatTime(message.createdAt)}</Text>
          </View>
          
          {isOwn && <View style={styles.avatarSpacer} />}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Task Group Chat</Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#888' : '#666' }]}>8 members • Active now</Text>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: `/(screens)/chat-settings`, params: { chatId } })}>
          <Ionicons name="people-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={messagesEndRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }, { marginTop: 12 }]}>No messages yet</Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#666' : '#999' }, { marginTop: 4 }]}>Start the conversation!</Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
      </ScrollView>

      {/* Attachment Options */}
      {showAttachments && (
        <View style={[styles.attachmentOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }]}>
          <View style={[styles.attachmentMenu, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            <TouchableOpacity onPress={() => handleAttachmentPress('Photo')} style={styles.attachmentOption}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#4F46E515' }]}>
                <Ionicons name="image-outline" size={24} color="#4F46E5" />
              </View>
              <Text style={[styles.attachmentLabel, { color: isDark ? '#fff' : '#000' }]}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAttachmentPress('Camera')} style={styles.attachmentOption}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="camera-outline" size={24} color="#10B981" />
              </View>
              <Text style={[styles.attachmentLabel, { color: isDark ? '#fff' : '#000' }]}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAttachmentPress('File')} style={styles.attachmentOption}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#F59E0B15' }]}>
                <Ionicons name="document-outline" size={24} color="#F59E0B" />
              </View>
              <Text style={[styles.attachmentLabel, { color: isDark ? '#fff' : '#000' }]}>File</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAttachmentPress('Location')} style={styles.attachmentOption}>
              <View style={[styles.attachmentIcon, { backgroundColor: '#EF444415' }]}>
                <Ionicons name="location-outline" size={24} color="#EF4444" />
              </View>
              <Text style={[styles.attachmentLabel, { color: isDark ? '#fff' : '#000' }]}>Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderTopColor: isDark ? '#333' : '#eee' }]}>
          <TouchableOpacity onPress={() => setShowAttachments(!showAttachments)} style={styles.inputAction}>
            <Ionicons name={showAttachments ? 'close-outline' : 'add-outline'} size={24} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { color: isDark ? '#fff' : '#000' }]}
            placeholder="Message..."
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendMessage}
          />
          
          <TouchableOpacity onPress={handleSendMessage} disabled={!messageText.trim()} style={styles.sendButton}>
            <Ionicons name="send-outline" size={24} color={messageText.trim() ? '#4F46E5' : (isDark ? '#555' : '#ccc')} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  headerSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  dateSeparator: { alignItems: 'center', marginVertical: 16 },
  dateText: { fontSize: 12, fontFamily: 'Inter_500Medium', backgroundColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  messageContainer: { marginBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
  avatarSpacer: { width: 32, flexShrink: 0 },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  messageBubbleOwn: { borderBottomRightRadius: 4 },
  messageBubbleOther: { borderBottomLeftRadius: 4 },
  senderName: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  messageText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  messageTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4, textAlign: 'right' },
  attachmentOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end' },
  attachmentMenu: { flexDirection: 'row', padding: 16, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderTopColor: '#eee' },
  attachmentOption: { alignItems: 'center', gap: 6, flex: 1 },
  attachmentIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  attachmentLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  inputContainer: { paddingBottom: Platform.OS === 'ios' ? 0 : 10 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderTopWidth: 1 },
  inputAction: { padding: 8 },
  textInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f0f0f0', borderRadius: 24, maxHeight: 120, minHeight: 48 },
  sendButton: { padding: 8, marginLeft: 4 },
});