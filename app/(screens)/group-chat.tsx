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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';

export default function GroupChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { messages: messagesMap, sendMessage, fetchMessages, isLoading } = useChatStore();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const messages = (chatId && messagesMap[chatId]) || [];

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
    const isOwn = !!currentUserId && message.senderId === currentUserId;
    const showDate = index === 0 || formatDate(new Date(messages[index - 1]?.createdAt || message.createdAt)) !== formatDate(new Date(message.createdAt));

    return (
      <View key={message.id} style={styles.messageContainer}>
        {showDate ? (
          <View style={styles.dateSeparator}>
            <View style={styles.datePill}>
              <Text style={styles.dateText}>{formatDate(message.createdAt)}</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
          {!isOwn ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{message.senderName?.charAt(0) || 'U'}</Text>
            </View>
          ) : null}

          <View style={[styles.messageBubble, isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
            {!isOwn ? (
              <Text style={styles.senderName}>{message.senderName}</Text>
            ) : null}
            <Text style={[styles.messageText, { color: isOwn ? '#fff' : Colors.text.primary }]}>{message.content}</Text>
            <Text style={[styles.messageTime, { color: isOwn ? '#FFFFFFA6' : Colors.text.muted }]}>{formatTime(message.createdAt)}</Text>
          </View>

          {isOwn ? <View style={styles.avatarSpacer} /> : null}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* In-page header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerCircleBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={19} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Task group chat</Text>
          <Text style={styles.headerSubtitle}>8 members • Active now</Text>
        </View>
        <TouchableOpacity onPress={() => router.push({ pathname: `/(screens)/chat-settings`, params: { chatId } })} style={styles.headerCircleBtn} hitSlop={8} accessibilityLabel="Group settings">
          <Ionicons name="people" size={17} color={Colors.brand.accent} />
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
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubble-ellipses" size={30} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyDesc}>Start the conversation!</Text>
          </View>
        ) : (
          messages.map((message, index) => renderMessage(message, index))
        )}
      </ScrollView>

      {/* Attachment Options */}
      {showAttachments ? (
        <View style={styles.attachmentOverlay}>
          <MotiView
            from={{ translateY: 80, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: 'timing', duration: 280 }}
            style={styles.attachmentMenu}
          >
            {[
              { type: 'Photo', icon: 'image' as const, color: Colors.brand.accent, bg: Colors.brand.accentSoft },
              { type: 'Camera', icon: 'camera' as const, color: Colors.semantic.success, bg: Colors.semantic.successSoft },
              { type: 'File', icon: 'document' as const, color: Colors.semantic.warning, bg: Colors.semantic.warningSoft },
              { type: 'Location', icon: 'location' as const, color: Colors.semantic.error, bg: Colors.semantic.errorSoft },
            ].map((opt) => (
              <TouchableOpacity key={opt.type} onPress={() => handleAttachmentPress(opt.type)} style={styles.attachmentOption}>
                <View style={[styles.attachmentIcon, { backgroundColor: opt.bg }]}>
                  <Ionicons name={opt.icon} size={22} color={opt.color} />
                </View>
                <Text style={styles.attachmentLabel}>{opt.type}</Text>
              </TouchableOpacity>
            ))}
          </MotiView>
        </View>
      ) : null}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity onPress={() => setShowAttachments(!showAttachments)} style={[styles.inputActionBtn, showAttachments && styles.inputActionBtnActive]} accessibilityLabel="Attachments">
            <Ionicons name={showAttachments ? 'close' : 'add'} size={20} color={showAttachments ? '#FFFFFF' : Colors.brand.accent} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Message..."
            placeholderTextColor={Colors.text.muted}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSendMessage}
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!messageText.trim()}
            style={[styles.sendButton, messageText.trim() ? styles.sendButtonActive : null]}
            accessibilityLabel="Send message"
          >
            <Ionicons name="send" size={17} color={messageText.trim() ? '#FFFFFF' : Colors.text.muted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  headerCircleBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light,
    alignItems: 'center', justifyContent: 'center', ...Shadows.cardPressed,
  },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  headerSubtitle: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[5], flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyTitle: { fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 4 },
  dateSeparator: { alignItems: 'center', marginVertical: Spacing[4] },
  datePill: {
    backgroundColor: Colors.surface.tertiary, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], paddingVertical: 5,
  },
  dateText: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
  messageContainer: { marginBottom: Spacing[2] },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2] },
  messageRowOwn: { flexDirection: 'row-reverse' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  avatarSpacer: { width: 30, flexShrink: 0 },
  messageBubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  messageBubbleOwn: { borderBottomRightRadius: 6, backgroundColor: Colors.brand.primary, ...Shadows.button },
  messageBubbleOther: {
    borderBottomLeftRadius: 6, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.cardPressed,
  },
  senderName: { fontSize: 11.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed, marginBottom: 3 },
  messageText: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, lineHeight: 21 },
  messageTime: { fontSize: 10.5, fontFamily: Typography.fontFamily.body, marginTop: 4, textAlign: 'right' },
  attachmentOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, justifyContent: 'flex-end', backgroundColor: 'rgba(30,18,9,0.35)' },
  attachmentMenu: {
    flexDirection: 'row', paddingVertical: Spacing[5], paddingHorizontal: Spacing[5], gap: Spacing[3],
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    backgroundColor: Colors.surface.elevated, borderTopWidth: 1, borderTopColor: Colors.border.light,
    ...Shadows.floating,
  },
  attachmentOption: { alignItems: 'center', gap: 7, flex: 1 },
  attachmentIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  attachmentLabel: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  inputContainer: { paddingBottom: Platform.OS === 'ios' ? 0 : 10 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing[2],
    paddingHorizontal: Spacing[3], paddingVertical: Spacing[3],
    backgroundColor: Colors.surface.primary, borderTopWidth: 1, borderTopColor: Colors.border.light,
  },
  inputActionBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  inputActionBtnActive: { backgroundColor: Colors.semantic.error },
  textInput: {
    flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary,
    paddingHorizontal: Spacing[4], paddingVertical: 10,
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border.light,
    maxHeight: 120, minHeight: 46,
  },
  sendButton: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface.tertiary },
  sendButtonActive: { backgroundColor: Colors.brand.accent, ...Shadows.buttonOrange },
});