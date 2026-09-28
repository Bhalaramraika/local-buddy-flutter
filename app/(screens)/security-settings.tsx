/**
 * Security Settings Screen - Account security and authentication settings
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export default function SecuritySettingsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  
  const isDark = theme === 'dark';
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(true);
  const [loginAlerts, setLoginAlerts] = React.useState(true);
  const [sessionTimeout, setSessionTimeout] = React.useState(30);
  const [requirePasswordForPayments, setRequirePasswordForPayments] = React.useState(true);

  const sessions = [
    { id: '1', device: 'iPhone 15 Pro', location: 'San Francisco, CA', lastActive: 'Now', current: true },
    { id: '2', device: 'MacBook Pro', location: 'San Francisco, CA', lastActive: '2 hours ago', current: false },
    { id: '3', device: 'iPad Air', location: 'Los Angeles, CA', lastActive: '1 day ago', current: false },
    { id: '4', device: 'Android Phone', location: 'New York, NY', lastActive: '3 days ago', current: false },
  ];

  const handleRevokeSession = (sessionId: string) => {
    Alert.alert(
      'Revoke Session',
      'Are you sure you want to revoke this session? You will be logged out on that device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: () => Alert.alert('Revoked', 'Session has been revoked.') }
      ]
    );
  };

  const handleRevokeAllSessions = () => {
    Alert.alert(
      'Revoke All Sessions',
      'This will log you out of all devices except this one. You will need to log in again on other devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke All', style: 'destructive', onPress: () => Alert.alert('Done', 'All other sessions have been revoked.') }
      ]
    );
  };

  const handleChangePassword = () => {
    router.push('/(screens)/security-settings');
  };

  const handleSetup2FA = () => {
    Alert.alert(
      'Two-Factor Authentication',
      'Enable 2FA for extra security. You will need to use an authenticator app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable', onPress: () => { setTwoFactorEnabled(true); Alert.alert('Enabled', '2FA has been enabled. Scan the QR code with your authenticator app.'); } }
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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Security</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Password */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Password</Text>
          
          <SettingItem
            title="Change Password"
            description="Update your account password"
            icon="lock-closed-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={handleChangePassword}
            showArrow
          />
          
          <SettingItem
            title="Password Requirements"
            description="View password strength requirements"
            icon="document-text-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => Alert.alert('Password Requirements', '• At least 8 characters\n• Uppercase and lowercase\n• At least one number\n• At least one special character')}
            showArrow
          />
        </View>

        {/* Two-Factor Authentication */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Two-Factor Authentication</Text>
          
          {twoFactorEnabled ? (
            <>
              <View style={[styles.twoFAEnabled, { backgroundColor: isDark ? '#1a1a1a' : '#f0fdf4', borderColor: '#10B981' }]}>
                <View style={styles.twoFAIcon}>
                  <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
                </View>
                <View style={styles.twoFAContent}>
                  <Text style={[styles.twoFATitle, { color: isDark ? '#fff' : '#000' }]}>2FA Enabled</Text>
                  <Text style={[styles.twoFADesc, { color: isDark ? '#888' : '#666' }]}>Your account is protected with two-factor authentication</Text>
                </View>
              </View>
              
              <SettingItem
                title="Backup Codes"
                description="View and download your backup codes"
                icon="key-outline"
                color="#F59E0B"
                isDark={isDark}
                onPress={() => Alert.alert('Backup Codes', 'Your backup codes will be displayed. Save them in a secure place.')}
                showArrow
              />
              
              <SettingItem
                title="Disable 2FA"
                description="Turn off two-factor authentication"
                icon="shield-outline"
                color="#EF4444"
                isDark={isDark}
                onPress={() => Alert.alert('Disable 2FA', 'Are you sure you want to disable 2FA?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Disable', style: 'destructive', onPress: () => { setTwoFactorEnabled(false); Alert.alert('Disabled', '2FA has been disabled.'); } }
                ])}
                showArrow
                destructive
              />
            </>
          ) : (
            <SettingItem
              title="Enable 2FA"
              description="Add an extra layer of security to your account"
              icon="shield-outline"
              color="#4F46E5"
              isDark={isDark}
              onPress={handleSetup2FA}
              showArrow
            />
          )}
        </View>

        {/* Biometric Authentication */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Biometric Authentication</Text>
          
          <SettingToggle
            title="Face ID / Touch ID"
            description="Use biometrics to unlock the app"
            value={biometricEnabled}
            onChange={setBiometricEnabled}
            icon="fingerprint-outline"
            color="#4F46E5"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Require for Payments"
            description="Require biometric authentication for payments"
            value={requirePasswordForPayments}
            onChange={setRequirePasswordForPayments}
            icon="card-outline"
            color="#10B981"
            isDark={isDark}
          />
        </View>

        {/* Login Alerts */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Login Alerts</Text>
          
          <SettingToggle
            title="New Login Alerts"
            description="Get notified when someone logs into your account"
            value={loginAlerts}
            onChange={setLoginAlerts}
            icon="alert-circle-outline"
            color="#EF4444"
            isDark={isDark}
          />
          
          <SettingItem
            title="Login History"
            description="View all recent login activity"
            icon="time-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={() => router.push('/(screens)/security-settings')}
            showArrow
          />
        </View>

        {/* Active Sessions */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Active Sessions</Text>
            <TouchableOpacity onPress={handleRevokeAllSessions}>
              <Text style={styles.revokeAllText}>Revoke All</Text>
            </TouchableOpacity>
          </View>
          
          {sessions.map((session) => (
            <View key={session.id} style={styles.sessionItem}>
              <View style={styles.sessionInfo}>
                <View style={[styles.sessionDevice, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <Ionicons name={session.device.includes('iPhone') || session.device.includes('iPad') || session.device.includes('MacBook') ? 'logo-apple' : 'logo-android'} size={24} color={isDark ? '#fff' : '#000'} />
                </View>
                <View>
                  <Text style={[styles.sessionDeviceName, { color: isDark ? '#fff' : '#000' }]}>{session.device}</Text>
                  <Text style={[styles.sessionLocation, { color: isDark ? '#888' : '#666' }]}>{session.location}</Text>
                </View>
              </View>
              <View style={styles.sessionActions}>
                {session.current ? (
                  <View style={styles.currentBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.currentText}>Current</Text>
                  </View>
                ) : (
                  <TouchableOpacity onPress={() => handleRevokeSession(session.id)}>
                    <Text style={styles.revokeText}>Revoke</Text>
                  </TouchableOpacity>
                )}
                <Text style={[styles.sessionTime, { color: isDark ? '#888' : '#666' }]}>{session.lastActive}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Session Timeout */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Session Timeout</Text>
          
          <SettingItem
            title="Auto Logout"
            description={`Log out after ${sessionTimeout} minutes of inactivity`}
            icon="timer-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={() => {
              const options = [5, 15, 30, 60, 120, 0];
              Alert.alert('Session Timeout', 'Select auto-logout time', options.map(opt => ({
                text: opt === 0 ? 'Never' : `${opt} minutes`,
                onPress: () => setSessionTimeout(opt),
              })));
            }}
            showArrow
            trailing={`${sessionTimeout === 0 ? 'Never' : `${sessionTimeout} min`}`}
          />
        </View>

        {/* Security Keys */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Security Keys</Text>
          
          <SettingItem
            title="Manage Security Keys"
            description="Add or remove hardware security keys"
            icon="key-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={() => Alert.alert('Security Keys', 'Connect a hardware security key to add it.')}
            showArrow
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
  destructive = false,
  trailing 
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  revokeAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
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
  twoFAEnabled: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
  },
  twoFAIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#10B98115', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  twoFAContent: { flex: 1 },
  twoFATitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  twoFADesc: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sessionItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sessionInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sessionDevice: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  sessionDeviceName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  sessionLocation: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  sessionActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currentBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currentText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#10B981' },
  revokeText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#EF4444' },
  sessionTime: { fontSize: 13, fontFamily: 'Inter_400Regular' },
});