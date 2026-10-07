/**
 * Data Usage Screen - Data management, export, and storage
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export default function DataUsageScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  
  const isDark = theme === 'dark';
  const [exporting, setExporting] = React.useState(false);
  const [clearingCache, setClearingCache] = React.useState(false);
  const [storageInfo, setStorageInfo] = React.useState({
    total: '245 MB',
    app: '180 MB',
    cache: '45 MB',
    media: '20 MB',
  });
  const [autoClearCache, setAutoClearCache] = React.useState(false);
  const [offlineMode, setOfflineMode] = React.useState(false);
  const [offlineStorageLimit, setOfflineStorageLimit] = React.useState(5);
  const [lastSynced, setLastSynced] = React.useState('2 minutes ago');
  const [usageAnalytics, setUsageAnalytics] = React.useState(true);
  const [crashReports, setCrashReports] = React.useState(true);
  const [performanceMonitoring, setPerformanceMonitoring] = React.useState(false);

  const handleExportData = async () => {
    setExporting(true);
    Alert.alert('Exporting Data', 'Preparing your data export...');
    setTimeout(() => {
      setExporting(false);
      Alert.alert('Export Ready', 'Your data export is ready. It will be sent to your email.', [
        { text: 'OK', onPress: () => Alert.alert('Sent', 'Export sent to your registered email.') }
      ]);
    }, 2000);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary files and cached images. Your login and settings will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Cache', 
          onPress: () => {
            setClearingCache(true);
            setTimeout(() => {
              setClearingCache(false);
              setStorageInfo(prev => ({ ...prev, cache: '2 MB' }));
              Alert.alert('Cache Cleared', 'Temporary files have been removed.');
            }, 1500);
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data, tasks, messages, and wallet balance will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => Alert.alert('Confirm Deletion', 'Type "DELETE" to confirm.', [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Confirm', 
              style: 'destructive',
              onPress: () => Alert.alert('Account Deleted', 'Your account has been permanently deleted.')
            }
          ])
        }
      ]
    );
  };

  const handleDownloadData = () => {
    Alert.alert('Download Data', 'Your data package will be prepared for download.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Prepare Download', onPress: () => Alert.alert('Ready', 'Download will start shortly.') }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Data & Storage</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Storage Overview */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Storage Usage</Text>
          
          <View style={styles.storageCard}>
            <View style={styles.storageBarContainer}>
              <View style={styles.storageBarBg}>
                <View style={[styles.storageBarFill, { width: '73%' }]} />
              </View>
              <Text style={[styles.storageUsed, { color: isDark ? '#fff' : '#000' }]}>{storageInfo.app} used of {storageInfo.total}</Text>
            </View>
            
            <View style={styles.storageBreakdown}>
              <StorageBreakdownItem 
                label="App Data" 
                value={storageInfo.app} 
                color="#8B85FF" 
                percentage={73}
                isDark={isDark}
              />
              <StorageBreakdownItem 
                label="Cache" 
                value={storageInfo.cache} 
                color="#F59E0B" 
                percentage={18}
                isDark={isDark}
              />
              <StorageBreakdownItem 
                label="Media" 
                value={storageInfo.media} 
                color="#10B981" 
                percentage={8}
                isDark={isDark}
              />
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Your Data</Text>
          
          <SettingItem
            title="Download Your Data"
            description="Get a copy of all your data in JSON format"
            icon="download-outline"
            color="#8B85FF"
            isDark={isDark}
            onPress={handleDownloadData}
            showArrow
          />
          
          <SettingItem
            title="Export Data"
            description="Request a complete data export via email"
            icon="mail-outline"
            color="#10B981"
            isDark={isDark}
            onPress={handleExportData}
            showArrow
            loading={exporting}
          />
          
          <SettingItem
            title="Data Retention"
            description="Manage how long your data is kept"
            icon="time-outline"
            color="#F59E0B"
            isDark={isDark}
            onPress={() => Alert.alert('Data Retention', 'Data is kept for 7 years after account closure for legal compliance.')}
            showArrow
          />
        </View>

        {/* Cache Management */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Cache & Temporary Files</Text>
          
          <SettingItem
            title="Clear Cache"
            description={`Free up ${storageInfo.cache} of temporary files`}
            icon="trash-outline"
            color="#EF4444"
            isDark={isDark}
            onPress={handleClearCache}
            showArrow
            loading={clearingCache}
            destructive
          />
          
          <SettingToggle
            title="Auto-clear Cache"
            description="Automatically clear cache when storage is low"
            value={autoClearCache}
            onChange={setAutoClearCache}
            icon="refresh-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingItem
            title="Media Auto-download"
            description="Control when photos and videos are downloaded"
            icon="image-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => router.push('/media-download-settings')}
            showArrow
          />
        </View>

        {/* Offline Data */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Offline Access</Text>
          
          <SettingToggle
            title="Offline Mode"
            description="Access your tasks and messages without internet"
            value={offlineMode}
            onChange={setOfflineMode}
            icon="wifi-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingItem
            title="Offline Storage Limit"
            description={`Keep ${offlineStorageLimit}GB for offline use`}
            icon="hardware-chip-outline"
            color="#F59E0B"
            isDark={isDark}
            onPress={() => {
              const options = [1, 2, 5, 10];
              Alert.alert('Offline Storage Limit', 'Select maximum storage for offline data', options.map(opt => ({
                text: `${opt} GB`,
                onPress: () => setOfflineStorageLimit(opt),
              })));
            }}
            showArrow
            trailing={`${offlineStorageLimit} GB`}
          />
          
          <SettingItem
            title="Sync Now"
            description={`Last synced ${lastSynced}`}
            icon="sync-outline"
            color="#10B981"
            isDark={isDark}
            onPress={() => Alert.alert('Syncing', 'Your data is now up to date.')}
            showArrow
          />
        </View>

        {/* Data Sharing */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Data Sharing & Analytics</Text>
          
          <SettingToggle
            title="Usage Analytics"
            description="Help improve the app by sharing anonymous usage data"
            value={usageAnalytics}
            onChange={setUsageAnalytics}
            icon="analytics-outline"
            color="#8B85FF"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Crash Reports"
            description="Automatically send crash reports to help fix bugs"
            value={crashReports}
            onChange={setCrashReports}
            icon="bug-outline"
            color="#F59E0B"
            isDark={isDark}
          />
          
          <SettingToggle
            title="Performance Monitoring"
            description="Share app performance metrics"
            value={performanceMonitoring}
            onChange={setPerformanceMonitoring}
            icon="speedometer-outline"
            color="#10B981"
            isDark={isDark}
          />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Danger Zone</Text>
          
          <SettingItem
            title="Delete All Data"
            description="Permanently delete all your data from this device"
            icon="trash-outline"
            color="#EF4444"
            isDark={isDark}
            onPress={() => Alert.alert('Delete All Data', 'This will remove all local data. You will need to log in again.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted', 'All local data has been removed.') }
            ])}
            showArrow
            destructive
          />
          
          <SettingItem
            title="Delete Account"
            description="Permanently delete your account and all data"
            icon="person-remove-outline"
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

const StorageBreakdownItem = ({ label, value, color, percentage, isDark }: any) => (
  <View style={styles.storageBreakdownItem}>
    <View style={styles.storageBreakdownColor}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
    </View>
    <View style={styles.storageBreakdownInfo}>
      <Text style={[styles.storageBreakdownLabel, { color: isDark ? '#fff' : '#000' }]}>{label}</Text>
      <Text style={[styles.storageBreakdownValue, { color: isDark ? '#888' : '#666' }]}>{value} ({percentage}%)</Text>
    </View>
  </View>
);

const SettingItem = ({ 
  title, 
  description, 
  icon, 
  color, 
  isDark, 
  onPress, 
  showArrow = false, 
  destructive = false,
  trailing,
  loading = false
}: any) => (
  <TouchableOpacity 
    style={[styles.settingItem, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
    onPress={onPress}
    disabled={loading}
  >
    <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, { color: destructive ? '#EF4444' : (isDark ? '#fff' : '#000') }]}>{title}</Text>
      <Text style={[styles.settingDescription, { color: isDark ? '#888' : '#666' }]}>{description}</Text>
    </View>
    <View style={styles.settingTrailing}>
      {loading && <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />}
      {trailing && !loading && <Text style={[styles.settingTrailingText, { color: isDark ? '#888' : '#666' }]}>{trailing}</Text>}
      {showArrow && !loading && <Ionicons name="chevron-forward-outline" size={20} color={isDark ? '#888' : '#999'} />}
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
  storageCard: { backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16 },
  storageBarContainer: { marginBottom: 16 },
  storageBarBg: { height: 8, borderRadius: 4, backgroundColor: '#E5E7EB', overflow: 'hidden' },
  storageBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#8B85FF' },
  storageUsed: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'right' },
  storageBreakdown: { flexDirection: 'row', justifyContent: 'space-between' },
  storageBreakdownItem: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  storageBreakdownColor: { marginBottom: 8 },
  storageBreakdownInfo: { alignItems: 'center' },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  storageBreakdownLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center', marginBottom: 2 },
  storageBreakdownValue: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
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