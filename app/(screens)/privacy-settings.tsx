/**
 * Privacy Settings Screen - Privacy and data management settings
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

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  
  const isDark = theme === 'dark';
  const [profileVisibility, setProfileVisibility] = React.useState<'public' | 'friends' | 'private'>('public');
  const [showOnlineStatus, setShowOnlineStatus] = React.useState(true);
  const [showActivity, setShowActivity] = React.useState(true);
  const [allowMessages, setAllowMessages] = React.useState<'everyone' | 'friends' | 'none'>('everyone');
  const [dataCollection, setDataCollection] = React.useState(true);
  const [analytics, setAnalytics] = React.useState(true);
  const [personalizedAds, setPersonalizedAds] = React.useState(false);

  const handleDownloadData = () => {
    Alert.alert('Download Data', 'Your data export will be prepared and sent to your email.');
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete Personal Data',
      'This will permanently delete all your personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted', 'Your personal data has been deleted.') }
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
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Privacy Settings</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Visibility */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Profile Visibility</Text>
          
          <PrivacyOption
            title="Public"
            description="Anyone can see your profile and activity"
            icon="globe-outline"
            color="#10B981"
            selected={profileVisibility === 'public'}
            onPress={() => setProfileVisibility('public')}
            isDark={isDark}
          />
          
          <PrivacyOption
            title="Friends Only"
            description="Only your connections can see your profile"
            icon="people-outline"
            color="#4F46E5"
            selected={profileVisibility === 'friends'}
            onPress={() => setProfileVisibility('friends')}
            isDark={isDark}
          />
          
          <PrivacyOption
            title="Private"
            description="Only you can see your profile"
            icon="lock-closed-outline"
            color="#EF4444"
            selected={profileVisibility === 'private'}
            onPress={() => setProfileVisibility('private')}
            isDark={isDark}
          />
        </View>

        {/* Activity Visibility */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Activity Visibility</Text>
          
          <SettingToggle
            title="Show Online Status"
            description="Let others see when you're online"
            value={showOnlineStatus}
            onChange={setShowOnlineStatus}
            icon="person-outline"
            color="#4F46E5"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Show Activity"
            description="Let others see your recent activity"
            icon="time-outline"
            color="#10B981"
            value={showActivity}
            onChange={setShowActivity}
            isDark={isDark}
          />
        </View>

        {/* Message Permissions */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Message Permissions</Text>
          
          <PrivacyOption
            title="Everyone"
            description="Anyone can send you messages"
            icon="chatbubble-outline"
            color="#10B981"
            selected={allowMessages === 'everyone'}
            onPress={() => setAllowMessages('everyone')}
            isDark={isDark}
          />
          
          <PrivacyOption
            title="Friends Only"
            description="Only your connections can message you"
            icon="people-outline"
            color="#4F46E5"
            selected={allowMessages === 'friends'}
            onPress={() => setAllowMessages('friends')}
            isDark={isDark}
          />
          
          <PrivacyOption
            title="No One"
            description="Nobody can send you direct messages"
            icon="chatbubble-ellipses-outline"
            color="#EF4444"
            selected={allowMessages === 'none'}
            onPress={() => setAllowMessages('none')}
            isDark={isDark}
          />
        </View>

        {/* Data & Analytics */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Data & Analytics</Text>
          
          <SettingToggle
            title="Data Collection"
            description="Allow collection of usage data to improve the app"
            value={dataCollection}
            onChange={setDataCollection}
            icon="analytics-outline"
            color="#4F46E5"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Analytics"
            description="Help us understand how you use the app"
            value={analytics}
            onChange={setAnalytics}
            icon="bar-chart-outline"
            color="#10B981"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Personalized Ads"
            description="Show ads based on your interests and activity"
            value={personalizedAds}
            onChange={setPersonalizedAds}
            icon="megaphone-outline"
            color="#F59E0B"
            isDark={isDark}
          />
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Data Management</Text>
          
          <SettingItem
            title="Download My Data"
            description="Get a copy of all your data"
            icon="download-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={handleDownloadData}
            showArrow
          />
          
          <SettingItem
            title="Delete My Data"
            description="Permanently delete all personal data"
            icon="trash-outline"
            color="#EF4444"
            isDark={isDark}
            onPress={handleDeleteData}
            showArrow
            destructive
          />
        </View>

        {/* Legal Links */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Legal</Text>
          
          <SettingItem
            title="Privacy Policy"
            description="Read our privacy policy"
            icon="document-text-outline"
            color="#4F46E5"
            isDark={isDark}
            onPress={() => router.push('/privacy')}
            showArrow
          />
          
          <SettingItem
            title="Terms of Service"
            description="Read our terms of service"
            icon="document-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => router.push('/terms')}
            showArrow
          />
          
          <SettingItem
            title="Cookie Policy"
            description="Learn about our cookie usage"
            icon="cookie-outline"
            color="#F59E0B"
            isDark={isDark}
            onPress={() => router.push('/cookie-policy')}
            showArrow
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const PrivacyOption = ({ 
  title, 
  description, 
  icon, 
  color, 
  selected, 
  onPress, 
  isDark 
}: any) => (
  <TouchableOpacity 
    style={[styles.privacyOption, { backgroundColor: isDark ? '#2a2a2a' : '#fff', borderColor: selected ? color : '#eee', borderWidth: selected ? 2 : 1 }]}
    onPress={onPress}
  >
    <View style={[styles.privacyIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.privacyContent}>
      <Text style={[styles.privacyTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      <Text style={[styles.privacyDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    {selected && <Ionicons name="checkmark-circle" size={24} color={color} />}
  </TouchableOpacity>
);

const SettingItem = ({ 
  title, 
  description, 
  icon, 
  color, 
  isDark, 
  onPress, 
  showArrow = false, 
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
    {showArrow && <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#888' : '#999'} />}
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
  privacyOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
  },
  privacyIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  privacyContent: { flex: 1 },
  privacyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  privacyDescription: { fontSize: 13, fontFamily: 'Inter_400Regular' },
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
});