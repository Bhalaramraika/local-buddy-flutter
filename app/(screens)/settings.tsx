/**
 * Settings Screen — Soft Modern
 * White user card, rounded section cards, cream icon chips,
 * soft-red danger zone. The native Stack header carries the title.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ScreenHeader, CachedImage } from '@/components/ui';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, showToast } = useUIStore();

  const isDark = theme === 'dark';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    // The real, double-confirmed deletion flow lives in Account Settings —
    // send the user there instead of faking a "requested" toast.
    router.push('/(screens)/account-settings');
  };

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { icon: 'id-card-outline', label: 'Account Settings', onPress: () => router.push('/(screens)/account-settings') },
        { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/(screens)/edit-profile') },
        { icon: 'shield-checkmark-outline', label: 'KYC Verification', onPress: () => router.push('/(screens)/kyc-status') },
        { icon: 'card-outline', label: 'Referral Program', onPress: () => router.push('/(screens)/referral') },
        { icon: 'trophy-outline', label: 'Achievements', onPress: () => router.push('/(screens)/achievements') },
        { icon: 'stats-chart-outline', label: 'My Stats', onPress: () => router.push('/(screens)/stats') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'moon-outline', label: 'Dark Mode', type: 'switch',
          value: isDark,
          onValueChange: (value: boolean) => setTheme(value ? 'dark' : 'light'),
        },
        { icon: 'notifications-outline', label: 'Notifications', onPress: () => router.push('/(screens)/notifications') },
        { icon: 'language-outline', label: 'Language', onPress: () => router.push('/(screens)/language-settings') },
        { icon: 'location-outline', label: 'Location Settings', onPress: () => router.push('/(screens)/location-settings') },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: 'eye-outline', label: 'Privacy Settings', onPress: () => router.push('/(screens)/privacy-settings') },
        { icon: 'database-outline', label: 'Data Usage', onPress: () => router.push('/(screens)/data-usage') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', onPress: () => router.push('/(screens)/help') },
        { icon: 'chatbubble-ellipses-outline', label: 'Contact Support', onPress: () => router.push('/(screens)/contact-support') },
        { icon: 'document-text-outline', label: 'Terms of Service', onPress: () => router.push('/(screens)/terms') },
        { icon: 'shield-outline', label: 'Privacy Policy', onPress: () => router.push('/(screens)/privacy') },
        { icon: 'flag-outline', label: 'Community Guidelines', onPress: () => router.push('/(screens)/guidelines') },
      ],
    },
    {
      title: 'About',
      items: [
        { icon: 'information-circle-outline', label: 'About Local Buddy', onPress: () => router.push('/(screens)/about') },
        { icon: 'build-outline', label: 'Version 1.0.0', disabled: true },
      ],
    },
  ];

  const renderItem = (item: any) => {
    const isDisabled = item.disabled;
    const iconColor = isDisabled ? Colors.text.muted : Colors.brand.accent;
    const textColor = isDisabled ? Colors.text.muted : Colors.text.primary;

    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && !isDisabled && { backgroundColor: Colors.surface.creamSoft }, isDisabled && styles.itemDisabled]}
        onPress={item.onPress}
        disabled={isDisabled}
      >
        <View style={styles.itemIcon}>
          <Ionicons name={item.icon as any} size={19} color={iconColor} />
        </View>
        <Text style={[styles.itemLabel, { color: textColor }]}>{item.label}</Text>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onValueChange}
            trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
            thumbColor="#FFFFFF"
            disabled={isDisabled}
          />
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <ScreenHeader title="Settings" subtitle="Account, preferences and app controls" onBack={() => router.back()} />
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.userCard}
        >
          <View style={styles.userAvatar}>
            {user?.avatar ? (
              <CachedImage source={{ uri: user.avatar }} style={styles.userAvatarImage} />
            ) : (
              <Text style={styles.userAvatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <Pressable onPress={() => router.push('/(screens)/edit-profile')} style={styles.userEditBtn} hitSlop={8}>
            <Ionicons name="create-outline" size={17} color="#FFFFFF" />
          </Pressable>
        </MotiView>

        {/* Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <MotiView
            key={section.title}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 420, delay: 100 + sectionIndex * 70 }}
            style={[styles.section, { marginTop: sectionIndex === 0 ? Spacing[5] : Spacing[4] }]}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <View key={item.label} style={itemIndex === section.items.length - 1 ? {} : styles.itemDividerWrap}>
                  {renderItem(item)}
                </View>
              ))}
            </View>
          </MotiView>
        ))}

        {/* Danger Zone */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420, delay: 520 }}
          style={[styles.section, { marginTop: Spacing[4], marginBottom: 40 }]}
        >
          <Text style={[styles.sectionTitle, { color: Colors.semantic.error }]}>Danger Zone</Text>
          <View style={styles.dangerContent}>
            <Pressable
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: Colors.semantic.error + '12' }]}
              onPress={handleDeleteAccount}
            >
              <View style={styles.dangerIcon}>
                <Ionicons name="trash-outline" size={19} color={Colors.semantic.error} />
              </View>
              <Text style={styles.dangerLabel}>Delete Account</Text>
            </Pressable>
            <View style={styles.itemDividerWrap} />
            <Pressable
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: Colors.semantic.error + '12' }]}
              onPress={handleLogout}
            >
              <View style={styles.dangerIcon}>
                <Ionicons name="log-out-outline" size={19} color={Colors.semantic.error} />
              </View>
              <Text style={styles.dangerLabel}>Sign Out</Text>
            </Pressable>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: 40 },

  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[4],
    ...Shadows.card,
  },
  userAvatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.brand.primary,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  userAvatarImage: { width: '100%', height: '100%' },
  userAvatarText: { fontSize: 22, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  userEmail: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2 },
  userEditBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center',
  },

  section: {},
  sectionTitle: {
    fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing[2], marginLeft: Spacing[1],
  },
  sectionContent: {
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] + 3, gap: Spacing[3] },
  itemDisabled: { opacity: 0.55 },
  itemIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  itemLabel: { flex: 1, fontSize: 14.5, fontFamily: Typography.fontFamily.medium },
  itemDividerWrap: { borderBottomWidth: 1, borderBottomColor: Colors.border.light, marginLeft: 38 + Spacing[4] + Spacing[3] },

  dangerContent: {
    borderRadius: BorderRadius.lg, overflow: 'hidden',
    backgroundColor: Colors.semantic.errorSoft, borderWidth: 1, borderColor: Colors.semantic.error + '2E',
  },
  dangerIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  dangerLabel: { flex: 1, fontSize: 14.5, fontFamily: Typography.fontFamily.medium, color: Colors.semantic.error },
});
