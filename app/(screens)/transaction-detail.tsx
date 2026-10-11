/**
 * Transaction Detail Screen — Soft Modern
 * Big tinted status hero, receipt-style amount breakdown,
 * rounded info cards. All data flow unchanged.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { SoftButton, ScreenHeader } from '@/components/ui';

const STATUS_COLORS: Record<string, string> = {
  completed: Colors.semantic.success,
  pending: Colors.semantic.warning,
  failed: Colors.semantic.error,
  cancelled: Colors.text.muted,
  refunded: Colors.semantic.info,
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return 'checkmark-circle';
    case 'pending': return 'time-outline';
    case 'failed': return 'close-circle';
    case 'cancelled': return 'ban';
    case 'refunded': return 'undo';
    default: return 'help-circle';
  }
};

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    transactions,
    fetchTransactions,
  } = useWalletStore();

  const { isAuthenticated } = useAuthStore();
  const { showToast } = useUIStore();

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTransaction = async () => {
      if (!isAuthenticated) {
        router.back();
        return;
      }

      setLoading(true);
      try {
        // First check if we have it in the store
        const existingTx = transactions.find(tx => tx.id === id);
        if (existingTx) {
          setTransaction(existingTx);
        } else {
          // Fetch transactions to get the detail
          await fetchTransactions();
          const tx = transactions.find(t => t.id === id);
          if (tx) {
            setTransaction(tx);
          } else {
            showToast('Transaction not found', 'error');
            router.back();
          }
        }
      } catch (error) {
        console.error('Error loading transaction:', error);
        showToast('Failed to load transaction', 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadTransaction();
  }, [id, transactions, fetchTransactions, isAuthenticated, router, showToast]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
        <Text style={styles.loadingText}>Loading transaction…</Text>
      </View>
    );
  }

  if (!transaction) {
    return null;
  }

  const isCredit = transaction.type === 'credit';
  const dirColor = isCredit ? Colors.semantic.success : Colors.semantic.error;
  const dirSoft = isCredit ? Colors.semantic.successSoft : Colors.semantic.errorSoft;
  const statusColor = STATUS_COLORS[transaction.status] || Colors.text.muted;

  const detailRows: Array<{ label: string; value: string }> = [
    { label: 'Transaction ID', value: transaction.id },
    { label: 'Date & time', value: formatDateTime(transaction.createdAt) },
    { label: 'Type', value: transaction.type === 'credit' ? 'Credit (Received)' : 'Debit (Sent)' },
    { label: 'Category', value: (transaction.category?.replace(/_/g, ' ') || 'General') },
    ...(transaction.paymentMethod ? [{ label: 'Payment method', value: String(transaction.paymentMethod) }] : []),
    ...(transaction.referenceId ? [{ label: 'Reference ID', value: String(transaction.referenceId) }] : []),
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenHeader title="Transaction" subtitle="Receipt and details" onBack={() => router.back()} />
      {/* Hero card */}
      <MotiView
        from={{ opacity: 0, translateY: 18, scale: 0.97 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'timing', duration: 440 }}
        style={styles.heroCard}
      >
        <View style={[styles.heroIconWrap, { backgroundColor: dirSoft }]}>
          <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={30} color={dirColor} />
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{transaction.description}</Text>
        <Text style={[styles.heroAmount, { color: dirColor }]}>
          {isCredit ? '+' : '−'}{formatCurrency(transaction.amount)}
        </Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '1A' }]}>
          <Ionicons name={getStatusIcon(transaction.status) as any} size={14} color={statusColor} />
          <Text style={[styles.statusPillText, { color: statusColor }]}>
            {String(transaction.status).charAt(0).toUpperCase() + String(transaction.status).slice(1)}
          </Text>
        </View>
      </MotiView>

      {/* Amount breakdown */}
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 100 }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Amount details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction amount</Text>
          <Text style={[styles.detailValue, { color: dirColor }]}>
            {isCredit ? '+' : '−'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
        {transaction.fee && transaction.fee > 0 ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={[styles.detailValue, { color: Colors.semantic.error }]}>−{formatCurrency(transaction.fee)}</Text>
          </View>
        ) : null}
        {transaction.netAmount !== undefined ? (
          <View style={[styles.detailRow, styles.detailRowTotal]}>
            <Text style={styles.detailLabelBold}>Net amount</Text>
            <Text style={[styles.detailValueTotal, { color: dirColor }]}>
              {isCredit ? '+' : '−'}{formatCurrency(transaction.netAmount)}
            </Text>
          </View>
        ) : null}
      </MotiView>

      {/* Info grid */}
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 180 }}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Transaction information</Text>
        {detailRows.map((row, i) => (
          <View key={row.label} style={[styles.infoRow, i === detailRows.length - 1 && styles.infoRowLast]}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
          </View>
        ))}
      </MotiView>

      {/* Bank Account Details (for withdrawals) */}
      {transaction.bankAccount ? (
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 260 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Bank account</Text>
          <View style={styles.bankCard}>
            <View style={styles.bankChip}>
              <MaterialCommunityIcons name="bank" size={22} color={Colors.brand.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bankName}>{transaction.bankAccount.bankName}</Text>
              <Text style={styles.bankNumber}>
                •••• {transaction.bankAccount.accountNumber.slice(-4)}
              </Text>
            </View>
          </View>
          <View style={styles.bankMetaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Account holder</Text>
              <Text style={styles.infoValue}>{transaction.bankAccount.accountHolderName}</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>IFSC</Text>
              <Text style={styles.infoValue}>{transaction.bankAccount.ifscCode}</Text>
            </View>
          </View>
        </MotiView>
      ) : null}

      {/* Related Task (for task payments) */}
      {transaction.taskId ? (
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 320 }}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Related task</Text>
          <Pressable
            style={({ pressed }) => [styles.taskCard, pressed && { backgroundColor: Colors.surface.creamSoft }]}
            onPress={() => router.push({ pathname: `/(screens)/task-detail`, params: { taskId: transaction.taskId } })}
          >
            <View style={styles.taskIconWrap}>
              <Ionicons name="briefcase-outline" size={19} color={Colors.brand.accent} />
            </View>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle} numberOfLines={1}>{transaction.taskTitle || 'Task'}</Text>
              <Text style={styles.taskId}>Task ID: {String(transaction.taskId).slice(0, 8)}…</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={Colors.text.muted} />
          </Pressable>
        </MotiView>
      ) : null}

      {/* Actions */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 380 }}
        style={styles.actionsSection}
      >
        {transaction.status === 'pending' ? (
          <SoftButton
            label="Cancel transaction"
            variant="danger"
            icon="close-circle-outline"
            onPress={() => {
              Alert.alert(
                'Cancel Transaction',
                'Are you sure you want to cancel this pending transaction?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: () => {
                    // TODO: Implement cancel transaction
                    showToast('Transaction cancelled', 'success');
                    router.back();
                  }},
                ]
              );
            }}
          />
        ) : null}

        {transaction.status === 'completed' && transaction.type === 'debit' && transaction.category === 'withdrawal' ? (
          <SoftButton
            label="Download receipt"
            variant="success"
            icon="download-outline"
            onPress={() => {
              // TODO: Implement download receipt
              showToast('Receipt downloaded', 'success');
            }}
            style={{ marginTop: transaction.status === 'pending' ? Spacing[3] : 0 }}
          />
        ) : null}

        <SoftButton label="Done" variant="primary" icon="checkmark" onPress={() => router.back()} style={{ marginTop: Spacing[3] }} />
      </MotiView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },
  content: { padding: Spacing[5], paddingBottom: Spacing[10] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface.primary, gap: Spacing[3] },
  loadingText: { fontFamily: Typography.fontFamily.body, fontSize: 13.5, color: Colors.text.secondary },

  heroCard: {
    alignItems: 'center', backgroundColor: Colors.surface.elevated,
    borderRadius: BorderRadius['2xl'], borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[6], marginBottom: Spacing[4], ...Shadows.elevated,
  },
  heroIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  heroTitle: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, textAlign: 'center', marginBottom: Spacing[2] },
  heroAmount: { fontSize: 38, fontFamily: Typography.fontFamily.bold, letterSpacing: 0.3, marginBottom: Spacing[4] },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing[4], paddingVertical: 6, borderRadius: BorderRadius.pill,
  },
  statusPillText: { fontSize: 12.5, fontFamily: Typography.fontFamily.semiBold },

  section: {
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.light,
    padding: Spacing[5], marginBottom: Spacing[4], ...Shadows.card,
  },
  sectionTitle: { fontSize: 17, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, marginBottom: Spacing[3] },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  detailRowTotal: { borderBottomWidth: 0, borderTopWidth: 1.5, borderTopColor: Colors.border.medium, marginTop: Spacing[1], paddingTop: Spacing[4] },
  detailLabel: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary },
  detailLabelBold: { fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  detailValue: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  detailValueTotal: { fontSize: 19, fontFamily: Typography.fontFamily.bold },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing[4],
    paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border.light,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 11.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  infoValue: { fontSize: 13.5, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, flexShrink: 1, textAlign: 'right' },

  bankCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[4], marginBottom: Spacing[4],
  },
  bankChip: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  bankName: { fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  bankNumber: { fontSize: 13, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: 2, letterSpacing: 1 },
  bankMetaRow: { flexDirection: 'row', gap: Spacing[4] },

  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    backgroundColor: Colors.surface.primary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.light, padding: Spacing[4],
  },
  taskIconWrap: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  taskId: { fontSize: 11.5, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 2 },

  actionsSection: { marginTop: Spacing[2] },
});
