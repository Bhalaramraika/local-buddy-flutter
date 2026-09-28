/**
 * Transaction Detail Screen
 * Shows detailed information about a wallet transaction
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/utils/helpers';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const { 
    transactions, 
    fetchTransactions,
    isLoading: transactionsLoading,
  } = useWalletStore();
  
  const { isAuthenticated } = useAuthStore();
  const { showToast, setGlobalLoading } = useUIStore();
  
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
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!transaction) {
    return null;
  }

  const isCredit = transaction.type === 'credit';
  const statusColors: Record<string, string> = {
    completed: '#10B981',
    pending: '#F59E0B',
    failed: '#EF4444',
    cancelled: '#6B7280',
    refunded: '#8B5CF6',
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

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getTypeIcon = (type: string, category?: string) => {
    if (type === 'credit') {
      switch (category) {
        case 'task_payment': return { icon: 'cash-check', color: '#10B981' };
        case 'referral_bonus': return { icon: 'gift', color: '#8B5CF6' };
        case 'topup': return { icon: 'add-circle', color: '#4F46E5' };
        case 'refund': return { icon: 'undo', color: '#06B6D4' };
        default: return { icon: 'arrow-down-circle', color: '#10B981' };
      }
    } else {
      switch (category) {
        case 'withdrawal': return { icon: 'bank-transfer-out', color: '#EF4444' };
        case 'task_payment': return { icon: 'cash-minus', color: '#EF4444' };
        case 'fee': return { icon: 'receipt', color: '#F59E0B' };
        default: return { icon: 'arrow-up-circle', color: '#EF4444' };
      }
    }
  };

  const typeIcon = getTypeIcon(transaction.type, transaction.category);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={[
          styles.statusIconContainer,
          { backgroundColor: `${typeIcon.color}20` }
        ]}>
          <Ionicons name={typeIcon.icon as any} size={32} color={typeIcon.color} />
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusTitle}>{transaction.description}</Text>
          <Text style={[
            styles.statusSubtitle,
            { color: isCredit ? '#10B981' : '#EF4444' }
          ]}>
            {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: `${statusColors[transaction.status] || '#6B7280'}20` }
        ]}>
          <Ionicons 
            name={getStatusIcon(transaction.status) as any} 
            size={16} 
            color={statusColors[transaction.status] || '#6B7280'} 
          />
          <Text style={[
            styles.statusBadgeText,
            { color: statusColors[transaction.status] || '#6B7280' }
          ]}>
            {getStatusLabel(transaction.status)}
          </Text>
        </View>
      </View>

      {/* Amount Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Amount Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction Amount</Text>
          <Text style={[
            styles.detailValue,
            { color: isCredit ? '#10B981' : '#EF4444' }
          ]}>
            {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
        {transaction.fee && transaction.fee > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee</Text>
            <Text style={styles.detailValue}>-{formatCurrency(transaction.fee)}</Text>
          </View>
        )}
        {transaction.netAmount !== undefined && (
          <View style={[styles.detailRow, styles.detailRowTotal]}>
            <Text style={styles.detailLabel}>Net Amount</Text>
            <Text style={[
              styles.detailValueTotal,
              { color: isCredit ? '#10B981' : '#EF4444' }
            ]}>
              {isCredit ? '+' : '-'}{formatCurrency(transaction.netAmount)}
            </Text>
          </View>
        )}
      </View>

      {/* Transaction Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Information</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Transaction ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{transaction.id}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Date & Time</Text>
            <Text style={styles.infoValue}>{formatDateTime(transaction.createdAt)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{transaction.type === 'credit' ? 'Credit (Received)' : 'Debit (Sent)'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Category</Text>
            <Text style={styles.infoValue}>{transaction.category?.replace('_', ' ') || 'General'}</Text>
          </View>
          {transaction.paymentMethod && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment Method</Text>
              <Text style={styles.infoValue}>{transaction.paymentMethod}</Text>
            </View>
          )}
          {transaction.referenceId && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Reference ID</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{transaction.referenceId}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Bank Account Details (for withdrawals) */}
      {transaction.bankAccount && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account</Text>
          <View style={styles.bankAccountCard}>
            <View style={styles.bankAccountRow}>
              <MaterialCommunityIcons name="bank" size={24} color="#4F46E5" />
              <View style={styles.bankAccountInfo}>
                <Text style={styles.bankAccountName}>{transaction.bankAccount.bankName}</Text>
                <Text style={styles.bankAccountNumber}>
                  **** **** **** {transaction.bankAccount.accountNumber.slice(-4)}
                </Text>
              </View>
            </View>
            <View style={styles.bankAccountDetails}>
              <Text style={styles.bankDetailLabel}>Account Holder</Text>
              <Text style={styles.bankDetailValue}>{transaction.bankAccount.accountHolderName}</Text>
              <Text style={styles.bankDetailLabel}>IFSC</Text>
              <Text style={styles.bankDetailValue}>{transaction.bankAccount.ifscCode}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Related Task (for task payments) */}
      {transaction.taskId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Task</Text>
          <TouchableOpacity style={styles.taskCard} onPress={() => router.push({ pathname: `/(screens)/task-detail`, params: { taskId: transaction.taskId } })}>
            <View style={styles.taskCardContent}>
              <View style={[
                styles.taskCategoryIcon,
                { backgroundColor: '#4F46E520' }
              ]}>
                <Ionicons name="briefcase-outline" size={20} color="#4F46E5" />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{transaction.taskTitle || 'Task'}</Text>
                <Text style={styles.taskId}>Task ID: {transaction.taskId.slice(0, 8)}...</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        {transaction.status === 'pending' && (
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => {
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
          }}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.actionBtnTextSecondary}>Cancel Transaction</Text>
          </TouchableOpacity>
        )}
        
        {transaction.status === 'completed' && transaction.type === 'debit' && transaction.category === 'withdrawal' && (
          <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => {
            // TODO: Implement download receipt
            showToast('Receipt downloaded', 'success');
          }}>
            <Ionicons name="download" size={20} color="#4F46E5" />
            <Text style={styles.actionBtnTextSecondary}>Download Receipt</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => router.back()}>
          <Text style={styles.actionBtnTextPrimary}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'capitalize',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailRowTotal: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 4,
    paddingTop: 14,
  },
  detailLabel: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  detailValueTotal: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: '#111827',
  },
  bankAccountCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
  },
  bankAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bankAccountInfo: {
    flex: 1,
  },
  bankAccountName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  bankAccountNumber: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#6B7280',
  },
  bankAccountDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bankDetailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bankDetailValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#374151',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  taskCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#111827',
  },
  taskId: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  actionsSection: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnTextSecondary: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#374151',
  },
  actionBtnPrimary: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnTextPrimary: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});