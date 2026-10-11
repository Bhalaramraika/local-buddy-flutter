/**
 * Wallet Withdraw Screen — Soft Modern
 *
 * Withdrawals are not available yet. The backend has no withdraw
 * endpoint, so this screen shows a respectful coming-soon state
 * instead of calling missing store actions.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader } from '@/components/ui';
import { useWalletStore } from '@/store/walletStore';
import { formatCurrency } from '@/utils/helpers';

export default function WalletWithdrawScreen() {
  const router = useRouter();
  const { wallet, balance } = useWalletStore();

  const availableBalance = wallet?.balance ?? balance?.available ?? 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Withdraw money" subtitle="Bank / UPI payout (coming soon)" onBack={() => router.back()} />
      <View style={styles.centerWrap}>
        <MotiView
          from={{ opacity: 0, scale: 0.95, translateY: 14 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="wallet-outline" size={42} color={Colors.brand.accent} />
          </View>
          <View style={styles.soonChip}>
            <Text style={styles.soonChipText}>COMING SOON</Text>
          </View>
          <Text style={styles.title}>Withdrawals are not available yet</Text>
          <Text style={styles.subtitle}>
            We&apos;re working on it. You&apos;ll soon be able to transfer your wallet balance to your bank account or UPI.
          </Text>

          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>{formatCurrency(availableBalance)}</Text>
          </View>

          <SoftButton label="Go back" variant="primary" icon="arrow-back" onPress={() => router.back()} style={{ alignSelf: 'stretch' }} />
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary, justifyContent: 'flex-start', padding: Spacing[5] },
  centerWrap: { flex: 1, justifyContent: 'center' },
  card: {
    padding: Spacing[7], borderRadius: BorderRadius['2xl'], alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.elevated,
  },
  iconWrap: {
    width: 92, height: 92, borderRadius: 46,
    backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  soonChip: {
    backgroundColor: Colors.brand.accentSoft, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 4, marginBottom: Spacing[3],
  },
  soonChipText: {
    fontSize: 10.5, fontFamily: Typography.fontFamily.bold, color: Colors.brand.accentPressed,
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 22, fontFamily: Typography.fontFamily.display, color: Colors.text.primary,
    textAlign: 'center', marginBottom: Spacing[3], lineHeight: 29,
  },
  subtitle: {
    fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary,
    textAlign: 'center', lineHeight: 21, marginBottom: Spacing[5],
  },
  balanceBox: {
    alignSelf: 'stretch', borderRadius: BorderRadius.lg, padding: Spacing[4], alignItems: 'center',
    backgroundColor: Colors.surface.primary, borderWidth: 1, borderColor: Colors.border.light,
    marginBottom: Spacing[5],
  },
  balanceLabel: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  balanceValue: { fontSize: 26, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
});
