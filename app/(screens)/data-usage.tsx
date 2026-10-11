/**
 * Data Usage Screen — Soft Modern
 * Orange storage bar card, rounded action rows, pill toggles,
 * soft-red danger zone. All handlers unchanged.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';

export default function DataUsageScreen() {
  const router = useRouter();

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Data & storage" subtitle="Storage, cache, offline and sharing" onBack={() => router.back()} />
        {/* Storage hero card */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.storageHero}
        >
          <View style={styles.storageHeroTop}>
            <View style={styles.storageIconWrap}>
              <Ionicons name="server" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.storageHeroLabel}>Storage used</Text>
              <Text style={styles.storageHeroValue}>{storageInfo.app}<Text style={styles.storageHeroTotal}> of {storageInfo.total}</Text></Text>
            </View>
          </View>
          <View style={styles.storageBarBg}>
            <MotiView
              from={{ width: '0%' }}
              animate={{ width: '73%' }}
              transition={{ type: 'timing', duration: 900, delay: 300 }}
              style={styles.storageBarFill}
            />
          </View>
          <View style={styles.storageBreakdown}>
            <StorageBreakdownItem label="App Data" value={storageInfo.app} color={Colors.brand.accent} percentage={73} />
            <StorageBreakdownItem label="Cache" value={storageInfo.cache} color={Colors.semantic.warning} percentage={18} />
            <StorageBreakdownItem label="Media" value={storageInfo.media} color={Colors.semantic.success} percentage={8} />
          </View>
        </MotiView>

        {/* Your Data */}
        <MotableSection index={1} title="Your data">
          <ActionRow title="Download Your Data" description="Copy of your data in JSON" icon="download-outline" onPress={handleDownloadData} />
          <ActionRow title="Export Data" description="Complete export via email" icon="mail-outline" onPress={handleExportData} loading={exporting} />
          <ActionRow title="Data Retention" description="How long your data is kept" icon="time-outline" onPress={() => Alert.alert('Data Retention', 'Data is kept for 7 years after account closure for legal compliance.')} last />
        </MotableSection>

        {/* Cache */}
        <MotableSection index={2} title="Cache & temporary files">
          <ActionRow title="Clear Cache" description={`Free up ${storageInfo.cache} of temporary files`} icon="trash-outline" onPress={handleClearCache} loading={clearingCache} destructive />
          <ToggleRow title="Auto-clear Cache" description="Clear cache when storage is low" icon="refresh-outline" value={autoClearCache} onChange={setAutoClearCache} />
          <ActionRow title="Media Auto-download" description="When photos and videos download" icon="image-outline" onPress={() => router.push('/media-download-settings')} last />
        </MotableSection>

        {/* Offline */}
        <MotableSection index={3} title="Offline access">
          <ToggleRow title="Offline Mode" description="Access tasks and messages without internet" icon="wifi-outline" value={offlineMode} onChange={setOfflineMode} />
          <ActionRow
            title="Offline Storage Limit"
            description={`Keep ${offlineStorageLimit}GB for offline use`}
            icon="hardware-chip-outline"
            trailing={`${offlineStorageLimit} GB`}
            onPress={() => {
              const options = [1, 2, 5, 10];
              Alert.alert('Offline Storage Limit', 'Select maximum storage for offline data', options.map(opt => ({
                text: `${opt} GB`,
                onPress: () => setOfflineStorageLimit(opt),
              })));
            }}
          />
          <ActionRow title="Sync Now" description={`Last synced ${lastSynced}`} icon="sync-outline" iconTone="success" onPress={() => Alert.alert('Syncing', 'Your data is now up to date.')} last />
        </MotableSection>

        {/* Sharing */}
        <MotableSection index={4} title="Sharing & analytics">
          <ToggleRow title="Usage Analytics" description="Anonymous usage data improves the app" icon="analytics-outline" value={usageAnalytics} onChange={setUsageAnalytics} />
          <ToggleRow title="Crash Reports" description="Send crash reports to fix bugs faster" icon="bug-outline" value={crashReports} onChange={setCrashReports} />
          <ToggleRow title="Performance Monitoring" description="Share app performance metrics" icon="speedometer-outline" value={performanceMonitoring} onChange={setPerformanceMonitoring} last />
        </MotableSection>

        {/* Danger Zone */}
        <MotableSection index={5} title="Danger zone" danger>
          <ActionRow
            title="Delete All Data"
            description="Remove all local data from this device"
            icon="trash-outline"
            destructive
            onPress={() => Alert.alert('Delete All Data', 'This will remove all local data. You will need to log in again.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Deleted', 'All local data has been removed.') }
            ])}
          />
          <ActionRow title="Delete Account" description="Permanently delete account and all data" icon="person-remove-outline" onPress={handleDeleteAccount} destructive last />
        </MotableSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const StorageBreakdownItem = ({ label, value, color, percentage }: any) => (
  <View style={styles.breakdownItem}>
    <View style={[styles.colorDot, { backgroundColor: color }]} />
    <Text style={styles.breakdownLabel}>{label}</Text>
    <Text style={styles.breakdownValue}>{value} · {percentage}%</Text>
  </View>
);

function MotableSection({ index, title, danger, children }: { index: number; title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 70 }}
      style={[styles.section, danger && styles.sectionDanger]}
    >
      <Text style={[styles.sectionTitle, danger && { color: Colors.semantic.error }]}>{title}</Text>
      {children}
    </MotiView>
  );
}

const ActionRow = ({ title, description, icon, iconTone, onPress, destructive, trailing, loading, last }: any) => (
  <Pressable
    style={({ pressed }) => [styles.row, last && styles.rowLast, pressed && { backgroundColor: Colors.surface.creamSoft, borderRadius: BorderRadius.sm }]}
    onPress={onPress}
    disabled={loading}
  >
    <View style={[styles.rowIcon, destructive ? styles.rowIconError : iconTone === 'success' ? styles.rowIconSuccess : styles.rowIconAccent]}>
      <Ionicons name={icon} size={17} color={destructive ? Colors.semantic.error : iconTone === 'success' ? Colors.semantic.success : Colors.brand.accent} />
    </View>
    <View style={styles.rowBody}>
      <Text style={[styles.rowTitle, destructive && { color: Colors.semantic.error }]}>{title}</Text>
      <Text style={styles.rowDesc}>{description}</Text>
    </View>
    <View style={styles.rowTrailing}>
      {loading ? <ActivityIndicator size="small" color={Colors.brand.accent} /> : null}
      {trailing && !loading ? <Text style={styles.rowTrailingText}>{trailing}</Text> : null}
      {!loading ? <Ionicons name="chevron-forward" size={16} color={destructive ? Colors.semantic.error : Colors.text.muted} /> : null}
    </View>
  </Pressable>
);

const ToggleRow = ({ title, description, icon, value, onChange, last }: any) => (
  <View style={[styles.row, last && styles.rowLast]}>
    <View style={[styles.rowIcon, value ? styles.rowIconOn : styles.rowIconAccent]}>
      <Ionicons name={icon} size={17} color={value ? '#FFFFFF' : Colors.brand.accent} />
    </View>
    <View style={styles.rowBody}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowDesc}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
      thumbColor="#FFFFFF"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { padding: Spacing[5], paddingBottom: 40 },

  storageHero: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.card,
  },
  storageHeroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[4] },
  storageIconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  storageHeroLabel: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
  storageHeroValue: { fontSize: 26, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary, marginTop: 2 },
  storageHeroTotal: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  storageBarBg: { height: 10, borderRadius: 5, backgroundColor: Colors.surface.tertiary, overflow: 'hidden', marginBottom: Spacing[4] },
  storageBarFill: { height: '100%', borderRadius: 5, backgroundColor: Colors.brand.accent },
  storageBreakdown: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownItem: { flex: 1, alignItems: 'center' },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 6 },
  breakdownLabel: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, marginBottom: 1 },
  breakdownValue: { fontSize: 11, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },

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

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowIconAccent: { backgroundColor: Colors.brand.accentSoft },
  rowIconOn: { backgroundColor: Colors.brand.accent },
  rowIconError: { backgroundColor: Colors.semantic.errorSoft },
  rowIconSuccess: { backgroundColor: Colors.semantic.successSoft },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  rowDesc: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 1 },
  rowTrailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  rowTrailingText: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
});
