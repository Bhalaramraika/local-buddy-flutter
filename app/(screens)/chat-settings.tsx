/**
 * Chat Settings Screen — Soft Modern
 * Chat hero card, rounded toggle sections, soft-red danger zone.
 * All store actions (leaveGroup / deleteChat / clearHistory) unchanged.
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
import { useChatStore } from '@/store/chatStore';
import { ScreenHeader } from '@/components/ui';

// Extracted components to avoid creating them during render
const SettingSection = ({ title, index, danger, children }: { title: string; index: number; danger?: boolean; children: React.ReactNode }) => (
  <MotiView
    from={{ opacity: 0, translateY: 14 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 400, delay: index * 80 }}
    style={[styles.section, danger && styles.sectionDanger]}
  >
    <Text style={[styles.sectionTitle, danger && { color: Colors.semantic.error }]}>{title}</Text>
    {children}
  </MotiView>
);

const SettingItem = ({ title, subtitle, icon, onPress, last }: { title: string; subtitle?: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; last?: boolean }) => (
  <Pressable
    style={({ pressed }) => [styles.settingItem, last && styles.settingItemLast, pressed && styles.settingItemPressed]}
    onPress={onPress}
  >
    {icon ? (
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={17} color={Colors.brand.accent} />
      </View>
    ) : null}
    <View style={styles.settingItemLeft}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={17} color={Colors.text.muted} />
  </Pressable>
);

const SettingToggle = ({ title, subtitle, icon, value, onValueChange, last }: { title: string; subtitle?: string; icon?: keyof typeof Ionicons.glyphMap; value: boolean; onValueChange: (value: boolean) => void; last?: boolean }) => (
  <View style={[styles.settingItem, last && styles.settingItemLast]}>
    {icon ? (
      <View style={[styles.settingIcon, value && styles.settingIconOn]}>
        <Ionicons name={icon} size={17} color={value ? '#FFFFFF' : Colors.brand.accent} />
      </View>
    ) : null}
    <View style={styles.settingItemLeft}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
      thumbColor="#FFFFFF"
    />
  </View>
);

const DangerItem = ({ title, subtitle, icon, onPress, last }: { title: string; subtitle?: string; icon?: keyof typeof Ionicons.glyphMap; onPress?: () => void; last?: boolean }) => (
  <Pressable
    style={({ pressed }) => [styles.settingItem, last && styles.settingItemLast, pressed && { backgroundColor: Colors.semantic.error + '10', borderRadius: BorderRadius.sm }]}
    onPress={onPress}
  >
    <View style={styles.dangerIcon}>
      <Ionicons name={icon || 'warning-outline'} size={17} color={Colors.semantic.error} />
    </View>
    <View style={styles.settingItemLeft}>
      <Text style={[styles.settingTitle, { color: Colors.semantic.error }]}>{title}</Text>
      {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={17} color={Colors.semantic.error} />
  </Pressable>
);

export default function ChatSettingsScreen() {
  const router = useRouter();
  const { currentChat, leaveGroup, deleteChat, clearHistory } = useChatStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(true);
  const [disappearingMessages, setDisappearingMessages] = useState(false);
  const [disappearingDuration, setDisappearingDuration] = useState<'24h' | '7d' | '90d'>('24h');

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      'Are you sure you want to leave this group? You will no longer receive messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveGroup(currentChat?.id) },
      ]
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      'This will delete the chat history from your device. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteChat(currentChat?.id) },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'This will remove all messages from this chat. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearHistory(currentChat?.id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Chat settings" subtitle="Notifications, media and chat controls" onBack={() => router.back()} />
        {/* Chat hero card */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.heroCard}
        >
          <View style={styles.chatAvatar}>
            <Text style={styles.chatAvatarText}>{(currentChat?.name?.charAt(0) || 'G').toUpperCase()}</Text>
          </View>
          <View style={styles.chatInfoDetails}>
            <Text style={styles.chatName}>{currentChat?.name || 'Group Chat'}</Text>
            <Text style={styles.chatMembers}>{currentChat?.memberCount || 8} members</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
          </View>
        </MotiView>

        {/* Notifications */}
        <SettingSection title="Notifications" index={1}>
          <SettingToggle title="Message Notifications" subtitle="Alerts for new messages" icon="notifications-outline" value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          <SettingToggle title="Message Preview" subtitle="Show content in notifications" icon="eye-outline" value={messagePreview} onValueChange={setMessagePreview} />
          <SettingToggle title="Sound" subtitle="Play a tone on new messages" icon="volume-high-outline" value={soundEnabled} onValueChange={setSoundEnabled} />
          <SettingToggle title="Vibration" subtitle="Vibrate on new messages" icon="phone-portrait-outline" value={vibrationEnabled} onValueChange={setVibrationEnabled} last />
        </SettingSection>

        {/* Media & Data */}
        <SettingSection title="Media & data" index={2}>
          <SettingToggle title="Auto-download Media" subtitle="Download photos and videos automatically" icon="image-outline" value={autoDownloadMedia} onValueChange={setAutoDownloadMedia} />
          <SettingItem title="Data Usage" subtitle="Manage data usage for media" icon="cellular-outline" onPress={() => Alert.alert('Data Usage', 'Data usage settings coming soon')} />
          <SettingItem title="Storage Usage" subtitle="View and manage chat storage" icon="folder-outline" onPress={() => Alert.alert('Storage', 'Storage management coming soon')} last />
        </SettingSection>

        {/* Privacy */}
        <SettingSection title="Privacy" index={3}>
          <SettingToggle title="Disappearing Messages" subtitle="Messages vanish after a set duration" icon="timer-outline" value={disappearingMessages} onValueChange={setDisappearingMessages} />
          {disappearingMessages && (
            <SettingItem
              title="Message Timer"
              subtitle={`Messages disappear after ${disappearingDuration}`}
              icon="hourglass-outline"
              onPress={() => Alert.alert('Message Timer', 'Select duration', [
                { text: '24 Hours', onPress: () => setDisappearingDuration('24h') },
                { text: '7 Days', onPress: () => setDisappearingDuration('7d') },
                { text: '90 Days', onPress: () => setDisappearingDuration('90d') },
                { text: 'Cancel', style: 'cancel' },
              ])}
            />
          )}
          <SettingItem title="Report Chat" subtitle="Report inappropriate content" icon="flag-outline" onPress={() => Alert.alert('Report Chat', 'Report feature coming soon')} last />
        </SettingSection>

        {/* Group Settings (if group chat) */}
        {currentChat?.isGroup ? (
          <SettingSection title="Group settings" index={4}>
            <SettingItem title="Group Info" subtitle="View and edit group details" icon="information-circle-outline" onPress={() => Alert.alert('Group Info', 'Group info editing coming soon')} />
            <SettingItem title="Group Members" subtitle="Manage group members" icon="people-outline" onPress={() => Alert.alert('Members', 'Member management coming soon')} />
            <SettingItem title="Group Permissions" subtitle="Control who can send messages, edit info" icon="key-outline" onPress={() => Alert.alert('Permissions', 'Permission settings coming soon')} />
            <SettingItem title="Invite Links" subtitle="Manage group invite links" icon="link-outline" onPress={() => Alert.alert('Invite Links', 'Invite link management coming soon')} last />
          </SettingSection>
        ) : null}

        {/* Danger Zone */}
        <SettingSection title="Danger zone" index={5} danger>
          <DangerItem title="Clear Chat History" subtitle="Remove all messages from this chat" icon="trash-outline" onPress={handleClearHistory} />
          {currentChat?.isGroup ? (
            <DangerItem title="Leave Group" subtitle="You will no longer receive messages" icon="exit-outline" onPress={handleLeaveGroup} last />
          ) : (
            <DangerItem title="Delete Chat" subtitle="Delete this conversation from your chats" icon="trash-bin-outline" onPress={handleDeleteChat} last />
          )}
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { padding: Spacing[5], paddingBottom: 40 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.lg,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.button,
  },
  chatAvatar: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
  },
  chatAvatarText: { fontSize: 21, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  chatInfoDetails: { flex: 1 },
  chatName: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
  chatMembers: { fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  heroBadge: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },

  section: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[2],
    marginBottom: Spacing[4], ...Shadows.card,
  },
  sectionDanger: { backgroundColor: Colors.semantic.errorSoft, borderColor: Colors.semantic.error + '2E' },
  sectionTitle: {
    fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: Colors.brand.accentPressed,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing[2],
  },

  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  settingItemLast: { borderBottomWidth: 0 },
  settingItemPressed: { backgroundColor: Colors.surface.creamSoft, borderRadius: BorderRadius.sm },
  settingIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  settingIconOn: { backgroundColor: Colors.brand.accent },
  dangerIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  settingItemLeft: { flex: 1 },
  settingTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary },
  settingSubtitle: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
});
