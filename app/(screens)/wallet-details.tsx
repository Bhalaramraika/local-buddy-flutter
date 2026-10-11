/**
 * Wallet Details Screen — Soft Modern
 * Orange balance hero, 2×2 stat tiles, recent transactions list,
 * info card. Store logic untouched.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader } from '@/components/ui';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

export default function WalletDetailsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    balance,
    pendingBalance,
    transactions,
    isLoading,
    refreshWallet,
    formatCurrency,
  } = useWalletStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWallet();
    setRefreshing(false);
  };

  const handleTopUp = () => {
    router.push('/wallet-topup');
  };

  const handleWithdraw = () => {
    router.push('/wallet-withdraw');
  };

  const handleViewHistory = () => {
    router.push('/wallet-history');
  };

  const handleTransactionPress = (transaction: any) => {
    router.push({ pathname: `/(screens)/transaction-detail`, params: { id: transaction.id } });
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
      >
        <ScreenHeader title="Wallet" subtitle="Balance, stats and transactions" onBack={() => router.back()} />
        {/* Orange balance hero */}
        <MotiView
          from={{ opacity: 0, translateY: 18 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 440 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceLabelRow}>
              <View style={styles.balanceChip}>
                <Ionicons name="wallet" size={13} color="#FFFFFF" />
              </View>
              <Text style={styles.balanceLabel}>Available balance</Text>
            </View>
            <Pressable onPress={handleViewHistory} style={styles.viewAllButton} hitSlop={8}>
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>

          {pendingBalance > 0 ? (
            <View style={styles.pendingPill}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text style={styles.pendingAmount}>Pending {formatCurrency(pendingBalance)}</Text>
            </View>
          ) : null}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Pressable style={[styles.actionButton, styles.actionGreen]} onPress={handleTopUp}>
              <MaterialCommunityIcons name="wallet-plus" size={19} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Top Up</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionGhost]} onPress={handleWithdraw}>
              <MaterialCommunityIcons name="cash-minus" size={19} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.actionGhost]} onPress={handleViewHistory}>
              <Ionicons name="list" size={19} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>History</Text>
            </Pressable>
          </View>
        </MotiView>

        {/* Wallet Stats */}
        <MotableSection index={1} title="This month">
          <View style={styles.statsGrid}>
            <StatCard title="Earned" value={formatCurrency(1250)} icon="cash-plus" tint="success" />
            <StatCard title="Spent" value={formatCurrency(890)} icon="cash-minus" tint="error" />
            <StatCard title="Withdrawn" value={formatCurrency(500)} icon="bank-transfer-out" tint="warning" />
            <StatCard title="Pending" value={formatCurrency(pendingBalance)} icon="clock-outline" tint="accent" />
          </View>
        </MotableSection>

        {/* Recent Transactions */}
        <MotableSection index={2} title="Recent transactions">
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={32} color={Colors.brand.accent} />
              </View>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptyDesc}>Your transaction history will appear here</Text>
              <Pressable style={styles.emptyAction} onPress={handleTopUp}>
                <Ionicons name="add" size={15} color="#FFFFFF" />
                <Text style={styles.emptyActionText}>Add Funds</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              {recentTransactions.map((tx, index) => (
                <Pressable
                  key={tx.id}
                  style={({ pressed }) => [styles.transactionItem, index === recentTransactions.length - 1 && styles.transactionItemLast, pressed && { backgroundColor: Colors.surface.creamSoft, borderRadius: BorderRadius.sm }]}
                  onPress={() => handleTransactionPress(tx)}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: tx.type === 'credit' ? Colors.semantic.successSoft : Colors.semantic.errorSoft }]}>
                    <Ionicons
                      name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                      size={18}
                      color={tx.type === 'credit' ? Colors.semantic.success : Colors.semantic.error}
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle} numberOfLines={1}>{tx.description}</Text>
                    <Text style={styles.transactionMeta} numberOfLines={1}>{tx.date} • {tx.category}</Text>
                  </View>
                  <View style={styles.transactionAmountWrap}>
                    <Text style={[styles.transactionAmountText, { color: tx.type === 'credit' ? Colors.semantic.success : Colors.semantic.error }]}>
                      {tx.type === 'credit' ? '+' : '−'}{formatCurrency(tx.amount)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: tx.status === 'completed' ? Colors.semantic.successSoft : Colors.semantic.warningSoft }]}>
                      <Text style={[styles.statusBadgeText, { color: tx.status === 'completed' ? Colors.semantic.success : Colors.semantic.warning }]}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </MotableSection>

        {/* Wallet Info */}
        <MotableSection index={3} title="Wallet information">
          <InfoRow label="Wallet ID" value={`WLT-${user?.id?.slice(-8).toUpperCase() || 'XXXXXXXX'}`} copyable />
          <InfoRow label="Account Status" value="Verified" valueColor={Colors.semantic.success} />
          <InfoRow label="KYC Status" value="Completed" valueColor={Colors.semantic.success} />
          <InfoRow label="Daily Limit" value={formatCurrency(5000)} />
          <InfoRow label="Monthly Limit" value={formatCurrency(50000)} />
          <InfoRow label="Auto Withdrawal" value="Disabled" last />
        </MotableSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function MotableSection({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 420, delay: index * 90 }}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </MotiView>
  );
}

const TINTS: Record<string, { bg: string; fg: string }> = {
  success: { bg: Colors.semantic.successSoft, fg: Colors.semantic.success },
  error: { bg: Colors.semantic.errorSoft, fg: Colors.semantic.error },
  warning: { bg: Colors.semantic.warningSoft, fg: Colors.semantic.warning },
  accent: { bg: Colors.brand.accentSoft, fg: Colors.brand.accent },
};

const StatCard = ({ title, value, icon, tint }: any) => {
  const t = TINTS[tint] || TINTS.accent;
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={t.fg} />
      </View>
      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
};

const InfoRow = ({ label, value, valueColor, copyable, last }: any) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.infoValueContainer}>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      {copyable ? (
        <Pressable style={styles.copyButton} hitSlop={8}>
          <Ionicons name="copy-outline" size={15} color={Colors.text.muted} />
        </Pressable>
      ) : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  scrollContent: { paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: 40 },

  balanceCard: {
    borderRadius: BorderRadius['2xl'], padding: Spacing[6],
    backgroundColor: Colors.brand.accent, marginBottom: Spacing[4], ...Shadows.buttonOrange,
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  balanceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  balanceChip: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  balanceLabel: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1 },
  viewAllButton: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 5,
  },
  viewAllText: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
  balanceAmount: { fontSize: 40, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF', marginBottom: Spacing[2], letterSpacing: 0.3 },
  pendingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[3], paddingVertical: 4, marginBottom: Spacing[4],
  },
  pendingAmount: { fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },
  quickActions: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[2] },
  actionButton: {
    flex: 1, paddingVertical: Spacing[3], borderRadius: BorderRadius.pill,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
  },
  actionGreen: { backgroundColor: Colors.semantic.success },
  actionGhost: { backgroundColor: 'rgba(255,255,255,0.22)' },
  actionButtonText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  section: {
    borderRadius: BorderRadius.lg, padding: Spacing[5], marginBottom: Spacing[4],
    backgroundColor: Colors.surface.elevated, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  sectionTitle: { fontSize: 18, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[4] },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: Spacing[3] },
  statCard: {
    width: '48.5%', padding: Spacing[4], borderRadius: BorderRadius.md, alignItems: 'center',
    backgroundColor: Colors.surface.primary, borderWidth: 1, borderColor: Colors.border.light,
  },
  statIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing[2] },
  statValue: { fontSize: 16, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary, marginBottom: 2 },
  statTitle: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },

  transactionItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  transactionItemLast: { borderBottomWidth: 0 },
  transactionIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  transactionDetails: { flex: 1 },
  transactionTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, marginBottom: 2 },
  transactionMeta: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  transactionAmountWrap: { alignItems: 'flex-end', gap: 5 },
  transactionAmountText: { fontSize: 14.5, fontFamily: Typography.fontFamily.bold },
  statusBadge: { paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: BorderRadius.pill },
  statusBadgeText: { fontSize: 10, fontFamily: Typography.fontFamily.semiBold, textTransform: 'capitalize' },

  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  emptyState: { paddingVertical: Spacing[8], alignItems: 'center' },
  emptyIconWrap: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[3],
  },
  emptyTitle: { fontSize: 16.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptyDesc: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, textAlign: 'center', marginTop: Spacing[1], marginBottom: Spacing[4] },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.semantic.success, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[6], paddingVertical: Spacing[3], ...Shadows.button,
  },
  emptyActionText: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: '#FFFFFF' },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing[3] + 2, borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  infoValueContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  infoValue: { fontSize: 13.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  copyButton: { padding: 4 },
});
