/**
 * Chat Screen — Soft Modern
 * Cream canvas, Playfair headline, pill search,
 * white conversation cards with cocoa avatars + orange unread badges.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton } from '@/components/ui';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/utils/helpers';

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chats, clearUnreadCount } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
    }
  }, [isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const filteredConversations = (chats || []).filter(conv =>
    conv.participants?.some((participant) => participant.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item, index }: { item: any; index: number }) => {
    const otherUser = item.participants?.find((participant: any) => participant.id !== user?.id) || item.participants?.[0];
    const displayUser = otherUser || { name: item.groupName || 'Conversation', avatar: item.groupAvatar, isOnline: false };

    return (
      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 360, delay: Math.min(index, 8) * 50 }}
      >
        <Pressable
          style={({ pressed }) => [styles.conversationCard, pressed && { transform: [{ scale: 0.985 }] }]}
          onPress={() => {
            // Group conversations open the group view (member list, group
            // actions); 1:1 conversations open the regular chat thread.
            if (item.isGroup) {
              router.push({ pathname: `/(screens)/group-chat`, params: { chatId: item.id } });
            } else {
              router.push({ pathname: `/(screens)/chat-detail`, params: { conversationId: item.id } });
            }
            if (item.unreadCount > 0) {
              clearUnreadCount(item.id);
            }
          }}
        >
          <View style={styles.conversationAvatar}>
            {displayUser.avatar ? (
              <Image source={{ uri: displayUser.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{(displayUser.name || 'C').charAt(0).toUpperCase()}</Text>
            )}
            {displayUser.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationName} numberOfLines={1}>{displayUser.name}</Text>
              <Text style={styles.conversationTime}>{formatRelativeTime(item.lastMessage?.createdAt || item.updatedAt)}</Text>
            </View>
            <View style={styles.conversationPreview}>
              <Text style={styles.conversationLastMessage} numberOfLines={1}>
                {item.lastMessage?.senderId === user?.id ? 'You: ' : ''}{item.lastMessage?.content || 'No messages yet'}
              </Text>
            </View>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </MotiView>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450 }}
          style={styles.authPrompt}
        >
          <View style={styles.authIconWrap}>
            <Ionicons name="chatbubbles" size={40} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Messages</Text>
          <Text style={styles.authSubtitle}>Sign in to chat with buddies and task posters</Text>
          <SoftButton label="Sign in" variant="accent" fullWidth={false} icon="arrow-forward" onPress={() => router.push('/login')} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} withGlow />
        </MotiView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSub}>Chats with buddies and posters</Text>
        </View>
        <Pressable style={styles.newChatFab} onPress={() => router.push('/(screens)/new-chat')} accessibilityLabel="New chat">
          <Ionicons name="create-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.muted}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={36} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Start a conversation with a buddy or task poster</Text>
            <SoftButton label="New Chat" variant="accent" icon="add" fullWidth={false} onPress={() => router.push('/(screens)/new-chat')} style={{ paddingHorizontal: Spacing[7], marginTop: Spacing[5] }} withGlow />
          </MotiView>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[5], paddingTop: Spacing[6], paddingBottom: Spacing[4],
  },
  headerTitle: { fontFamily: Typography.fontFamily.display, fontSize: 30, lineHeight: 38, color: Colors.text.primary },
  headerSub: { fontFamily: Typography.fontFamily.body, fontSize: 13, color: Colors.text.secondary, marginTop: 3 },
  newChatFab: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center', ...Shadows.buttonOrange,
  },

  searchContainer: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[3] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], height: 52, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },

  listContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[1], paddingBottom: 120 },

  conversationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[4], marginBottom: Spacing[3], ...Shadows.card,
  },
  conversationAvatar: {
    position: 'relative', width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.brand.primary, justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3],
  },
  avatarImage: { width: 54, height: 54, borderRadius: 27 },
  avatarInitial: { fontSize: 20, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  onlineIndicator: {
    position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.semantic.success, borderWidth: 2.5, borderColor: Colors.surface.elevated,
  },
  conversationContent: { flex: 1, minWidth: 0 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  conversationName: { fontSize: 15.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flex: 1, marginRight: Spacing[2] },
  conversationTime: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  conversationPreview: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  conversationLastMessage: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, flex: 1 },
  unreadBadge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: Colors.brand.accent,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 7, marginLeft: Spacing[2],
  },
  unreadBadgeText: { color: '#FFFFFF', fontSize: 11, fontFamily: Typography.fontFamily.bold },

  emptyState: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8], marginTop: Spacing[14] },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyText: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptySubtext: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center', lineHeight: 20 },

  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  authIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  authTitle: { fontSize: 27, fontFamily: Typography.fontFamily.display, marginTop: Spacing[5], textAlign: 'center', color: Colors.text.primary },
  authSubtitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center', lineHeight: 21 },
});
