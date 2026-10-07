/**
 * Wallet Withdraw Screen
 *
 * Withdrawals are not available yet. The backend has no withdraw
 * endpoint, so this screen shows a respectful coming-soon state
 * instead of calling missing store actions.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency } from '@/utils/helpers';

export default function WalletWithdrawScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { wallet, balance } = useWalletStore();

  const isDark = theme === 'dark';
  const availableBalance = wallet?.balance ?? balance?.available ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Withdraw Money</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.card, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={48} color="#8B85FF" />
        </View>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
          Withdrawals are not available yet
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#aaa' : '#666' }]}>
          We&apos;re working on it. You&apos;ll soon be able to transfer your wallet balance
          to your bank account or UPI.
        </Text>

        <View style={[styles.balanceBox, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5ff' }]}>
          <Text style={[styles.balanceLabel, { color: isDark ? '#aaa' : '#666' }]}>
            Available Balance
          </Text>
          <Text style={[styles.balanceValue, { color: isDark ? '#fff' : '#000' }]}>
            {formatCurrency(availableBalance)}
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  card: {
    margin: 24,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#8B85FF15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  balanceBox: {
    alignSelf: 'stretch',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  balanceValue: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  primaryBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#8B85FF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
