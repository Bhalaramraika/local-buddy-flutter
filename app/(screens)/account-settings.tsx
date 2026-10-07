/**
 * Account Settings Screen - Account management settings
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [username, setUsername] = useState(user?.username || '');
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await updateProfile({ email, phone, username });
    setLoading(false);
    Alert.alert('Success', 'Account settings saved successfully!');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.')
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Account Settings</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Profile Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#ddd' : '#333' }]}>Username</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              autoCapitalize="none"
            />
            <Text style={[styles.inputHint, { color: isDark ? '#888' : '#666' }]}>This will be your public handle</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#ddd' : '#333' }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={[styles.inputHint, { color: isDark ? '#888' : '#666' }]}>Used for login and notifications</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: isDark ? '#ddd' : '#333' }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', color: isDark ? '#fff' : '#000' }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            <Text style={[styles.inputHint, { color: isDark ? '#888' : '#666' }]}>Used for SMS verification</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: '#8B85FF' }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={[styles.saveButtonText, { color: '#fff' }]}>{loading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Preferences */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Notification Preferences</Text>
          
          <SettingToggle
            title="Push Notifications"
            description="Receive push notifications for tasks and messages"
            value={pushNotifications}
            onChange={setPushNotifications}
            icon="notifications-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Email Notifications"
            description="Receive email updates about your account and tasks"
            value={emailNotifications}
            onChange={setEmailNotifications}
            icon="mail-outline"
            color="#10B981"
            isDark={isDark}
          />
          
          <SettingToggle
            title="SMS Notifications"
            description="Receive SMS for important account updates"
            value={smsNotifications}
            onChange={setSmsNotifications}
            icon="chatbubble-outline"
            color="#F59E0B"
            isDark={isDark}
          />
        </View>

        {/* Security */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Security</Text>
          
          <SettingItem
            title="Change Password"
            description="Update your account password"
            icon="lock-outline"
            color="#EF4444"
            isDark={isDark}
            onPress={() => router.push('/(screens)/security-settings')}
            showArrow
          />
          
          <SettingToggle
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            value={twoFactor}
            onChange={setTwoFactor}
            icon="shield-outline"
            color="#8B5CF6"
            isDark={isDark}
          />
          
          <SettingItem
            title="Login History"
            description="View recent login activity"
            icon="time-outline"
            color="#8B85FF"
            isDark={isDark}
            onPress={() => router.push('/(screens)/security-settings')}
            showArrow
          />
          
          <SettingItem
            title="Active Sessions"
            description="Manage your active login sessions"
            icon="devices-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => router.push('/(screens)/security-settings')}
            showArrow
          />
        </View>

        {/* Privacy */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Privacy</Text>
          
          <SettingItem
            title="Profile Visibility"
            description="Control who can see your profile"
            icon="person-outline"
            color="#8B85FF"
            isDark={isDark}
            onPress={() => router.push('/(screens)/privacy-settings')}
            showArrow
            trailing="Public"
          />
          
          <SettingItem
            title="Data & Privacy"
            description="Manage your data and privacy settings"
            icon="shield-checkmark-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => router.push('/(screens)/privacy-settings')}
            showArrow
          />
          
          <SettingItem
            title="Blocked Users"
            description="Manage users you've blocked"
            icon="person-remove-outline"
            color="#EF4444"
            isDark={isDark}
            onPress={() => router.push('/blocked-users')}
            showArrow
          />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Danger Zone</Text>
          
          <SettingItem
            title="Delete Account"
            description="Permanently delete your account and all data"
            icon="trash-outline"
            color="#EF4444"
            isDark={isDark}
            onPress={handleDeleteAccount}
            showArrow
            destructive
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const SettingItem = ({ 
  title, 
  description, 
  icon, 
  color, 
  isDark, 
  onPress, 
  showArrow = false, 
  trailing,
  destructive = false 
}: any) => (
  <TouchableOpacity 
    style={[styles.settingItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
    onPress={onPress}
  >
    <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: destructive ? '#EF4444' : (isDark ? '#fff' : '#000') }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    <View style={styles.settingTrailing}>
      {trailing && <Text style={[styles.settingTrailingText, { color: isDark ? '#888' : '#666' }]}>{trailing}</Text>}
      {showArrow && <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#888' : '#999'} />}
    </View>
  </TouchableOpacity>
);

const SettingToggle = ({ 
  title, 
  description, 
  icon, 
  color, 
  isDark, 
  value, 
  onChange 
}: any) => (
  <TouchableOpacity style={[styles.settingItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
    <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#E5E7EB', true: color }}
      thumbColor={isDark ? '#fff' : '#fff'}
    />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  input: { 
    fontSize: 16, 
    fontFamily: 'Inter_400Regular', 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  inputHint: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 6 },
  saveButton: { 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 8 
  },
  saveButtonText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  settingItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  settingIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  settingContent: { flex: 1 },
  settingTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  settingDescription: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  settingTrailing: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingTrailingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});