/**
 * Wallet History Screen — Soft Modern
 * Pill search, cocoa segmented filters, white transaction rows
 * with direction-tinted icon chips. Pagination logic unchanged.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useWalletStore } from '@/store/walletStore';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency, formatRelativeTime } from '@/utils/helpers';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/design';
import { ScreenHeader, SoftScreenSkeleton } from '@/components/ui';

export default function WalletHistoryScreen() {
  const router = useRouter();
  const {
    transactions,
    fetchTransactions,
    loadMoreTransactions,
    transactionsPagination,
    isLoading: walletLoading,
  } = useWalletStore();
  const { user, isAuthenticated } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions({ page: 1, limit: 20 });
    }
  }, [isAuthenticated, fetchTransactions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions({ page: 1, limit: 20 }, { forceRefresh: true });
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
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.type === 'credit' ? Colors.semantic.successSoft : Colors.semantic.errorSoft },
        ]}>
          <Ionicons
            name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'}
            size={19}
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
            <Text style={styles.transactionType}>
              {item.type === 'credit' ? 'Credit' : 'Debit'}
            </Text>
            <Text style={styles.transactionTime}>
              {formatRelativeTime(item.createdAt)}
            </Text>
            {item.status ? (
              <View style={[styles.statusPill, { backgroundColor: item.status === 'completed' ? Colors.semantic.successSoft : item.status === 'pending' ? Colors.semantic.warningSoft : Colors.semantic.errorSoft }]}>
                <Text style={[
                  styles.transactionStatus,
                  { color: item.status === 'completed' ? Colors.semantic.success : item.status === 'pending' ? Colors.semantic.warning : Colors.semantic.error },
                ]}>
                  {item.status}
                </Text>
              </View>
            ) : null}
          </View>
          {item.reference ? (
            <Text style={styles.transactionRef}>
              Ref: {item.reference}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
      </Pressable>
    </MotiView>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <MotiView from={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 450 }} style={styles.authPrompt}>
          <View style={styles.authIconWrap}>
            <Ionicons name="wallet" size={40} color={Colors.brand.accent} />
          </View>
          <Text style={styles.authTitle}>Transaction History</Text>
          <Text style={styles.authSubtitle}>Sign in to view your transaction history</Text>
        </MotiView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Transaction history" subtitle="Every credit and debit" onBack={() => router.back()} />
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.text.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.text.muted}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.text.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterWrap}>
        {(['all', 'credit', 'debit'] as const).map((filter) => {
          const active = activeFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.filterButton, active && styles.filterButtonActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.accent]} tintColor={Colors.brand.accent} />
        }
        ListEmptyComponent={
          walletLoading ? (
            // While data loads, show skeletons — never a fake "empty" state.
            <SoftScreenSkeleton cards={4} />
          ) : (
          <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400 }} style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={34} color={Colors.brand.accent} />
            </View>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search or filters' : 'Your transaction history will appear here'}
            </Text>
          </MotiView>
          )
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={Colors.brand.accent} />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface.primary },

  searchContainer: { paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[3] },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface.elevated, borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing[4], height: 50, borderWidth: 1, borderColor: Colors.border.light,
    ...Shadows.card,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, fontSize: 14.5, fontFamily: Typography.fontFamily.body, color: Colors.text.primary },

  filterWrap: {
    flexDirection: 'row', marginHorizontal: Spacing[5], marginBottom: Spacing[3],
    backgroundColor: Colors.surface.tertiary, borderRadius: BorderRadius.pill, padding: 4,
    alignSelf: 'flex-start',
  },
  filterButton: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[2], borderRadius: BorderRadius.pill },
  filterButtonActive: { backgroundColor: Colors.brand.primary, ...Shadows.button },
  filterButtonText: { fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.secondary },
  filterButtonTextActive: { color: '#FFFFFF' },

  listContent: { paddingHorizontal: Spacing[5], paddingBottom: 40, paddingTop: Spacing[1] },
  transactionCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    padding: Spacing[4], marginBottom: Spacing[3],
    borderRadius: BorderRadius.lg, backgroundColor: Colors.surface.elevated,
    borderWidth: 1, borderColor: Colors.border.light, ...Shadows.card,
  },
  transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  transactionDetails: { flex: 1, minWidth: 0 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  transactionTitle: { fontSize: 14.5, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary, flex: 1, marginRight: Spacing[2] },
  transactionAmount: { fontSize: 14.5, fontFamily: Typography.fontFamily.bold },
  transactionMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flexWrap: 'wrap' },
  transactionType: { fontSize: 12, fontFamily: Typography.fontFamily.medium, color: Colors.text.secondary },
  transactionTime: { fontSize: 12, fontFamily: Typography.fontFamily.body, color: Colors.text.muted },
  statusPill: { paddingHorizontal: Spacing[2], paddingVertical: 2, borderRadius: BorderRadius.pill },
  transactionStatus: { fontSize: 10.5, fontFamily: Typography.fontFamily.semiBold, textTransform: 'capitalize' },
  transactionRef: { fontSize: 11, fontFamily: Typography.fontFamily.body, color: Colors.text.muted, marginTop: 4 },

  emptyState: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8], marginTop: Spacing[14] },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
  },
  emptyText: { fontSize: 17, fontFamily: Typography.fontFamily.semiBold, color: Colors.text.primary },
  emptySubtext: { fontSize: 13.5, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center', lineHeight: 20 },
  loadingMore: { paddingVertical: Spacing[5], alignItems: 'center' },

  authPrompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[8] },
  authIconWrap: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: Colors.brand.accentSoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4], ...Shadows.card,
  },
  authTitle: { fontSize: 24, fontFamily: Typography.fontFamily.display, color: Colors.text.primary, textAlign: 'center' },
  authSubtitle: { fontSize: 14, fontFamily: Typography.fontFamily.body, color: Colors.text.secondary, marginTop: Spacing[2], textAlign: 'center' },
});
