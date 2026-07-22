/**
 * Wallet Details Screen - Detailed wallet view with balance, transactions, and actions
 */

import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUIStore } from '@/store/uiStore';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';

export default function WalletDetailsScreen() {
  const router = useRouter();
  const { theme } = useUIStore();
  const { user } = useAuthStore();
  const { 
    balance, 
    pendingBalance, 
    transactions, 
    isLoading, 
    refreshWallet,
    formatCurrency 
  } = useWalletStore();
  
  const isDark = theme === 'dark';
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
    router.push(`/transaction-detail?id=${transaction.id}`);
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Wallet</Text>
          <TouchableOpacity onPress={() => router.push('/wallet-settings')}>
            <Ionicons name="settings-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[isDark ? '#fff' : '#4F46E5']} />
        }
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}>
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: isDark ? '#888' : '#666' }]}>Available Balance</Text>
            <TouchableOpacity onPress={handleViewHistory} style={styles.viewAllButton}>
              <Text style={[styles.viewAllText, { color: '#4F46E5' }]}>View All</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.balanceAmount, { color: isDark ? '#fff' : '#000' }]}>{formatCurrency(balance)}</Text>
          
          {pendingBalance > 0 && (
            <View style={styles.pendingBalance}>
              <Text style={[styles.pendingLabel, { color: isDark ? '#888' : '#666' }]}>Pending: </Text>
              <Text style={[styles.pendingAmount, { color: '#F59E0B' }]}>{formatCurrency(pendingBalance)}</Text>
            </View>
          )}

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#4F46E5' }]} onPress={handleTopUp}>
              <MaterialCommunityIcons name="wallet-plus" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={handleWithdraw}>
              <MaterialCommunityIcons name="cash-out" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]} onPress={handleViewHistory}>
              <Ionicons name="list-outline" size={24} color={isDark ? '#fff' : '#000'} />
              <Text style={[styles.actionButtonText, { color: isDark ? '#fff' : '#000' }]}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Stats */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>This Month</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Earned" 
              value={formatCurrency(1250)} 
              icon="cash-plus" 
              color="#10B981" 
              isDark={isDark} 
            />
            <StatCard 
              title="Spent" 
              value={formatCurrency(890)} 
              icon="cash-minus" 
              color="#EF4444" 
              isDark={isDark} 
            />
            <StatCard 
              title="Withdrawn" 
              value={formatCurrency(500)} 
              icon="bank-transfer-out" 
              color="#F59E0B" 
              isDark={isDark} 
            />
            <StatCard 
              title="Pending" 
              value={formatCurrency(pendingBalance)} 
              icon="clock-outline" 
              color="#4F46E5" 
              isDark={isDark} 
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Recent Transactions</Text>
            <TouchableOpacity onPress={handleViewHistory}>
              <Text style={styles.viewAllLink}>View All</Text>
              <Ionicons name="chevron-forward-outline" size={18} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: isDark ? '#888' : '#666' }]}>Loading transactions...</Text>
            </View>
          ) : recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={isDark ? '#555' : '#ccc'} />
              <Text style={[styles.emptyTitle, { color: isDark ? '#888' : '#666' }]}>No transactions yet</Text>
              <Text style={[styles.emptyDesc, { color: isDark ? '#666' : '#999' }]}>Your transaction history will appear here</Text>
              <TouchableOpacity style={[styles.emptyAction, { backgroundColor: '#4F46E5' }]} onPress={handleTopUp}>
                <Text style={styles.emptyActionText}>Add Funds</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transactionList}>
              {recentTransactions.map((tx, index) => (
                <TouchableOpacity 
                  key={tx.id} 
                  style={[styles.transactionItem, { borderBottomWidth: index < recentTransactions.length - 1 ? 1 : 0, borderBottomColor: '#eee' }]}
                  onPress={() => handleTransactionPress(tx)}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: tx.type === 'credit' ? '#10B98115' : '#EF444415' }]}>
                    <Ionicons 
                      name={tx.type === 'credit' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} 
                      size={24} 
                      color={tx.type === 'credit' ? '#10B981' : '#EF4444'} 
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionTitle, { color: isDark ? '#fff' : '#000' }]}>{tx.description}</Text>
                    <Text style={[styles.transactionMeta, { color: isDark ? '#888' : '#666' }]}>{tx.date} • {tx.category}</Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={[styles.transactionAmountText, { color: tx.type === 'credit' ? '#10B981' : '#EF4444' }]}>
                      {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: tx.status === 'completed' ? '#10B98115' : '#F59E0B15' }]}>
                      <Text style={[styles.statusBadgeText, { color: tx.status === 'completed' ? '#10B981' : '#F59E0B' }]}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Wallet Info */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : '#fff', marginTop: 16 }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Wallet Information</Text>
          
          <InfoRow label="Wallet ID" value={`WLT-${user?.id?.slice(-8).toUpperCase() || 'XXXXXXXX'}`} isDark={isDark} copyable />
          <InfoRow label="Account Status" value="Verified" valueColor="#10B981" isDark={isDark} />
          <InfoRow label="KYC Status" value="Completed" valueColor="#10B981" isDark={isDark} />
          <InfoRow label="Daily Limit" value={formatCurrency(5000)} isDark={isDark} />
          <InfoRow label="Monthly Limit" value={formatCurrency(50000)} isDark={isDark} />
          <InfoRow label="Auto Withdrawal" value="Disabled" isDark={isDark} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const StatCard = ({ title, value, icon, color, isDark }: any) => (
  <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#fafafa' }]}>
    <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
    </View>
    <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{value}</Text>
    <Text style={[styles.statTitle, { color: isDark ? '#888' : '#666' }]}>{title}</Text>
  </View>
);

const InfoRow = ({ label, value, valueColor, isDark, copyable }: any) => (
  <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: '#eee' }]}>
    <Text style={[styles.infoLabel, { color: isDark ? '#888' : '#666' }]}>{label}</Text>
    <View style={styles.infoValueContainer}>
      <Text style={[styles.infoValue, { color: valueColor || (isDark ? '#fff' : '#000') }]}>{value}</Text>
      {copyable && (
        <TouchableOpacity style={styles.copyButton}>
          <Ionicons name="copy-outline" size={18} color={isDark ? '#888' : '#666'} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  balanceCard: { borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#eee', marginBottom: 16 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  balanceAmount: { fontSize: 42, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  pendingBalance: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  pendingLabel: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  pendingAmount: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAllLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  statTitle: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  transactionList: { gap: 0 },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  transactionDetails: { flex: 1 },
  transactionTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  transactionMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  transactionAmount: { alignItems: 'flex-end', gap: 8 },
  transactionAmountText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  emptyState: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  emptyDesc: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  emptyAction: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 10 },
  emptyActionText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  infoLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  infoValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoValue: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  copyButton: { padding: 4 },
});