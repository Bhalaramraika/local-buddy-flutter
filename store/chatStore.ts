/**
 * Chat Store - Zustand
 * Real-time chat state management with Supabase subscriptions
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import {
  Chat,
  Message,
  MessageType,
  ChatParticipant,
  PaginatedResponse
} from '@/types';
import { apiGet, apiPost, apiDelete } from '@/services/api';

// Conversation view-model expected by the chat-detail screen
export interface ConversationView {
  id: string;
  taskId?: string;
  otherUser?: {
    id: string;
    name?: string;
    avatar?: string;
    phone?: string;
    isOnline?: boolean;
    lastSeen?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

// Build the conversation view-model from a Chat (best-effort other-user)
function chatToConversation(chat: Chat): ConversationView {
  const other = (chat.participants || [])[0] as any;
  return {
    id: chat.id,
    taskId: chat.taskId,
    otherUser: other
      ? {
          id: other.id,
          name: other.name,
          avatar: other.avatar,
          phone: other.phone,
          isOnline: other.isOnline,
          lastSeen: other.lastSeen,
        }
      : undefined,
    lastMessage: chat.lastMessage,
    unreadCount: chat.unreadCount ?? 0,
    updatedAt: chat.updatedAt ?? '',
  };
}

interface ChatState {
  // State
  chats: Chat[];
  currentChat: Chat | null;
  currentConversation: ConversationView | null;
  users: any[]; // directory of users for the new-chat screen
  messages: Record<string, Message[]>; // chatId -> messages
  unreadCounts: Record<string, number>; // chatId -> count
  isLoading: boolean;
  isLoadingMore: boolean;
  isSending: boolean;
  error: string | null;
  
  // Real-time
  isSubscribed: boolean;
  activeSubscriptions: Record<string, any>; // chatId -> subscription
  
  // Typing indicators
  typingUsers: Record<string, string[]>; // chatId -> userIds
  
  // Actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
  setCurrentChat: (chat: Chat | null) => void;
  
  setMessages: (chatId: string, messages: Message[]) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, message: Message) => void;
  removeMessage: (chatId: string, messageId: string) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  
  setUnreadCount: (chatId: string, count: number) => void;
  incrementUnreadCount: (chatId: string) => void;
  clearUnreadCount: (chatId: string) => void;
  
  setLoading: (loading: boolean) => void;
  setLoadingMore: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  setSubscribed: (subscribed: boolean) => void;

  // ------------------------------------------------------------
  // Screen-facing API (REST-first; optimistic, non-fatal failures)
  // ------------------------------------------------------------
  createConversation: (participantId: string, taskId?: string) => Promise<Chat | null>;
  sendMessage: (chatId: string, text: string, type?: MessageType | string) => Promise<Message | null>;
  fetchMessages: (chatId: string) => Promise<Message[]>;
  fetchUsers: () => Promise<any[]>;
  markAsRead: (chatId: string | undefined) => void;
  updateChatSettings: (chatId: string | undefined, settings: Record<string, any>) => void;
  leaveGroup: (chatId: string | undefined) => void;
  deleteChat: (chatId: string | undefined) => Promise<void>;
  clearHistory: (chatId: string | undefined) => void;
  clearError: () => void;

  // Real-time handlers
  handleNewMessage: (message: Message) => void;
  handleMessageUpdated: (message: Message) => void;
  handleMessageDeleted: (chatId: string, messageId: string) => void;
  handleChatUpdated: (chat: Chat) => void;
  handleTypingStart: (chatId: string, userId: string) => void;
  handleTypingStop: (chatId: string, userId: string) => void;
  handleReadReceipt: (chatId: string, messageId: string, userId: string) => void;
  
  // Subscription management
  addSubscription: (chatId: string, subscription: any) => void;
  removeSubscription: (chatId: string) => void;
  clearSubscriptions: () => void;
  
  // Computed
  getChatById: (id: string) => Chat | undefined;
  getMessages: (chatId: string) => Message[];
  getUnreadCount: (chatId: string) => number;
  getTotalUnreadCount: () => number;
  getSortedChats: () => Chat[];
  clearAll: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      chats: [],
      currentChat: null,
      currentConversation: null,
      users: [],
      messages: {},
      unreadCounts: {},
      isLoading: false,
      isLoadingMore: false,
      isSending: false,
      error: null,
      isSubscribed: false,
      activeSubscriptions: {},
      typingUsers: {},
      
      // Actions
      setChats: (chats) => set({ chats, isLoading: false, error: null }),
      
      addChat: (chat) => set((state) => ({
        chats: [chat, ...state.chats.filter((c) => c.id !== chat.id)],
      })),
      
      updateChat: (chat) => set((state) => ({
        chats: state.chats.map((c) => c.id === chat.id ? chat : c),
        currentChat: state.currentChat?.id === chat.id ? chat : state.currentChat,
      })),
      
      removeChat: (chatId) => set((state) => ({
        chats: state.chats.filter((c) => c.id !== chatId),
        messages: Object.fromEntries(
          Object.entries(state.messages).filter(([id]) => id !== chatId)
        ),
        unreadCounts: Object.fromEntries(
          Object.entries(state.unreadCounts).filter(([id]) => id !== chatId)
        ),
        currentChat: state.currentChat?.id === chatId ? null : state.currentChat,
      })),
      
      setCurrentChat: (currentChat) => set({
        currentChat,
        currentConversation: currentChat ? chatToConversation(currentChat) : null,
      }),
      
      setMessages: (chatId, messages) => set((state) => ({
        messages: { ...state.messages, [chatId]: messages },
      })),
      
      addMessage: (chatId, message) => set((state) => {
        const existingMessages = state.messages[chatId] || [];
        // Avoid duplicates
        if (existingMessages.some((m) => m.id === message.id)) {
          return state;
        }
        return {
          messages: {
            ...state.messages,
            [chatId]: [...existingMessages, message].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
          },
          // Update chat's last message
          chats: state.chats.map((c) => 
            c.id === chatId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c
          ),
        };
      }),
      
      updateMessage: (chatId, message) => set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: (state.messages[chatId] || []).map((m) => 
            m.id === message.id ? message : m
          ),
        },
        // Update chat's last message if it's the latest
        chats: state.chats.map((c) => 
          c.id === chatId && c.lastMessage?.id === message.id 
            ? { ...c, lastMessage: message } 
            : c
        ),
      })),
      
      removeMessage: (chatId, messageId) => set((state) => ({
        messages: {
          ...state.messages,
          [chatId]: (state.messages[chatId] || []).filter((m) => m.id !== messageId),
        },
      })),
      
      prependMessages: (chatId, messages) => set((state) => {
        const existingMessages = state.messages[chatId] || [];
        const newMessages = messages.filter(
          (m) => !existingMessages.some((em) => em.id === m.id)
        );
        return {
          messages: {
            ...state.messages,
            [chatId]: [...newMessages, ...existingMessages].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            ),
          },
        };
      }),
      
      setUnreadCount: (chatId, count) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [chatId]: count },
        chats: state.chats.map((c) => 
          c.id === chatId ? { ...c, unreadCount: count } : c
        ),
      })),
      
      incrementUnreadCount: (chatId) => set((state) => {
        const current = state.unreadCounts[chatId] || 0;
        return {
          unreadCounts: { ...state.unreadCounts, [chatId]: current + 1 },
          chats: state.chats.map((c) => 
            c.id === chatId ? { ...c, unreadCount: c.unreadCount + 1 } : c
          ),
        };
      }),
      
      clearUnreadCount: (chatId) => set((state) => ({
        unreadCounts: { ...state.unreadCounts, [chatId]: 0 },
        chats: state.chats.map((c) => 
          c.id === chatId ? { ...c, unreadCount: 0 } : c
        ),
      })),
      
      setLoading: (isLoading) => set({ isLoading, error: isLoading ? null : get().error }),
      
      setLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
      
      setSending: (isSending) => set({ isSending }),
      
      setError: (error) => set({ error, isLoading: false, isLoadingMore: false, isSending: false }),
      
      setSubscribed: (isSubscribed) => set({ isSubscribed }),

      // ------------------------------------------------------------
      // Screen-facing API. REST first; the Firestore subscription
      // re-syncs authoritative data. Failures are non-fatal.
      // ------------------------------------------------------------

      createConversation: async (participantId, taskId) => {
        // Reuse an existing 1:1 chat if present
        const existing = get().chats.find(
          (c) => !c.isGroup && (c.participants || []).some((p: any) => p.id === participantId)
        );
        if (existing) {
          get().setCurrentChat(existing);
          return existing;
        }

        try {
          const data = await apiPost<any>('/chats', { participantId, taskId });
          const raw = data?.chat ?? data;
          if (raw && raw.id) {
            const chat: Chat = {
              id: raw.id,
              taskId: raw.taskId ?? taskId,
              participants: (raw.participants ?? [participantId]).map((p: any) =>
                typeof p === 'string' ? ({ id: p, name: '' } as any) : p
              ),
              unreadCount: 0,
              isGroup: raw.isGroup ?? false,
              createdAt: raw.createdAt ?? new Date().toISOString(),
              updatedAt: raw.updatedAt ?? new Date().toISOString(),
            } as Chat;
            get().addChat(chat);
            get().setCurrentChat(chat);
            return chat;
          }
        } catch (error) {
          console.warn('[ChatStore] createConversation remote failed (local fallback):', error);
        }

        // Optimistic local conversation — keeps navigation working offline
        const chat = {
          id: `local-${Date.now()}`,
          taskId,
          participants: [{ id: participantId, name: '' }],
          unreadCount: 0,
          isGroup: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as unknown as Chat;
        get().addChat(chat);
        get().setCurrentChat(chat);
        return chat;
      },

      sendMessage: async (chatId, text, type = 'text') => {
        if (!text?.trim()) return null;
        set({ isSending: true, error: null });

        const tempId = `local-${Date.now()}`;
        const optimistic = {
          id: tempId,
          chatId,
          senderId: 'current-user',
          senderName: 'You',
          type,
          content: text,
          createdAt: new Date().toISOString(),
          isRead: true,
        } as unknown as Message;
        get().addMessage(chatId, optimistic);

        try {
          const data = await apiPost<any>(`/chats/${chatId}/messages`, { text, type });
          const raw = data?.message ?? data;
          if (raw && raw.id) {
            const serverMessage = {
              id: raw.id,
              chatId,
              senderId: raw.senderId ?? 'current-user',
              senderName: raw.senderName ?? 'You',
              senderAvatar: raw.senderAvatar,
              type: raw.type ?? type,
              content: raw.text ?? raw.content ?? text,
              metadata: raw.metadata,
              createdAt: raw.timestamp ?? raw.createdAt ?? new Date().toISOString(),
              isRead: true,
            } as unknown as Message;
            get().removeMessage(chatId, tempId);
            get().addMessage(chatId, serverMessage);
            set({ isSending: false });
            return serverMessage;
          }
        } catch (error) {
          // Backend may reject (e.g. local chat) — keep the optimistic copy.
          console.warn('[ChatStore] sendMessage remote failed (optimistic kept):', error);
        }
        set({ isSending: false });
        return optimistic;
      },

      fetchMessages: async (chatId) => {
        set({ isLoading: true, error: null });
        // Ensure the header (currentConversation) is populated
        const chat = get().getChatById(chatId);
        if (chat) get().setCurrentChat(chat);

        try {
          const data = await apiGet<any>(`/chats/${chatId}/messages`, {
            params: { limit: 200 },
          });
          const raw: any[] = data?.messages ?? data?.data ?? [];
          const messages: Message[] = raw.map((m: any) => ({
            id: m.id,
            chatId,
            senderId: m.senderId ?? '',
            senderName: m.senderName ?? '',
            senderAvatar: m.senderAvatar,
            type: m.type ?? 'text',
            content: m.text ?? m.content ?? '',
            metadata: m.metadata,
            createdAt: m.timestamp ?? m.createdAt ?? '',
            isRead: m.isRead ?? false,
          })) as unknown as Message[];
          get().setMessages(chatId, messages);
        } catch (error) {
          console.warn('[ChatStore] fetchMessages failed:', error);
        }
        set({ isLoading: false });
        return get().messages[chatId] || [];
      },

      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiGet<any>('/users', { params: { limit: 50 } });
          const users = data?.users ?? data?.data ?? [];
          set({ users: Array.isArray(users) ? users : [], isLoading: false });
        } catch (error) {
          console.warn('[ChatStore] fetchUsers failed:', error);
          set({ isLoading: false });
        }
        return get().users;
      },

      markAsRead: (chatId) => {
        if (!chatId) return;
        get().clearUnreadCount(chatId);
        apiPost(`/chats/${chatId}/read`).catch((error) => {
          console.warn('[ChatStore] markAsRead failed:', error);
        });
      },

      updateChatSettings: (chatId, settings) => {
        if (!chatId) return;
        const chat = get().getChatById(chatId);
        if (chat) {
          get().updateChat({ ...chat, ...settings } as Chat);
        }
      },

      leaveGroup: (chatId) => {
        if (!chatId) return;
        get().removeChat(chatId);
      },

      deleteChat: async (chatId) => {
        if (!chatId) return;
        get().removeChat(chatId);
        try {
          await apiDelete(`/chats/${chatId}`);
        } catch (error) {
          console.warn('[ChatStore] deleteChat remote failed (local kept):', error);
        }
      },

      clearHistory: (chatId) => {
        if (!chatId) return;
        get().setMessages(chatId, []);
      },

      clearError: () => set({ error: null }),

      // Real-time handlers
      handleNewMessage: (message) => {
        const { chats, currentChat } = get();
        const chatId = message.chatId;
        
        // Add message to store
        get().addMessage(chatId, message);
        
        // Update unread count if not current chat
        if (currentChat?.id !== chatId) {
          get().incrementUnreadCount(chatId);
        }
        
        // Update chat list order (move to top)
        const chatIndex = chats.findIndex((c) => c.id === chatId);
        if (chatIndex > 0) {
          const updatedChats = [...chats];
          const [chat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift({ ...chat, lastMessage: message, updatedAt: message.createdAt });
          set({ chats: updatedChats });
        }
      },
      
      handleMessageUpdated: (message) => {
        get().updateMessage(message.chatId, message);
      },
      
      handleMessageDeleted: (chatId, messageId) => {
        get().removeMessage(chatId, messageId);
      },
      
      handleChatUpdated: (chat) => {
        get().updateChat(chat);
      },
      
      handleTypingStart: (chatId, userId) => set((state) => {
        const users = state.typingUsers[chatId] || [];
        if (!users.includes(userId)) {
          return {
            typingUsers: { ...state.typingUsers, [chatId]: [...users, userId] },
          };
        }
        return state;
      }),
      
      handleTypingStop: (chatId, userId) => set((state) => {
        const users = state.typingUsers[chatId] || [];
        return {
          typingUsers: { 
            ...state.typingUsers, 
            [chatId]: users.filter((id) => id !== userId) 
          },
        };
      }),
      
      handleReadReceipt: (chatId, messageId, userId) => set((state) => {
        const messages = state.messages[chatId] || [];
        return {
          messages: {
            ...state.messages,
            [chatId]: messages.map((m) => 
              m.id === messageId 
                ? { ...m, status: 'read' as const } 
                : m
            ),
          },
        };
      }),
      
      // Subscription management
      addSubscription: (chatId, subscription) => set((state) => ({
        activeSubscriptions: { ...state.activeSubscriptions, [chatId]: subscription },
      })),
      
      removeSubscription: (chatId) => set((state) => {
        const { [chatId]: removed, ...rest } = state.activeSubscriptions;
        return { activeSubscriptions: rest };
      }),
      
      clearSubscriptions: () => set({ activeSubscriptions: {} }),
      
      // Computed
      getChatById: (id) => get().chats.find((c) => c.id === id),
      
      getMessages: (chatId) => get().messages[chatId] || [],
      
      getUnreadCount: (chatId) => get().unreadCounts[chatId] || 0,
      
      getTotalUnreadCount: () => 
        Object.values(get().unreadCounts).reduce((sum, count) => sum + count, 0),
      
      getSortedChats: () => 
        [...get().chats].sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
      
      clearAll: () => set({
        chats: [],
        currentChat: null,
        currentConversation: null,
        users: [],
        messages: {},
        unreadCounts: {},
        isLoading: false,
        isLoadingMore: false,
        isSending: false,
        error: null,
        isSubscribed: false,
        activeSubscriptions: {},
        typingUsers: {},
      }),
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        // Only persist chat list and unread counts, not messages
        chats: state.chats,
        unreadCounts: state.unreadCounts,
      }),
    }
  )
);

// Selectors
export const selectChats = (state: ChatState) => state.chats;
export const selectCurrentChat = (state: ChatState) => state.currentChat;
export const selectMessages = (chatId: string) => (state: ChatState) => state.messages[chatId] || [];
export const selectUnreadCount = (chatId: string) => (state: ChatState) => state.unreadCounts[chatId] || 0;
export const selectTotalUnreadCount = (state: ChatState) => 
  Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0);
export const selectChatLoading = (state: ChatState) => state.isLoading;
export const selectChatSending = (state: ChatState) => state.isSending;
export const selectChatError = (state: ChatState) => state.error;
export const selectTypingUsers = (chatId: string) => (state: ChatState) => state.typingUsers[chatId] || [];
export const selectSortedChats = (state: ChatState) => state.getSortedChats();