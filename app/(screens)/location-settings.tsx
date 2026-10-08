/**
 * Location Settings — real, functional controls.
 *
 * - Location access: reads the REAL OS permission state and requests it.
 * - Foreground tracking: actually starts/stops the watcher.
 * - Nearby visibility: persisted server-side (users/{uid}.preferences.location).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Linking,
  Platform,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from '@/contexts/LocationContext';
import { useLocationStore } from '@/store/locationStore';
import { apiPut, getApiErrorMessage } from '@/services/api';

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { theme, showToast } = useUIStore();
  const systemScheme = useColorScheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  const { requestPermission, startTracking, stopTracking } = useLocation();
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const isTracking = useLocationStore((s) => s.isTracking);
  const currentLocation = useLocationStore((s) => s.currentLocation);

  const user = useAuthStore((s) => s.user);
  const initialNearby = useMemo(
    () => (user as any)?.preferences?.location?.nearbyVisible !== false, // default on
    [user]
  );
  const [nearbyVisible, setNearbyVisible] = useState(initialNearby);
  const [savingNearby, setSavingNearby] = useState(false);
  const [trackingBusy, setTrackingBusy] = useState(false);

  useEffect(() => setNearbyVisible(initialNearby), [initialNearby]);

  const permissionGranted = permissionStatus === 'granted';

  const handlePermissionPress = async () => {
    if (permissionGranted) {
      // Cannot revoke programmatically — deep link to system settings
      if (Platform.OS !== 'web') Linking.openSettings().catch(() => {});
      return;
    }
    const granted = await requestPermission();
    if (!granted) {
      showToast('Permission denied — enable it in system settings', 'warning');
      if (Platform.OS !== 'web') Linking.openSettings().catch(() => {});
    }
  };

  const handleTrackingToggle = async () => {
    if (trackingBusy) return;
    setTrackingBusy(true);
    try {
      if (isTracking) {
        stopTracking();
        showToast('Live tracking paused', 'info');
      } else {
        if (!permissionGranted) {
          const granted = await requestPermission();
          if (!granted) { showToast('Allow location access first', 'warning'); return; }
        }
        await startTracking('foreground');
        showToast('Live tracking on', 'success');
      }
    } catch (e: any) {
      showToast(getApiErrorMessage(e, 'Could not change tracking'), 'error');
    } finally {
      setTrackingBusy(false);
    }
  };

  const handleNearbyToggle = async () => {
    if (savingNearby) return;
    const next = !nearbyVisible;
    setNearbyVisible(next);
    setSavingNearby(true);
    try {
      await apiPut('/users/me/profile', { preferences: { location: { nearbyVisible: next } } });
    } catch (e: any) {
      setNearbyVisible(!next);
      showToast(getApiErrorMessage(e, 'Could not save preference'), 'error');
    } finally {
      setSavingNearby(false);
    }
  };

  const rows = [
    {
      key: 'permission',
      icon: 'shield-outline',
      color: '#8B85FF',
      title: 'Location Access',
      description: permissionGranted
        ? 'Allowed — tap to open system settings'
        : 'Not allowed — tap to grant access',
      value: permissionGranted,
      onToggle: handlePermissionPress,
      trackColor: '#8B85FF',
    },
    {
      key: 'tracking',
      icon: 'navigate-outline',
      color: '#10B981',
      title: 'Live Location (foreground)',
      description: isTracking
        ? `On${currentLocation?.address ? ` — ${currentLocation.address}` : ''}`
        : 'Share location while the app is open',
      value: isTracking,
      onToggle: handleTrackingToggle,
      disabled: trackingBusy,
      trackColor: '#10B981',
    },
    {
      key: 'nearby',
      icon: 'people-outline',
      color: '#F59E0B',
      title: 'Show in Nearby Buddies',
      description: 'Others near you can discover your profile',
      value: nearbyVisible,
      onToggle: handleNearbyToggle,
      disabled: savingNearby,
      trackColor: '#F59E0B',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Location Settings</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.hint, { color: isDark ? '#888' : '#666' }]}>
          These controls are live — changes apply immediately.
        </Text>
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          {rows.map((row, idx) => (
            <TouchableOpacity
              key={row.key}
              activeOpacity={0.8}
              onPress={row.onToggle}
              disabled={row.disabled}
              style={[
                styles.row,
                idx < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#f0f0f0' },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${row.color}15` }]}>
                <Ionicons name={row.icon as any} size={20} color={row.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: isDark ? '#fff' : '#000' }]}>{row.title}</Text>
                <Text style={[styles.rowDesc, { color: isDark ? '#888' : '#666' }]} numberOfLines={2}>
                  {row.description}
                </Text>
              </View>
              <Switch
                value={row.value}
                onValueChange={row.onToggle}
                disabled={row.disabled}
                trackColor={{ false: isDark ? '#444' : '#ddd', true: row.trackColor }}
                thumbColor="#fff"
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.footerNote, { color: isDark ? '#666' : '#999' }]}>
          Location is used to match you with nearby tasks and buddies. You can pause sharing anytime.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  section: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  rowDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  footerNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
