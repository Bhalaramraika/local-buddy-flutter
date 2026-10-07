/**
 * New Chat Screen - Start a new conversation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function NewChatScreen() {
  const router = useRouter();
  const { 
    users, 
    fetchUsers, 
    createConversation,
    isLoading: usersLoading,
  } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme, showToast } = useUIStore();
  
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, fetchUsers]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.id !== user?.id && (
        (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((u as any).email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [users, searchQuery, user?.id]);

  const handleStartChat = async (targetUser: any) => {
    if (!isAuthenticated) {
      showToast('Please sign in to start a chat', 'error');
      router.push('/login');
      return;
    }

    const conversation = await createConversation(targetUser.id);
    if (conversation) {
      router.push({ pathname: `/(screens)/chat-detail`, params: { conversationId: conversation.id } });
    }
  };

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.userItem}
      onPress={() => handleStartChat(item)}
    >
      <View style={styles.userAvatar}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.userAvatarImage} />
        ) : (
          <Text style={styles.userAvatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
        )}
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
        <View style={styles.userMeta}>
          <Text style={[styles.userMetaText, { color: isDark ? '#888' : '#666' }]}>@{item.username}</Text>
          {item.rating && (
            <>
              <Text style={[styles.userMetaDivider, { color: isDark ? '#555' : '#ddd' }]}>·</Text>
              <Feather name="star" size={12} color="#F59E0B" />
              <Text style={[styles.userMetaText, { color: isDark ? '#fff' : '#000' }]}>{item.rating.toFixed(1)}</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.userActions}>
        <Ionicons name="chatbubble-outline" size={22} color="#8B85FF" />
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>New Chat</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>
        <View style={[styles.authPrompt, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="chatbubble-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Sign in to Chat</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Log in to start messaging other users</Text>
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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>New Chat</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={[styles.searchWrapper, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
          <Ionicons name="search-outline" size={22} color={isDark ? '#888' : '#999'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
            placeholder="Search users..."
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-outline" size={22} color={isDark ? '#888' : '#999'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Users List */}
      {usersLoading ? (
        <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          <Ionicons name="refresh" size={32} color="#8B85FF" />
          <Text style={[styles.loadingText, { color: isDark ? '#fff' : '#000' }]}>Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
          {searchQuery ? (
            <>
              <Ionicons name="search-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>No users found</Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#888' : '#666' }]}>Try a different search term</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="account-group-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>No users available</Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#888' : '#666' }]}>Check back later to start chatting</Text>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
              <Ionicons name="search-outline" size={64} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>No users found</Text>
              <Text style={[styles.emptySubtitle, { color: isDark ? '#888' : '#666' }]}>Try a different search term</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, height: 48 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_400Regular', marginTop: 12 },
  listContent: { padding: 16, paddingBottom: 40 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#8B85FF', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  userAvatarImage: { width: '100%', height: '100%' },
  userAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#fff' },
  userInfo: { flex: 1, marginLeft: 12, minWidth: 0 },
  userName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  userMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  userMetaText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  userMetaDivider: { fontSize: 12 },
  userActions: { marginLeft: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
});