/**
 * Notification Settings — real, server-synced preferences.
 *
 * Reads  GET  /api/v1/notifications/preferences
 * Writes PUT  /api/v1/notifications/preferences (merged on server, keys below)
 * Master "Push" also registers/unregisters the FCM token.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiGet, apiPut, getApiErrorMessage } from '@/services/api';

interface Prefs {
  push: boolean;       // FCM master switch (also un/registers device token)
  tasks: boolean;      // task assigned/completed/updated
  messages: boolean;   // chat messages
  wallet: boolean;     // payments, top-ups, releases
  marketing: boolean;  // offers & product news
}

const DEFAULT_PREFS: Prefs = {
  push: true,
  tasks: true,
  messages: true,
  wallet: true,
  marketing: false,
};

const ROWS: Array<{
  key: keyof Prefs;
  title: string;
  description: string;
  icon: string;
  color: string;
}> = [
  { key: 'push', title: 'Push Notifications', description: 'Master switch for all push alerts on this device', icon: 'notifications-outline', color: '#8B85FF' },
  { key: 'tasks', title: 'Task Updates', description: 'New tasks nearby, assignments, status changes', icon: 'clipboard-outline', color: '#F59E0B' },
  { key: 'messages', title: 'Chat Messages', description: 'New messages from posters and buddies', icon: 'chatbubbles-outline', color: '#10B981' },
  { key: 'wallet', title: 'Wallet & Payments', description: 'Top-ups, releases and wallet activity', icon: 'wallet-outline', color: '#06B6D4' },
  { key: 'marketing', title: 'Offers & News', description: 'Occasional product updates and offers', icon: 'megaphone-outline', color: '#EC4899' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { theme, showToast } = useUIStore();
  const systemScheme = useColorScheme();
  const { registerForPushNotifications, unregisterForPushNotifications } = useNotifications();
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof Prefs | null>(null);

  // Load current preferences from the backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet<{ preferences?: Partial<Prefs> }>('/notifications/preferences');
        if (!cancelled) setPrefs({ ...DEFAULT_PREFS, ...(res?.preferences || {}) });
      } catch (e) {
        // Non-fatal: defaults are shown; first toggle will create prefs.
        console.warn('[NotifSettings] load failed:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback(async (key: keyof Prefs) => {
    if (savingKey) return; // single-flight
    const next = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: next }));
    setSavingKey(key);
    try {
      // Push master switch also (un)registers the device token
      if (key === 'push') {
        if (next) await registerForPushNotifications();
        else await unregisterForPushNotifications();
      }
      await apiPut('/notifications/preferences', { [key]: next });
    } catch (err: any) {
      // Revert on failure
      setPrefs((p) => ({ ...p, [key]: !next }));
      showToast(getApiErrorMessage(err, 'Could not update preference'), 'error');
    } finally {
      setSavingKey(null);
    }
  }, [prefs, savingKey, registerForPushNotifications, unregisterForPushNotifications, showToast]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Notifications</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Loading preferences…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.sectionHint, { color: isDark ? '#888' : '#666' }]}>
            Changes save instantly and sync across your devices.
          </Text>
          <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
            {ROWS.map((row, idx) => (
              <View
                key={row.key}
                style={[
                  styles.row,
                  idx < ROWS.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#f0f0f0' },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${row.color}15` }]}>
                  <Ionicons name={row.icon as any} size={20} color={row.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: isDark ? '#fff' : '#000' }]}>{row.title}</Text>
                  <Text style={[styles.rowDesc, { color: isDark ? '#888' : '#666' }]}>{row.description}</Text>
                </View>
                <Switch
                  value={prefs[row.key]}
                  onValueChange={() => toggle(row.key)}
                  disabled={savingKey === row.key}
                  trackColor={{ false: isDark ? '#444' : '#ddd', true: '#FF6B35' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontFamily: 'Inter_400Regular', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionHint: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  section: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4, borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  rowDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
