/**
 * Wallet Screen — Soft Modern
 * Signature orange balance card, white stat tiles,
 * cocoa segmented filters, soft transaction rows.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton } from '@/components/ui';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatRelativeTime } from '@/utils/helpers';

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { wallet, balance, transactions, fetchWallet, fetchTransactions, isLoading: walletLoading, commissionDue } = useWalletStore();
  const { user, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');

  // Unified values: REST (/wallet) OR Firestore realtime sync — whichever is
  // freshest. The realtime listener also feeds `wallet`, so the tab never
  // stays stuck on ₹0 when the REST call fails.
  const availableBalance = wallet?.balance ?? balance.available;
  const pendingBalance = wallet?.pendingBalance ?? balance.pending;
  const totalEarnings = wallet?.totalEarnings ?? 0;
  const totalSpent = wallet?.totalSpent ?? 0;
  const dues = commissionDue ?? 0;
  const duesBlocked = dues > 200;

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
      fetchTransactions();
    }
  }, [isAuthenticated, fetchWallet, fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallet(), fetchTransactions()]);
    setRefreshing(false);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'all') return true;
    if (activeTab === 'credit') return tx.type === 'credit';
    if (activeTab === 'debit') return tx.type === 'debit';
    return true;
  });

  const renderTransaction = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 340, delay: Math.min(index, 8) * 45 }}
    >
      <Pressable
        style={({ pressed }) => [styles.transactionCard, pressed && { transform: [{ scale: 0.985 }] }]}
        onPress={() => router.push({ pathname: `/(screens)/transaction-detail`, params: { id: item.id } })}
      >
        <View style={[styles.transactionIcon, { backgroundColor: item.type === 'credit' ? Colors.semantic.successSoft : Colors.semantic.errorSoft }]}>
          <Ionicons
            name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
            size={20}
            color={item.type === 'credit' ? Colors.semantic.success : Colors.semantic.error}
          />
        </View>
        <View style={styles.transactionDetails}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionTitle} numberOfLines={1}>{item.description}</Text>
            <Text style={[styles.transactionAmount, { color: item.type === 'credit' ? Colors.semantic.success : Colors.semantic.error }]}>
              {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
            </Text>
          </View>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionType}>{item.type === 'credit' ? 'Credit' : 'Debit'}</Text>
            <Text style={styles.transactionTime}>{formatRelativeTime(item.createdAt)}</Text>
            {item.status ? (
              <Text style={[styles.transactionStatus, { color: item.status === 'completed' ? Colors.semantic.success : item.status === 'pending' ? Colors.semantic.warning : Colors.semantic.error }]}>
                {item.status}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </MotiView>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <MotiView
          from={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 450 }}
          style={styles.authPrompt}
        >
          <View style={styles.authIconWrap}>
            <Ionicons name="wallet" size={40} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Wallet</Text>
          <Text style={styles.authSubtitle}>Sign in to manage your earnings and payments</Text>
          <SoftButton label="Sign in" variant="accent" fullWidth={false} icon="arrow-forward" onPress={() => router.push('/login')} style={{ paddingHorizontal: Spacing[8], marginTop: Spacing[5] }} withGlow />
        </MotiView>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 380 }}
        style={styles.headerWrap}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Wallet</Text>
          <Text style={styles.pageSubtitle}>Your balance, earnings and payments</Text>
        </View>
        <Pressable
          style={styles.settingsBtn}
          onPress={() => router.push('/(screens)/wallet-settings')}
          accessibilityLabel="Wallet settings"
          hitSlop={8}
        >
          <Ionicons name="settings-outline" size={19} color={Colors.brand.accent} />
        </Pressable>
      </MotiView>

      {/* Signature orange balance card */}
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 440, delay: 80 }}
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceLabelRow}>
            <View style={styles.balanceIconChip}>
              <Ionicons name="wallet" size={15} color="#FFFFFF" />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{formatCurrency(availableBalance)}</Text>
          <View style={styles.balanceActions}>
            <Pressable style={[styles.balanceActionBtn, styles.balanceActionGreen]} onPress={() => router.push('/(screens)/wallet-topup')}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.balanceActionText}>Add Money</Text>
            </Pressable>
            <Pressable style={[styles.balanceActionBtn, styles.balanceActionGhost]} onPress={() => router.push('/(screens)/wallet-withdraw')}>
              <Ionicons name="arrow-down-circle" size={18} color="#FFFFFF" />
              <Text style={styles.balanceActionText}>Withdraw</Text>
            </Pressable>
          </View>
        </View>
      </MotiView>

      {/* Platform dues card (buddy's negative balance) */}
      {dues > 0 ? (
        <MotiView from={{ opacity: 0, translateY: 12 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 380, delay: 140 }}>
          <View style={styles.duesCard}>
            <View style={styles.duesIconWrap}>
              <Ionicons name="alert-circle" size={20} color={Colors.semantic.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.duesTitle}>Platform dues: −{formatCurrency(dues)}</Text>
              <Text style={styles.duesSub}>
                {duesBlocked
                  ? 'You cannot apply for new tasks until you clear these dues.'
                  : '10% platform fee from your tasks. Clear anytime via PayU.'}
              </Text>
              <Pressable style={styles.duesPayBtn} onPress={() => router.push({ pathname: '/(screens)/wallet-topup', params: { mode: 'dues' } })}>
                <Ionicons name="card" size={14} color="#FFFFFF" />
                <Text style={styles.duesPayBtnText}>Pay dues • {formatCurrency(dues)}</Text>
              </Pressable>
            </View>
          </View>
        </MotiView>
      ) : null}

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        {[
          { value: `+${formatCurrency(totalEarnings)}`, label: 'Earnings', color: Colors.semantic.success, icon: 'trending-up' as const },
          { value: `-${formatCurrency(totalSpent)}`, label: 'Spent', color: Colors.semantic.error, icon: 'trending-down' as const },
          { value: formatCurrency(pendingBalance), label: 'Pending', color: Colors.semantic.warning, icon: 'time' as const },
        ].map((s, i) => (
          <MotiView
            key={s.label}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 180 + i * 70 }}
            style={styles.statWrap}
          >
            <View style={styles.statCard}>
              <Ionicons name={s.icon} size={16} color={s.color} style={{ marginBottom: 6 }} />
              <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          </MotiView>
        ))}
      </View>

      {/* Transaction Filters */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 400, delay: 320 }}
        style={styles.filterContainer}
      >
        <Text style={styles.filterLabel}>Transactions</Text>
        <View style={styles.filterTabs}>
          {(['all', 'credit', 'debit'] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </MotiView>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            style={styles.emptyState}
          >
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={34} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'all' ? 'Your transaction history will appear here' :
               activeTab === 'credit' ? 'No incoming transactions yet' :
               'No outgoing transactions yet'}
            </Text>
          </MotiView>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  content: { paddingBottom: 120 },

  headerWrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing[5], paddingTop: Spacing[6], paddingBottom: Spacing[4],
  },
  settingsBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  pageTitle: { fontFamily: Typography.fontFamily.display, fontSize: 30, lineHeight: 38, color: Colors.text.primary },
  pageSubtitle: { fontFamily: Typography.fontFamily.body, fontSize: 13, color: Colors.text.secondary, marginTop: 3 },

  balanceCard: {
    marginHorizontal: Spacing[5], marginBottom: Spacing[5],
    padding: Spacing[6], borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.brand.accent, ...Shadows.buttonOrange,
  },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], marginBottom: Spacing[2] },
  balanceIconChip: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceLabel: { fontSize: 12.5, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase', letterSpacing: 1 },
  balanceAmount: { fontSize: 40, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF', marginBottom: Spacing[5], letterSpacing: 0.3 },
  balanceActions: { flexDirection: 'row', gap: Spacing[3] },
  balanceActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: Spacing[3], borderRadius: BorderRadius.pill,
  },
  balanceActionGreen: { backgroundColor: Colors.semantic.success },
  balanceActionGhost: { backgroundColor: 'rgba(255,255,255,0.22)' },
  balanceActionText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  duesCard: {
    flexDirection: 'row', gap: Spacing[3], alignItems: 'flex-start',
    marginHorizontal: Spacing[5], marginBottom: Spacing[5],
    padding: Spacing[4], borderRadius: BorderRadius.lg,
    backgroundColor: Colors.semantic.errorSoft, borderWidth: 1, borderColor: Colors.semantic.error + '44',
  },
  duesIconWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  duesTitle: { fontSize: 15, fontFamily: Typography.fontFamily.bold, color: Colors.semantic.error },
  duesSub: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 3, lineHeight: 17 },
  duesPayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    marginTop: Spacing[3], backgroundColor: Colors.semantic.error,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2] + 1, borderRadius: BorderRadius.pill,
  },
  duesPayBtnText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  statsRow: { flexDirection: 'row', paddingHorizontal: Spacing[5], gap: Spacing[3], marginBottom: Spacing[5] },
  statWrap: { flex: 1 },
  statCard: {
    padding: Spacing[4], borderRadius: BorderRadius.lg, alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  statValue: { fontSize: 14.5, fontFamily: Typography.fontFamily.bold, marginBottom: 3 },
  statLabel: { fontSize: 11, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },

  filterContainer: { paddingHorizontal: Spacing[5], marginBottom: Spacing[3] },
  filterLabel: { fontSize: 20, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[3] },
  filterTabs: { flexDirection: 'row', backgroundColor: Colors.surface.tertiary, borderRadius: BorderRadius.pill, padding: 5, alignSelf: 'flex-start' },
  filterTab: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[2], borderRadius: BorderRadius.pill },
  filterTabActive: { backgroundColor: Colors.brand.primary, ...Shadows.button },
  filterTabText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  filterTabTextActive: { color: '#FFFFFF' },

  listContent: { paddingHorizontal: Spacing[5], paddingBottom: 30 },
  transactionCard: {
    flexDirection: 'row', padding: Spacing[4], borderRadius: BorderRadius.lg,
    marginBottom: Spacing[3], backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  transactionIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', marginRight: Spacing[3] },
  transactionDetails: { flex: 1, justifyContent: 'center' },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  transactionTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flex: 1, marginRight: Spacing[2] },
  transactionAmount: { fontSize: 15, fontFamily: Typography.fontFamily.bold },
  transactionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
  transactionType: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
  transactionTime: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  transactionStatus: { fontSize: 11, fontFamily: Typography.fontFamily.semiBold, textTransform: 'capitalize' },

  emptyState: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8], marginTop: Spacing[10] },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyText: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptySubtext: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center', lineHeight: 20 },

  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  authIconWrap: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', ...Shadows.card,
  },
  authTitle: { fontSize: 27, fontFamily: Typography.fontFamily.display, marginTop: Spacing[5], textAlign: 'center', color: Colors.text.primary },
  authSubtitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center', lineHeight: 21 },
});
