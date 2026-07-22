/**
 * Tabs Route Group Layout
 * Main tab navigator with 5 tabs: Home, Tasks, Chat, Wallet, Profile
 */

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useChatStore } from '@/store/chatStore';

export default function TabsLayout() {
  const { theme, resolvedTheme } = useTheme();
  const { user, isAuthenticated } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { totalUnreadCount } = useChatStore();
  
  const colorScheme = useColorScheme();
  const isDark = resolvedTheme === 'dark';

  // Tab bar active/inactive colors
  const activeColor = isDark ? '#fff' : '#000';
  const inactiveColor = isDark ? '#888' : '#666';

  // Check auth state and redirect if needed
  useEffect(() => {
    if (!isAuthenticated) {
      // Navigation will be handled by the root layout
    }
  }, [isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: isDark ? '#1a1a1a' : '#fff',
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          height: 70,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Inter_600SemiBold',
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
              weight={focused ? '600' : '400'}
            />
          ),
        }}
      />

      {/* Tasks Tab */}
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={size}
              color={color}
              weight={focused ? '600' : '400'}
            />
          ),
          // Badge for active tasks
          tabBarBadge: user?.stats?.activeTasks && user.stats.activeTasks > 0 
            ? user.stats.activeTasks > 99 
              ? '99+' 
              : String(user.stats.activeTasks)
            : undefined,
        }}
      />

      {/* Chat Tab */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={size}
              color={color}
              weight={focused ? '600' : '400'}
            />
          ),
          // Badge for unread messages
          tabBarBadge: totalUnreadCount > 0 
            ? totalUnreadCount > 99 
              ? '99+' 
              : String(totalUnreadCount)
            : undefined,
        }}
      />

      {/* Wallet Tab */}
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'wallet' : 'wallet-outline'}
              size={size}
              color={color}
              weight={focused ? '600' : '400'}
            />
          ),
          // Badge for pending transactions
          tabBarBadge: user?.wallet?.pendingBalance && user.wallet.pendingBalance > 0
            ? '!'
            : undefined,
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
              weight={focused ? '600' : '400'}
            />
          ),
          // Badge for notifications
          tabBarBadge: unreadCount > 0
            ? unreadCount > 99
              ? '99+'
              : String(unreadCount)
            : undefined,
        }}
      />
    </Tabs>
  );
}