/**
 * Location Settings — Soft Modern
 * Real, functional controls (permission / foreground tracking / nearby
 * visibility) rendered as soft white rows with status chips.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from '@/contexts/LocationContext';
import { useLocationStore } from '@/store/locationStore';
import { apiPut, getApiErrorMessage } from '@/services/api';
import { ScreenHeader } from '@/components/ui';

export default function LocationSettingsScreen() {
  const router = useRouter();
  const { showToast } = useUIStore();

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

  useEffect(() => {
    // Defer the props→state sync past the effect body (react-hooks rule).
    void Promise.resolve().then(() => setNearbyVisible(initialNearby));
  }, [initialNearby]);

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
      icon: 'shield-checkmark' as const,
      title: 'Location Access',
      description: permissionGranted
        ? 'Allowed — tap to open system settings'
        : 'Not allowed — tap to grant access',
      value: permissionGranted,
      onToggle: handlePermissionPress,
      stateChip: permissionGranted ? { label: 'Allowed', color: Colors.semantic.success, bg: Colors.semantic.successSoft } : { label: 'Off', color: Colors.semantic.error, bg: Colors.semantic.errorSoft },
    },
    {
      key: 'tracking',
      icon: 'navigate' as const,
      title: 'Live Location (foreground)',
      description: isTracking
        ? `On${currentLocation?.address ? ` — ${currentLocation.address}` : ''}`
        : 'Share location while the app is open',
      value: isTracking,
      onToggle: handleTrackingToggle,
      disabled: trackingBusy,
      stateChip: isTracking ? { label: 'Live', color: Colors.semantic.success, bg: Colors.semantic.successSoft } : undefined,
    },
    {
      key: 'nearby',
      icon: 'people' as const,
      title: 'Show in Nearby Buddies',
      description: 'Others near you can discover your profile',
      value: nearbyVisible,
      onToggle: handleNearbyToggle,
      disabled: savingNearby,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Location" subtitle="Permissions, tracking and who sees you" onBack={() => router.back()} />
        {/* Map flair card */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400 }}
          style={styles.heroCard}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="location" size={30} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Location powers matches</Text>
            <Text style={styles.heroSub}>These controls are live — changes apply immediately across nearby tasks and buddies.</Text>
          </View>
        </MotiView>

        <View style={styles.section}>
          {rows.map((row, idx) => (
            <MotiView
              key={row.key}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 360, delay: 100 + idx * 70 }}
            >
              <Pressable
                onPress={row.onToggle}
                disabled={row.disabled}
                style={({ pressed }) => [
                  styles.row,
                  idx < rows.length - 1 && styles.rowDivider,
                  pressed && { backgroundColor: Colors.surface.creamSoft },
                  row.disabled && { opacity: 0.7 },
                ]}
              >
                <View style={[styles.iconWrap, row.value ? styles.iconWrapOn : styles.iconWrapOff]}>
                  <Ionicons name={row.icon} size={19} color={row.value ? '#FFFFFF' : Colors.brand.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.rowTitle}>{row.title}</Text>
                    {row.stateChip ? (
                      <View style={[styles.stateChip, { backgroundColor: row.stateChip.bg }]}>
                        <View style={[styles.stateDot, { backgroundColor: row.stateChip.color }]} />
                        <Text style={[styles.stateChipText, { color: row.stateChip.color }]}>{row.stateChip.label}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.rowDesc} numberOfLines={2}>
                    {row.description}
                  </Text>
                </View>
                <Switch
                  value={row.value}
                  onValueChange={row.onToggle}
                  disabled={row.disabled}
                  trackColor={{ false: Colors.border.medium, true: Colors.brand.accent }}
                  thumbColor="#FFFFFF"
                />
              </Pressable>
            </MotiView>
          ))}
        </View>

        {/* Live sharing / geofence management */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 360, delay: 320 }}
        >
          <Pressable
            style={({ pressed }) => [styles.navCard, pressed && { backgroundColor: Colors.surface.creamSoft }]}
            onPress={() => router.push('/(screens)/location-sharing')}
          >
            <View style={[styles.iconWrap, styles.iconWrapOff]}>
              <Ionicons name="share-social-outline" size={19} color={Colors.brand.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Location Sharing</Text>
              <Text style={styles.rowDesc} numberOfLines={2}>
                Manage who sees your live location and geofence alerts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
          </Pressable>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 400, delay: 380 }}
          style={styles.noteCard}
        >
          <Ionicons name="lock-closed" size={16} color={Colors.brand.accent} />
          <Text style={styles.noteText}>
            Location is only used to match you with nearby tasks and buddies. Pause sharing anytime.
          </Text>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { padding: Spacing[5], paddingBottom: 40 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[4],
    backgroundColor: Colors.brand.primary, borderRadius: BorderRadius.lg,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.button,
  },
  heroIconWrap: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontFamily: Typography.fontFamily.bold, fontSize: 16, color: '#FFFFFF', marginBottom: 3 },
  heroSub: { fontFamily: Typography.fontFamily.body, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },

  section: {
    borderRadius: BorderRadius.lg, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light,
    paddingHorizontal: Spacing[4], ...Shadows.card,
  },
  navCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    borderRadius: BorderRadius.lg, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[4], marginTop: Spacing[3], ...Shadows.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], paddingVertical: Spacing[4], borderRadius: BorderRadius.sm },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border.light },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: Colors.brand.accent },
  iconWrapOff: { backgroundColor: Colors.brand.accentSoft },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  rowTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  rowDesc: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2, lineHeight: 16 },
  stateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: BorderRadius.pill, paddingHorizontal: Spacing[2], paddingVertical: 2,
  },
  stateDot: { width: 5, height: 5, borderRadius: 3 },
  stateChipText: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold },

  noteCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    marginTop: Spacing[5], padding: Spacing[4],
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.brand.accent + '2E',
  },
  noteText: { flex: 1, fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.brand.accentPressed, lineHeight: 17 },
});
