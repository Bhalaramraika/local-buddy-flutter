/**
 * Tabs Layout — Soft Floating Pill Navigation (redesigned)
 * Always-visible icon + label tabs inside a floating rounded shell.
 * Active tab gets a filled brand pill; badges for chats/notifications.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Typography, Shadows } from '@/constants/design';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useChatStore } from '@/store/chatStore';

type TabDef = {
  route: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
};

const TAB_DEFS: TabDef[] = [
  { route: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { route: 'tasks', label: 'Tasks', icon: 'clipboard', iconOutline: 'clipboard-outline' },
  { route: 'chat', label: 'Chats', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
  { route: 'wallet', label: 'Wallet', icon: 'wallet', iconOutline: 'wallet-outline' },
  { route: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
];

function TabBadge({ count, dark }: { count: number; dark: boolean }) {
  if (!count || count <= 0) return null;
  return (
    <View style={[styles.badge, { borderColor: dark ? Colors.dark.surface.secondary : Colors.surface.elevated }]}>
      <Text style={styles.badgeText} allowFontScaling={false}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

// Structural prop types (expo-router passes @react-navigation/bottom-tabs'
// BottomTabBarProps; typed structurally so no extra type dep is needed).
interface FloatingTabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

function FloatingTabBar({ state, navigation }: FloatingTabBarProps) {
  const { resolvedTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotificationStore();
  const { getTotalUnreadCount } = useChatStore();
  const chatUnread = getTotalUnreadCount();

  const isDark = resolvedTheme === 'dark';
  const shellColor = isDark ? Colors.dark.surface.secondary : Colors.surface.elevated;
  const borderColor = isDark ? Colors.dark.surface.tertiary : Colors.border.light;
  const inactiveColor = isDark ? Colors.dark.text.secondary : Colors.text.muted;

  const badgeFor = (route: string): number => {
    if (route === 'chat') return chatUnread;
    if (route === 'profile') return unreadCount;
    return 0;
  };

  return (
    <View
      style={[
        styles.shellWrap,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.shell, { backgroundColor: shellColor, borderColor }]}>
        {state.routes.map((route, index) => {
          const def = TAB_DEFS.find((t) => t.route === route.name);
          if (!def) return null;
          const focused = state.index === index;
          const badge = badgeFor(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={`${def.label} tab`}
              style={styles.tabItem}
            >
              <View
                style={[
                  styles.tabPill,
                  focused && { backgroundColor: Colors.brand.primary },
                ]}
              >
                <View>
                  <Ionicons
                    name={focused ? def.icon : def.iconOutline}
                    size={21}
                    color={focused ? '#FFFFFF' : inactiveColor}
                  />
                  <TabBadge count={badge} dark={isDark} />
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    { color: focused ? '#FFFFFF' : inactiveColor },
                  ]}
                >
                  {def.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Redirect href="/" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: Platform.OS !== 'ios',
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  shellWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 8,
    marginBottom: 10,
    ...Shadows.floating,
  },
  tabItem: { flex: 1 },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 44,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 6,
  },
  tabLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: 11.5,
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.semantic.error,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeText: {
    fontSize: 9,
    color: Colors.text.inverse,
    fontFamily: Typography.fontFamily.bold,
    includeFontPadding: false,
  },
});
