/**
 * Chat Screen - Messages and conversations
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime } from '@/utils/helpers';

export default function ChatScreen() {
  const router = useRouter();
  const { chats, clearUnreadCount } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isDark = theme === 'dark';

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

  const renderConversation = ({ item }: { item: any }) => {
    const otherUser = item.participants?.find((participant: any) => participant.id !== user?.id) || item.participants?.[0];
    const displayUser = otherUser || { name: item.groupName || 'Conversation', avatar: item.groupAvatar, isOnline: false };

    return (
    <TouchableOpacity
      style={[styles.conversationCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
      onPress={() => {
        router.push(`/(screens)/chat-detail/${item.id}`);
        if (item.unreadCount > 0) {
          clearUnreadCount(item.id);
        }
      }}
    >
      <View style={styles.conversationAvatar}>
        {displayUser.avatar ? (
          <Image source={{ uri: displayUser.avatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitial}>{displayUser.name.charAt(0)}</Text>
        )}
        {displayUser.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={[styles.conversationName, { color: isDark ? '#fff' : '#000' }]}>{displayUser.name}</Text>
          <Text style={[styles.conversationTime, { color: isDark ? '#888' : '#666' }]}>{formatRelativeTime(item.lastMessage?.createdAt || item.updatedAt)}</Text>
        </View>
        <View style={styles.conversationPreview}>
          {item.unreadCount > 0 && (
            <View style={styles.unreadDot} />
          )}
          <Text style={[styles.conversationLastMessage, { color: isDark ? '#aaa' : '#666' }]} numberOfLines={1}>
            {item.lastMessage?.senderId === user?.id ? 'You: ' : ''}{item.lastMessage?.content || 'No messages yet'}
          </Text>
        </View>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.authPrompt}>
          <MaterialCommunityIcons name="message-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Messages</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Sign in to chat with buddies and task posters</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Messages</Text>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(screens)/new-chat')}>
            <Ionicons name="chatbubble-outline" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDark ? '#888' : '#999'}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-outline" size={20} color={isDark ? '#888' : '#666'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <MaterialCommunityIcons name="message-outline" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#000' }]}>No conversations yet</Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#888' : '#666' }]}>Start a conversation with a buddy or task poster</Text>
            <TouchableOpacity style={styles.newChatButton} onPress={() => router.push('/(screens)/new-chat')}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.newChatButtonText}>New Chat</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  headerButton: { padding: 4 },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 8 },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  listContent: { paddingBottom: 20 },
  conversationCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  conversationAvatar: { position: 'relative', width: 56, height: 56, borderRadius: 28, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarInitial: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },
  conversationContent: { flex: 1, minWidth: 0 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  conversationName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  conversationTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  conversationPreview: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  conversationLastMessage: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, marginLeft: 8 },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, marginTop: 40 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  newChatButton: { marginTop: 20, backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  newChatButtonText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
});