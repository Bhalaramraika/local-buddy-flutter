/**
 * Wallet Settings Screen — Soft Modern placeholder card
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader } from '@/components/ui';

export default function WalletSettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScreenHeader title="Wallet settings" subtitle="Save methods, limits and payouts" onBack={() => router.back()} />
      <View style={styles.centerWrap}>
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 420 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="wallet-outline" size={36} color={Colors.brand.accent} />
          </View>
          <Text style={styles.title}>Wallet settings</Text>
          <Text style={styles.sub}>Wallet preferences are coming soon. Manage auto top-up, limits and payment methods here.</Text>
          <SoftButton label="Open wallet" variant="accent" fullWidth={false} icon="wallet" onPress={() => router.push('/(tabs)/wallet')} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} withGlow />
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
