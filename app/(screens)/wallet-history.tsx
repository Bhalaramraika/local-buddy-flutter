/**
 * Wallet History Screen - Full transaction history with filters
 */

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  ScrollView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency, formatRelativeTime, formatDate } from '@/utils/helpers';

export default function WalletHistoryScreen() {
  const router = useRouter();
  const { 
    transactions, 
    fetchTransactions, 
    loadMoreTransactions,
    transactionsPagination,
    isLoading: walletLoading 
  } = useWalletStore();
  const { user, isAuthenticated } = useAuthStore();
  const { theme } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions({ page: 1, limit: 20 });
    }
  }, [isAuthenticated, fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions({ page: 1, limit: 20 });
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (transactionsPagination.hasMore && !loadingMore) {
      setLoadingMore(true);
      await loadMoreTransactions();
      setLoadingMore(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter !== 'all' && tx.type !== activeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!tx.description.toLowerCase().includes(query) &&
          !tx.reference?.toLowerCase().includes(query) &&
          !formatCurrency(tx.amount).toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.transactionCard, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
      onPress={() => router.push(`/(screens)/transaction-detail/${item.id}`)}
    >
      <View style={styles.transactionIconContainer}>
        <View style={[
          styles.transactionIcon, 
          { backgroundColor: item.type === 'credit' ? '#10B98120' : '#EF444420' }
        ]}>
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
          <Text style={[styles.transactionType, { color: isDark ? '#888' : '#666' }]}>
            {item.type === 'credit' ? 'Credit' : 'Debit'}
          </Text>
          <Text style={[styles.transactionTime, { color: isDark ? '#888' : '#666' }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
          {item.status && (
            <Text style={[
              styles.transactionStatus, 
              { color: item.status === 'completed' ? '#10B981' : item.status === 'pending' ? '#F59E0B' : '#EF4444' }
            ]}>
              {item.status}
            </Text>
          )}
        </View>
        {item.reference && (
          <Text style={[styles.transactionRef, { color: isDark ? '#666' : '#999' }]}>
            Ref: {item.reference}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
        <View style={styles.authPrompt}>
          <MaterialCommunityIcons name="wallet-outline" size={80} color={isDark ? '#666' : '#ccc'} />
          <Text style={[styles.authTitle, { color: isDark ? '#fff' : '#000' }]}>Transaction History</Text>
          <Text style={[styles.authSubtitle, { color: isDark ? '#888' : '#666' }]}>Sign in to view your transaction history</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back-outline" size={28} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Transaction History</Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0' }]}>
          <Ionicons name="search-outline" size={20} color={isDark ? '#888' : '#666'} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={isDark ? '#888' : '#999'}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-outline" size={20} color={isDark ? '#888' : '#666'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {['all', 'credit', 'debit'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.filterButtonActive,
                { backgroundColor: activeFilter === filter ? '#4F46E5' : isDark ? '#2a2a2a' : '#f0f0f0' }
              ]}
              onPress={() => setActiveFilter(filter as any)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: activeFilter === filter ? '#fff' : isDark ? '#fff' : '#000' }
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <MaterialCommunityIcons name="history" size={48} color={isDark ? '#555' : '#ccc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#fff' : '#000' }]}>No transactions found</Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#888' : '#666' }]}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Your transaction history will appear here'}
            </Text>
          </View>
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore && (
            <View style={styles.loadingMore}>
              <Text style={[styles.loadingMoreText, { color: isDark ? '#888' : '#666' }]}>Loading more...</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, gap: 8 },
  searchIcon: { marginRight: 4 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
  filterContainer: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterScrollContent: { paddingHorizontal: 16, gap: 8 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterButtonActive: {},
  filterButtonText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  listContent: { padding: 16, paddingBottom: 40 },
  transactionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  transactionIconContainer: { marginRight: 12 },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  transactionDetails: { flex: 1, minWidth: 0 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  transactionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', flex: 1 },
  transactionAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  transactionMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  transactionType: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  transactionTime: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  transactionStatus: { fontSize: 11, fontFamily: 'Inter_600SemiBold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  transactionRef: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, marginTop: 60 },
  emptyText: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 16 },
  emptySubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  loadingMore: { paddingVertical: 20, alignItems: 'center' },
  loadingMoreText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  authTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  authSubtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
});