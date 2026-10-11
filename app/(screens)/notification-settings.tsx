/**
 * Notification Settings — Soft Modern
 * Real, server-synced preferences (same API contract).
 * White rounded rows with orange icon chips + pill switches.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/ui';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
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
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'push', title: 'Push Notifications', description: 'Master switch for all push alerts on this device', icon: 'notifications' },
  { key: 'tasks', title: 'Task Updates', description: 'New tasks nearby, assignments, status changes', icon: 'clipboard' },
  { key: 'messages', title: 'Chat Messages', description: 'New messages from posters and buddies', icon: 'chatbubbles' },
  { key: 'wallet', title: 'Wallet & Payments', description: 'Top-ups, releases and wallet activity', icon: 'wallet' },
  { key: 'marketing', title: 'Offers & News', description: 'Occasional product updates and offers', icon: 'megaphone' },
];

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { showToast } = useUIStore();
  const { registerForPushNotifications, unregisterForPushNotifications } = useNotifications();

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
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.brand.accent} />
          <Text style={styles.loadingText}>Loading preferences…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Notifications" subtitle="What buzzes your phone — saves instantly" onBack={() => router.back()} />
          <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 360 }}>
            <Text style={styles.pageIntro}>
              Choose what buzzes your phone. Changes save instantly and sync across your devices.
            </Text>
          </MotiView>

          <View style={styles.section}>
            {ROWS.map((row, idx) => (
              <MotiView
                key={row.key}
                from={{ opacity: 0, translateY: 12 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 360, delay: 80 + idx * 60 }}
              >
                <View style={[styles.row, idx < ROWS.length - 1 && styles.rowDivider]}>
                  <View style={[styles.iconWrap, prefs[row.key] && styles.iconWrapActive]}>
                    <Ionicons
                      name={row.icon}
                      size={19}
                      color={prefs[row.key] ? '#FFFFFF' : Colors.brand.accent}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    <Text style={styles.rowDesc}>{row.description}</Text>
                  </View>
                  <Switch
                    value={prefs[row.key]}
                    onValueChange={() => toggle(row.key)}
                    disabled={savingKey === row.key}
                    trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </MotiView>
            ))}
          </View>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 420 }}
            style={styles.noteCard}
          >
            <Ionicons name="shield-checkmark" size={18} color={Colors.semantic.success} />
            <Text style={styles.noteText}>
              We only send what you switch on. No notification spam — ever.
            </Text>
          </MotiView>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: Spacing[3], fontFamily: Typography.fontFamily.body, fontSize: 14, color: Colors.text.secondary },
  scrollContent: { padding: Spacing[5], paddingBottom: 40 },
  pageIntro: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 20, marginBottom: Spacing[4] },
  section: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4],
    ...Shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[4] },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  iconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: Colors.brand.accent },
  rowTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  rowDesc: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2, lineHeight: 16 },
  noteCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    marginTop: Spacing[5], padding: Spacing[4],
    backgroundColor: Colors.semantic.successSoft, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.semantic.success + '30',
  },
  noteText: { flex: 1, fontSize: 12.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, lineHeight: 18 },
});
