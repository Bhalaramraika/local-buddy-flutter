/**
 * Wallet Screen - Balance, transactions, top-up, withdraw
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatRelativeTime } from '@/utils/helpers';

export default function WalletScreen() {
  const router = useRouter();
  const { wallet, transactions, fetchWallet, fetchTransactions, topUp, withdraw, isLoading: walletLoading } = useWalletStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');

  const isDark = theme === 'dark';

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

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.transactionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
      onPress={() => router.push({ pathname: `/(screens)/transaction-detail`, params: { id: item.id } })}
    >
      <View style={styles.transactionIconContainer}>
        <View style={[styles.transactionIcon, { backgroundColor: item.type === 'credit' ? '#10B98120' : '#EF444420' }]}>
          <Ionicons 
            name={item.type === 'credit' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} 
            size={24} 
            color={item.type === 'credit' ? '#10B981' : '#EF4444'} 
          />
        </View>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionHeader}>
          <Text style={[styles.transactionTitle, { color: isDark ? '#fff' : '#000' }]}>{item.description}</Text>
          <Text style={[styles.transactionAmount, { color: item.type === 'credit' ? '#10B981' : '#EF4444' }]}>
            {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={styles.transactionMeta}>
          <Text style={[styles.transactionType, { color: isDark ? '#888' : '#666' }]}>{item.type === 'credit' ? 'Credit' : 'Debit'}</Text>
          <Text style={[styles.transactionTime, { color: isDark ? '#888' : '#666' }]}>{formatRelativeTime(item.createdAt)}</Text>
          {item.status && (
            <Text style={[styles.transactionStatus, { color: item.status === 'completed' ? '#10B981' : item.status === 'pending' ? '#F59E0B' : '#EF4444' }]}>
              {item.status}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.authPrompt}>
          <MaterialCommunityIcons name="wallet-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Wallet</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Sign in to manage your earnings and payments</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
        <Text style={[styles.balanceLabel, { color: isDark ? '#aaa' : '#666' }]}>Available Balance</Text>
        <Text style={[styles.balanceAmount, { color: isDark ? '#fff' : '#000' }]}>{formatCurrency(wallet?.balance || 0)}</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity style={[styles.balanceActionBtn, { backgroundColor: '#4F46E5' }]} onPress={() => router.push('/(screens)/wallet-topup')}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.balanceActionText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.balanceActionBtn, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} onPress={() => router.push('/(screens)/wallet-withdraw')}>
            <Ionicons name="remove-circle-outline" size={20} color={isDark ? '#fff' : '#000'} />
            <Text style={[styles.balanceActionText, { color: isDark ? '#fff' : '#000' }]}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>+{formatCurrency(wallet?.totalEarnings || 0)}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Total Earnings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>-{formatCurrency(wallet?.totalSpent || 0)}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Total Spent</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{formatCurrency(wallet?.pendingBalance || 0)}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#888' : '#666' }]}>Pending</Text>
        </View>
      </View>

      {/* Transaction Filters */}
      <View style={[styles.filterContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <Text style={[styles.filterLabel, { color: isDark ? '#fff' : '#000' }]}>Transactions</Text>
        <View style={styles.filterTabs}>
          {['all', 'credit', 'debit'].map((tab) => (
            <TouchableOpacity
              key={tab}
                style={[styles.filterTab, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }, activeTab === tab && styles.filterTabActive]}
              onPress={() => setActiveTab(tab as any)}
            >
              <Text style={[styles.filterTabText, { color: activeTab === tab ? '#fff' : isDark ? '#aaa' : '#666' }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <MaterialCommunityIcons name="cash" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#000' }]}>No transactions yet</Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#888' : '#666' }]}>
              {activeTab === 'all' ? 'Your transaction history will appear here' :
               activeTab === 'credit' ? 'No incoming transactions yet' :
               'No outgoing transactions yet'}
            </Text>
          </View>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 30 },
  balanceCard: { margin: 16, padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  balanceLabel: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontFamily: 'Inter_700Bold', marginBottom: 20 },
  balanceActions: { flexDirection: 'row', gap: 12 },
  balanceActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  balanceActionText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  filterTabs: { flexDirection: 'row', gap: 8 },
     filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  filterTabActive: { backgroundColor: '#4F46E5' },
  filterTabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  listContent: { padding: 16, paddingBottom: 30 },
  transactionCard: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  transactionIconContainer: { marginRight: 12 },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  transactionDetails: { flex: 1, justifyContent: 'center' },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  transactionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  transactionAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  transactionMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  transactionType: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  transactionTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  transactionStatus: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, marginTop: 40 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
});