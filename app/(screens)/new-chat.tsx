/**
 * New Chat Screen - Start a new conversation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, CachedImage } from '@/components/ui';

export default function NewChatScreen() {
  const router = useRouter();
  const { 
    users, 
    fetchUsers, 
    createConversation,
    isLoading: usersLoading,
  } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

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

  const renderUser = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 340, delay: Math.min(index, 10) * 40 }}
    >
      <Pressable
        style={({ pressed }) => [styles.userItem, pressed && { transform: [{ scale: 0.985 }] }]}
        onPress={() => handleStartChat(item)}
      >
        <View style={styles.userAvatar}>
          {item.avatar ? (
            <CachedImage source={{ uri: item.avatar }} style={styles.userAvatarImage} />
          ) : (
            <Text style={styles.userAvatarText}>{item.name?.charAt(0).toUpperCase()}</Text>
          )}
          {item.isOnline ? <View style={styles.onlineIndicator} /> : null}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.userMeta}>
            <Text style={styles.userMetaText}>@{item.username}</Text>
            {item.rating ? (
              <>
                <Text style={styles.userMetaDivider}>·</Text>
                <Feather name="star" size={11} color={Colors.semantic.warning} />
                <Text style={styles.userMetaRating}>{item.rating.toFixed(1)}</Text>
              </>
            ) : null}
          </View>
        </View>
        <View style={styles.chatChip}>
          <Ionicons name="chatbubble-ellipses" size={16} color={Colors.brand.accent} />
        </View>
      </Pressable>
    </MotiView>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="New chat" onBack={() => router.back()} />
        <View style={styles.authPrompt}>
          <View style={styles.authIconWrap}>
            <Ionicons name="chatbubble-ellipses" size={38} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Sign in to chat</Text>
          <Text style={styles.authSubtitle}>Log in to start messaging other users</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="New chat" subtitle="Pick someone to message" onBack={() => router.back()} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Users List */}
      {usersLoading ? (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBadge}>
            <Ionicons name="people" size={28} color={Colors.brand.accent} />
          </View>
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name={searchQuery ? 'search' : 'people-outline'} size={34} color={Colors.brand.accent} />
          </View>
          <Text style={styles.emptyTitle}>{searchQuery ? 'No users found' : 'No users available'}</Text>
          <Text style={styles.emptySubtitle}>{searchQuery ? 'Try a different search term' : 'Check back later to start chatting'}</Text>
        </MotiView>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  searchContainer: { paddingHorizontal: Spacing[5], paddingBottom: Spacing[3] },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], height: 50, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, fontSize: 15, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing[4] },
  loadingBadge: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  listContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[1], paddingBottom: 40 },
  userItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[4], marginBottom: Spacing[3],
    borderRadius: BorderRadius.lg, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  userAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden',
  },
  userAvatarImage: { width: '100%', height: '100%' },
  userAvatarText: { fontSize: 18, fontFamily: Typography.fontFamily.bold, color: '#fff' },
  onlineIndicator: {
    position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7,
    backgroundColor: Colors.semantic.success, borderWidth: 2.5, borderColor: Colors.surface.elevated,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  userMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 2 },
  userMetaText: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  userMetaDivider: { fontSize: 12, color: Colors.border.medium, marginHorizontal: 4 },
  userMetaRating: { fontSize: 12, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  chatChip: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  emptyIconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyTitle: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, textAlign: 'center' },
  emptySubtitle: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  authIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  authTitle: { fontSize: 25, fontFamily: Typography.fontFamily.display, marginTop: Spacing[4], textAlign: 'center', color: Colors.text.primary },
  authSubtitle: { fontSize: 14, fontFamily: Typography.fontFamily.body, marginTop: Spacing[2], textAlign: 'center', color: Colors.text.secondary },
});