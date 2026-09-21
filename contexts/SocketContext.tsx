/**
 * Socket Context - Real-time communication with Socket.io
 * Handles chat, task updates, notifications, location sharing
 */

import React, { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useTaskStore } from '@/store/taskStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useLocationStore } from '@/store/locationStore';
import { SOCKET_CONFIG } from '@/config';
import { isMockApiEnabled } from '@/services/api';

interface SocketContextType {
  // State
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Event emitters
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => () => void;
  off: (event: string, callback?: (data: any) => void) => void;
  
  // Chat events
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, message: any) => void;
  markAsRead: (chatId: string, messageId: string) => void;
  typingStart: (chatId: string) => void;
  typingStop: (chatId: string) => void;
  
  // Task events
  joinTask: (taskId: string) => void;
  leaveTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: string) => void;
  submitTaskProof: (taskId: string, proof: any) => void;
  
  // Location events
  shareLocation: (location: { latitude: number; longitude: number }) => void;
  stopSharingLocation: () => void;
  
  // Notification events
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SOCKET_URL = SOCKET_CONFIG.URL;

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, tokens } = useAuthStore();
  const { isSubscribed: storedConnected, setSubscribed: setConnected } = useChatStore();
  
  const [isConnected, setIsConnected] = useState(storedConnected);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 2000;

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    if (isMockApiEnabled || !user || !tokens?.accessToken) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const socket = io(SOCKET_URL, {
        auth: {
          token: tokens.accessToken,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: reconnectDelay,
        timeout: 10000,
        autoConnect: true,
      });
      
      socketRef.current = socket;
      
      // Connection events
      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        setConnected(true);
        
        // Join user's personal room
        socket.emit('join:user', user.id);
        
        // Join active chats
        const { chats } = useChatStore.getState();
        chats.forEach(chat => {
          if (chat.lastMessage) {
            socket.emit('join:chat', chat.id);
          }
        });
        
        // Join active tasks
        const { myTasks } = useTaskStore.getState();
        myTasks.forEach(task => {
          if (task.status === 'in_progress' || task.status === 'assigned') {
            socket.emit('join:task', task.id);
          }
        });
      });
      
      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        setConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          socket.connect();
        }
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionError(error.message);
        setIsConnecting(false);
        setIsConnected(false);
        setConnected(false);
      });
      
      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnect attempt:', attemptNumber);
        reconnectAttemptsRef.current = attemptNumber;
      });
      
      socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setIsConnected(true);
        setConnected(true);
        setConnectionError(null);
        
        // Re-join rooms
        socket.emit('join:user', user.id);
      });
      
      socket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        setConnectionError('Failed to reconnect');
        setIsConnecting(false);
      });
      
      // Chat events
      socket.on('message:new', (message) => {
        useChatStore.getState().addMessage(message);
        
        // Add notification if not in active chat
        const { activeChatId } = useChatStore.getState();
        if (activeChatId !== message.chatId) {
          useNotificationStore.getState().addNotification({
            id: `msg_${message.id}`,
            title: message.senderName || 'New Message',
            body: message.content?.text || 'New message',
            data: { type: 'chat', chatId: message.chatId, messageId: message.id },
            type: 'chat',
            priority: 'normal',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      });
      
      socket.on('message:read', ({ chatId, messageId, userId }) => {
        useChatStore.getState().markMessageAsRead(chatId, messageId);
      });
      
      socket.on('message:deleted', ({ chatId, messageId }) => {
        useChatStore.getState().deleteMessage(chatId, messageId);
      });
      
      socket.on('chat:typing', ({ chatId, userId, userName }) => {
        useChatStore.getState().setTyping(chatId, userId, userName, true);
      });
      
      socket.on('chat:stop_typing', ({ chatId, userId }) => {
        useChatStore.getState().setTyping(chatId, userId, '', false);
      });
      
      socket.on('chat:updated', (chat) => {
        useChatStore.getState().updateChat(chat);
      });
      
      socket.on('chat:deleted', ({ chatId }) => {
        useChatStore.getState().deleteChat(chatId);
      });
      
      // Task events
      socket.on('task:updated', (task) => {
        useTaskStore.getState().updateTask(task);
      });
      
      socket.on('task:assigned', (task) => {
        useTaskStore.getState().addTask(task);
        useNotificationStore.getState().addNotification({
          id: `task_${task.id}`,
          title: 'New Task Assigned',
          body: `You have been assigned: ${task.title}`,
          data: { type: 'task', taskId: task.id },
          type: 'task',
          priority: 'high',
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
      
      socket.on('task:status_changed', ({ taskId, status, updatedBy }) => {
        useTaskStore.getState().updateTaskStatus(taskId, status);
      });
      
      socket.on('task:proof_submitted', ({ taskId, proof }) => {
        useTaskStore.getState().updateTaskProof(taskId, proof);
      });
      
      socket.on('task:completed', ({ taskId, completedBy }) => {
        useTaskStore.getState().updateTaskStatus(taskId, 'completed');
      });
      
      socket.on('task:cancelled', ({ taskId, reason }) => {
        useTaskStore.getState().updateTaskStatus(taskId, 'cancelled');
      });
      
      // Location events
      socket.on('location:buddy_nearby', (buddy) => {
        useLocationStore.getState().addNearbyBuddy(buddy);
      });
      
      socket.on('location:buddy_left', ({ buddyId }) => {
        useLocationStore.getState().removeNearbyBuddy(buddyId);
      });
      
      socket.on('location:geofence_entered', (geofence) => {
        useNotificationStore.getState().addNotification({
          id: `geofence_${geofence.id}`,
          title: 'Geofence Alert',
          body: `You entered ${geofence.name}`,
          data: { type: 'geofence', geofenceId: geofence.id, action: 'enter' },
          type: 'system',
          priority: 'high',
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
      
      socket.on('location:geofence_exited', (geofence) => {
        useNotificationStore.getState().addNotification({
          id: `geofence_exit_${geofence.id}`,
          title: 'Geofence Alert',
          body: `You left ${geofence.name}`,
          data: { type: 'geofence', geofenceId: geofence.id, action: 'exit' },
          type: 'system',
          priority: 'normal',
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
      
      // Notification events
      socket.on('notification:new', (notification) => {
        useNotificationStore.getState().addNotification(notification);
      });
      
      socket.on('notification:read', ({ notificationId }) => {
        useNotificationStore.getState().markAsRead(notificationId);
      });
      
      socket.on('notification:all_read', () => {
        useNotificationStore.getState().markAllAsRead();
      });
      
      // System events
      socket.on('system:maintenance', (data) => {
        useNotificationStore.getState().addNotification({
          id: `maint_${Date.now()}`,
          title: 'Scheduled Maintenance',
          body: data.message,
          data: { type: 'system', ...data },
          type: 'system',
          priority: 'high',
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
      
      socket.on('system:force_update', (data) => {
        useNotificationStore.getState().addNotification({
          id: `update_${Date.now()}`,
          title: 'App Update Required',
          body: data.message,
          data: { type: 'system', action: 'update', ...data },
          type: 'system',
          priority: 'urgent',
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
      
    } catch (error) {
      console.error('Socket initialization error:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      setIsConnecting(false);
    }
  }, [user, tokens, setConnected]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnected(false);
  }, [setConnected]);

  // Reconnect
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000);
  }, [disconnect, connect]);

  // Generic emit
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }, []);

  // Generic on
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
    return () => {};
  }, []);

  // Generic off
  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Chat events
  const joinChat = useCallback((chatId: string) => {
    emit('join:chat', chatId);
  }, [emit]);

  const leaveChat = useCallback((chatId: string) => {
    emit('leave:chat', chatId);
  }, [emit]);

  const sendMessage = useCallback((chatId: string, message: any) => {
    emit('message:send', { chatId, message });
  }, [emit]);

  const markAsRead = useCallback((chatId: string, messageId: string) => {
    emit('message:read', { chatId, messageId });
  }, [emit]);

  const typingStart = useCallback((chatId: string) => {
    emit('chat:typing', { chatId });
  }, [emit]);

  const typingStop = useCallback((chatId: string) => {
    emit('chat:stop_typing', { chatId });
  }, [emit]);

  // Task events
  const joinTask = useCallback((taskId: string) => {
    emit('join:task', taskId);
  }, [emit]);

  const leaveTask = useCallback((taskId: string) => {
    emit('leave:task', taskId);
  }, [emit]);

  const updateTaskStatus = useCallback((taskId: string, status: string) => {
    emit('task:status_update', { taskId, status });
  }, [emit]);

  const submitTaskProof = useCallback((taskId: string, proof: any) => {
    emit('task:proof_submit', { taskId, proof });
  }, [emit]);

  // Location events
  const shareLocation = useCallback((location: { latitude: number; longitude: number }) => {
    emit('location:share', location);
  }, [emit]);

  const stopSharingLocation = useCallback(() => {
    emit('location:stop_share');
  }, [emit]);

  // Notification events
  const markNotificationRead = useCallback((notificationId: string) => {
    emit('notification:read', { notificationId });
  }, [emit]);

  const markAllNotificationsRead = useCallback(() => {
    emit('notification:all_read');
  }, [emit]);

  // Auto-connect when user/tokens change
  useEffect(() => {
    if (user && tokens?.accessToken) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [user, tokens?.accessToken, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, []);

  const value: SocketContextType = {
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    reconnect,
    emit,
    on,
    off,
    joinChat,
    leaveChat,
    sendMessage,
    markAsRead,
    typingStart,
    typingStop,
    joinTask,
    leaveTask,
    updateTaskStatus,
    submitTaskProof,
    shareLocation,
    stopSharingLocation,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

// Hook for connection status
export function useSocketConnection() {
  const { isConnected, isConnecting, connectionError, connect, disconnect, reconnect } = useSocket();
  return { isConnected, isConnecting, connectionError, connect, disconnect, reconnect };
}

// Hook for chat socket events
export function useChatSocket() {
  const { joinChat, leaveChat, sendMessage, markAsRead, typingStart, typingStop } = useSocket();
  return { joinChat, leaveChat, sendMessage, markAsRead, typingStart, typingStop };
}

// Hook for task socket events
export function useTaskSocket() {
  const { joinTask, leaveTask, updateTaskStatus, submitTaskProof } = useSocket();
  return { joinTask, leaveTask, updateTaskStatus, submitTaskProof };
}

// Hook for location socket events
export function useLocationSocket() {
  const { shareLocation, stopSharingLocation } = useSocket();
  return { shareLocation, stopSharingLocation };
}

// Hook for notification socket events
export function useNotificationSocket() {
  const { markNotificationRead, markAllNotificationsRead } = useSocket();
  return { markNotificationRead, markAllNotificationsRead };
}