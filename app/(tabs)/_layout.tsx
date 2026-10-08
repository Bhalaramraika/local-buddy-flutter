/**
 * Tabs Layout — Soft Floating Pill Navigation (redesigned)
 * Always-visible icon + label tabs inside a floating rounded shell.
 * Active tab gets a filled brand pill; badges for chats/notifications.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated } from 'react-native';
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

function TabButton({
  def, focused, badge, isDark, inactiveColor, onPress,
}: {
  def: TabDef;
  focused: boolean;
  badge: number;
  isDark: boolean;
  inactiveColor: string;
  onPress: () => void;
}) {
  // Pop animation when a tab becomes active
  const scale = React.useRef(new Animated.Value(1)).current;
  React.useEffect(() => {
    if (!focused) return;
    scale.setValue(0.88);
    Animated.spring(scale, { toValue: 1, damping: 11, stiffness: 260, useNativeDriver: true }).start();
  }, [focused, scale]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={`${def.label} tab`}
      style={styles.tabItem}
    >
      <Animated.View
        style={[
          styles.tabPill,
          { transform: [{ scale }] },
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
      </Animated.View>
    </Pressable>
  );
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

  // ---- Sliding active-pill animation ----
  const [shellWidth, setShellWidth] = React.useState(0);
  const slide = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(slide, {
      toValue: state.index,
      damping: 18,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [state.index, slide]);

  const TABS_COUNT = TAB_DEFS.length;
  const SHELL_HPAD = 6;
  const innerWidth = Math.max(0, shellWidth - SHELL_HPAD * 2);
  const tabWidth = innerWidth / TABS_COUNT;
  const translateX = slide.interpolate({
    inputRange: [0, TABS_COUNT - 1],
    outputRange: [0, tabWidth * (TABS_COUNT - 1)],
  });

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
      <View
        style={[styles.shell, { backgroundColor: shellColor, borderColor }]}
        onLayout={(e) => setShellWidth(e.nativeEvent.layout.width)}
      >
        {/* Sliding active background pill */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activePill,
              {
                width: tabWidth - 6,
                left: SHELL_HPAD + 3,
                transform: [{ translateX }],
              },
            ]}
          />
        )}
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
            <TabButton
              key={route.key}
              def={def}
              focused={focused}
              badge={badge}
              isDark={isDark}
              inactiveColor={inactiveColor}
              onPress={onPress}
            />
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
  activePill: {
    position: 'absolute',
    top: 8,
    height: 44,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.brand.primary,
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
