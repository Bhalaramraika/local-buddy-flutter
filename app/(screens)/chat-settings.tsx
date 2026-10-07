/**
 * Chat Settings Screen - Configure chat preferences and settings
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';

// Extracted components to avoid creating them during render
const SettingSection = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => (
  <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginHorizontal: 16, marginTop: 16 }]}>
    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
    {children}
  </View>
);

const SettingItem = ({ title, subtitle, children, onPress, showArrow = true, isDark }: { title: string; subtitle?: string; children?: React.ReactNode; onPress?: () => void; showArrow?: boolean; isDark: boolean }) => (
  <TouchableOpacity 
    style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee' }]}
    onPress={onPress}
  >
    <View style={styles.settingItemLeft}>
      <Text style={[styles.settingTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      {subtitle && <Text style={[styles.settingSubtitle, { color: isDark ? '#888' : '#666' }]}>{subtitle}</Text>}
    </View>
    <View style={styles.settingItemRight}>
      {children}
      {showArrow && <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#666' : '#999'} />}
    </View>
  </TouchableOpacity>
);

const SettingToggle = ({ title, subtitle, value, onValueChange, isDark }: { title: string; subtitle?: string; value: boolean; onValueChange: (value: boolean) => void; isDark: boolean }) => (
  <View style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee' }]}>
    <View style={styles.settingItemLeft}>
      <Text style={[styles.settingTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      {subtitle && <Text style={[styles.settingSubtitle, { color: isDark ? '#888' : '#666' }]}>{subtitle}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#767577', true: '#8B85FF' }}
      thumbColor={isDark ? '#fff' : '#f5f5f5'}
    />
  </View>
);

const DangerItem = ({ title, subtitle, onPress, isDark }: { title: string; subtitle?: string; onPress?: () => void; isDark: boolean }) => (
  <TouchableOpacity 
    style={[styles.settingItem, { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee' }]}
    onPress={onPress}
  >
    <View style={styles.settingItemLeft}>
      <Text style={[styles.settingTitle, { color: '#EF4444' }]}>{title}</Text>
      {subtitle && <Text style={[styles.settingSubtitle, { color: isDark ? '#888' : '#666' }]}>{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward-outline" size={20} color="#EF4444" />
  </TouchableOpacity>
);

export default function ChatSettingsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { currentChat, updateChatSettings, leaveGroup, deleteChat, clearHistory } = useChatStore();
  
  const isDark = theme === 'dark';
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
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderBottomColor: isDark ? '#333' : '#eee' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Chat Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chat Info */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginHorizontal: 16, marginTop: 16 }]}>
          <View style={styles.chatInfoHeader}>
            <View style={styles.chatAvatar}>
              <Text style={styles.chatAvatarText}>{currentChat?.name?.charAt(0) || 'G'}</Text>
            </View>
            <View style={styles.chatInfoDetails}>
              <Text style={[styles.chatName, { color: isDark ? '#fff' : '#000' }]}>{currentChat?.name || 'Group Chat'}</Text>
              <Text style={[styles.chatMembers, { color: isDark ? '#888' : '#666' }]}>{currentChat?.memberCount || 8} members</Text>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <SettingSection title="Notifications" isDark={isDark}>
          <SettingToggle
            title="Message Notifications"
            subtitle="Receive notifications for new messages"
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            isDark={isDark}
          />
          <SettingToggle
            title="Message Preview"
            subtitle="Show message content in notifications"
            value={messagePreview}
            onValueChange={setMessagePreview}
            isDark={isDark}
          />
          <SettingToggle
            title="Sound"
            subtitle="Play sound for new messages"
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            isDark={isDark}
          />
          <SettingToggle
            title="Vibration"
            subtitle="Vibrate on new messages"
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            isDark={isDark}
          />
        </SettingSection>

        {/* Media & Data */}
        <SettingSection title="Media & Data" isDark={isDark}>
          <SettingToggle
            title="Auto-download Media"
            subtitle="Automatically download photos and videos"
            value={autoDownloadMedia}
            onValueChange={setAutoDownloadMedia}
            isDark={isDark}
          />
          <SettingItem
            title="Data Usage"
            subtitle="Manage data usage for media downloads"
            onPress={() => Alert.alert('Data Usage', 'Data usage settings coming soon')}
            isDark={isDark}
          />
          <SettingItem
            title="Storage Usage"
            subtitle="View and manage chat storage"
            onPress={() => Alert.alert('Storage', 'Storage management coming soon')}
            isDark={isDark}
          />
        </SettingSection>

        {/* Privacy */}
        <SettingSection title="Privacy" isDark={isDark}>
          <SettingToggle
            title="Disappearing Messages"
            subtitle="Messages disappear after set duration"
            value={disappearingMessages}
            onValueChange={setDisappearingMessages}
            isDark={isDark}
          />
          {disappearingMessages && (
            <SettingItem
              title="Message Timer"
              subtitle={`Messages disappear after ${disappearingDuration}`}
              onPress={() => Alert.alert('Message Timer', 'Select duration', [
                { text: '24 Hours', onPress: () => setDisappearingDuration('24h') },
                { text: '7 Days', onPress: () => setDisappearingDuration('7d') },
                { text: '90 Days', onPress: () => setDisappearingDuration('90d') },
                { text: 'Cancel', style: 'cancel' },
              ])}
              isDark={isDark}
            />
          )}
          <SettingItem
            title="Block User"
            subtitle="Block messages from specific users"
            onPress={() => Alert.alert('Block User', 'Block user feature coming soon')}
            isDark={isDark}
          />
          <SettingItem
            title="Report Chat"
            subtitle="Report inappropriate content"
            onPress={() => Alert.alert('Report Chat', 'Report feature coming soon')}
            isDark={isDark}
          />
        </SettingSection>

        {/* Group Settings (if group chat) */}
        {currentChat?.isGroup && (
          <SettingSection title="Group Settings" isDark={isDark}>
            <SettingItem
              title="Group Info"
              subtitle="View and edit group details"
              onPress={() => Alert.alert('Group Info', 'Group info editing coming soon')}
              isDark={isDark}
            />
            <SettingItem
              title="Group Members"
              subtitle="Manage group members"
              onPress={() => Alert.alert('Members', 'Member management coming soon')}
              isDark={isDark}
            />
            <SettingItem
              title="Group Permissions"
              subtitle="Control who can send messages, edit info, etc."
              onPress={() => Alert.alert('Permissions', 'Permission settings coming soon')}
              isDark={isDark}
            />
            <SettingItem
              title="Invite Links"
              subtitle="Manage group invite links"
              onPress={() => Alert.alert('Invite Links', 'Invite link management coming soon')}
              isDark={isDark}
            />
          </SettingSection>
        )}

        {/* Danger Zone */}
        <SettingSection title="Danger Zone" isDark={isDark}>
          <DangerItem
            title="Clear Chat History"
            subtitle="Remove all messages from this chat"
            onPress={handleClearHistory}
            isDark={isDark}
          />
          {currentChat?.isGroup ? (
            <DangerItem
              title="Leave Group"
              subtitle="You will no longer receive messages from this group"
              onPress={handleLeaveGroup}
              isDark={isDark}
            />
          ) : (
            <DangerItem
              title="Delete Chat"
              subtitle="Delete this conversation. Remove chat from your chats list"
              onPress={handleDeleteChat}
              isDark={isDark}
            />
          )}
        </SettingSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingTop: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chatInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chatAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#8B85FF', justifyContent: 'center', alignItems: 'center' },
  chatAvatarText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  chatInfoDetails: { flex: 1 },
  chatName: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
  chatMembers: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 2 },
  settingItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  settingItemLeft: { flex: 1 },
  settingItemRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTitle: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  settingSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
});