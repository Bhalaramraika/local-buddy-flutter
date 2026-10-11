/**
 * Media Download Settings Screen — Soft Modern placeholder card
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader } from '@/components/ui';

export default function MediaDownloadSettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Media downloads" subtitle="Control when media downloads" onBack={() => router.back()} />
      <View style={styles.centerWrap}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="cloud-download-outline" size={36} color={Colors.brand.accent} />
          </View>
          <Text style={styles.title}>Media downloads</Text>
          <Text style={styles.sub}>Automatic media download preferences are coming soon. Choose when photos and files download over mobile data or Wi-Fi.</Text>
          <SoftButton label="Go back" variant="primary" fullWidth={false} onPress={() => router.back()} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} />
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary, padding: Spacing[5] },
  centerWrap: { flex: 1, justifyContent: 'center' },
  card: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius['2xl'],
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[7],
    alignItems: 'center', ...Shadows.card,
  },
  iconWrap: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  title: { fontFamily: Typography.fontFamily.display, fontSize: 24, color: Colors.text.primary, marginBottom: Spacing[2], textAlign: 'center' },
  sub: { fontFamily: Typography.fontFamily.body, fontSize: 13.5, lineHeight: 20, color: Colors.text.secondary, textAlign: 'center' },
});
