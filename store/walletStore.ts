/**
 * Wallet Store - Zustand
 * Wallet balance, transactions, withdrawals, and bank accounts management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import { 
  WalletBalance, 
  Transaction, 
  WithdrawalRequest, 
  BankAccount,
  WalletStats,
  PaginatedResponse 
} from '@/types';

interface WalletState {
  // State
  balance: WalletBalance;
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  bankAccounts: BankAccount[];
  stats: WalletStats | null;
  
  // Pagination
  transactionsPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  withdrawalsPagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  
  // Loading states
  isLoading: boolean;
  isLoadingTransactions: boolean;
  isLoadingWithdrawals: boolean;
  isProcessing: boolean; // For payments/withdrawals
  error: string | null;
  
  // Actions
  setBalance: (balance: WalletBalance) => void;
  updateBalance: (updates: Partial<WalletBalance>) => void;
  addBalance: (amount: number) => void;
  deductBalance: (amount: number) => void;
  
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  prependTransactions: (transactions: Transaction[]) => void;
  setTransactionsPagination: (pagination: Partial<WalletState['transactionsPagination']>) => void;
  
  setWithdrawals: (withdrawals: WithdrawalRequest[]) => void;
  addWithdrawal: (withdrawal: WithdrawalRequest) => void;
  updateWithdrawal: (withdrawal: WithdrawalRequest) => void;
  setWithdrawalsPagination: (pagination: Partial<WalletState['withdrawalsPagination']>) => void;
  
  setBankAccounts: (accounts: BankAccount[]) => void;
  addBankAccount: (account: BankAccount) => void;
  updateBankAccount: (account: BankAccount) => void;
  removeBankAccount: (accountId: string) => void;
  setDefaultBankAccount: (accountId: string) => void;
  
  setStats: (stats: WalletStats) => void;
  
  setLoading: (loading: boolean) => void;
  setLoadingTransactions: (loading: boolean) => void;
  setLoadingWithdrawals: (loading: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getAvailableBalance: () => number;
  getPendingBalance: () => number;
  getTotalBalance: () => number;
  getTransactionsByType: (type: Transaction['type']) => Transaction[];
  getTransactionsByCategory: (category: Transaction['category']) => Transaction[];
  getRecentTransactions: (limit?: number) => Transaction[];
  getPendingWithdrawals: () => WithdrawalRequest[];
  getCompletedWithdrawals: () => WithdrawalRequest[];
  getDefaultBankAccount: () => BankAccount | undefined;
  getThisMonthEarnings: () => number;
  getThisMonthSpending: () => number;
  clearAll: () => void;
}

const defaultBalance: WalletBalance = {
  available: 0,
  pending: 0,
  total: 0,
  currency: 'INR',
};

const defaultPagination = {
  page: 1,
  limit: 20,
  total: 0,
  hasMore: true,
};

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      // Initial state
      balance: defaultBalance,
      transactions: [],
      withdrawals: [],
      bankAccounts: [],
      stats: null,
      transactionsPagination: defaultPagination,
      withdrawalsPagination: defaultPagination,
      isLoading: false,
      isLoadingTransactions: false,
      isLoadingWithdrawals: false,
      isProcessing: false,
      error: null,
      
      // Actions
      setBalance: (balance) => set({ balance, isLoading: false, error: null }),
      
      updateBalance: (updates) => set((state) => ({
        balance: { ...state.balance, ...updates },
      })),
      
      addBalance: (amount) => set((state) => ({
        balance: {
          ...state.balance,
          available: state.balance.available + amount,
          total: state.balance.total + amount,
        },
      })),
      
      deductBalance: (amount) => set((state) => ({
        balance: {
          ...state.balance,
          available: Math.max(0, state.balance.available - amount),
          total: Math.max(0, state.balance.total - amount),
        },
      })),
      
      setTransactions: (transactions) => set({ 
        transactions, 
        isLoadingTransactions: false, 
        error: null 
      }),
      
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions],
        // Update balance based on transaction type
        balance: transaction.type === 'credit'
          ? {
              ...state.balance,
              available: state.balance.available + transaction.amount,
              total: state.balance.total + transaction.amount,
            }
          : {
              ...state.balance,
              available: Math.max(0, state.balance.available - transaction.amount),
              total: Math.max(0, state.balance.total - transaction.amount),
            },
      })),
      
      updateTransaction: (transaction) => set((state) => ({
        transactions: state.transactions.map((t) => 
          t.id === transaction.id ? transaction : t
        ),
      })),
      
      prependTransactions: (transactions) => set((state) => {
        const newTransactions = transactions.filter(
          (t) => !state.transactions.some((et) => et.id === t.id)
        );
        return {
          transactions: [...newTransactions, ...state.transactions],
        };
      }),
      
      setTransactionsPagination: (pagination) => set((state) => ({
        transactionsPagination: { ...state.transactionsPagination, ...pagination },
      })),
      
      setWithdrawals: (withdrawals) => set({ 
        withdrawals, 
        isLoadingWithdrawals: false, 
        error: null 
      }),
      
      addWithdrawal: (withdrawal) => set((state) => ({
        withdrawals: [withdrawal, ...state.withdrawals],
        // Deduct from available balance
        balance: {
          ...state.balance,
          available: Math.max(0, state.balance.available - withdrawal.amount),
          total: Math.max(0, state.balance.total - withdrawal.amount),
        },
      })),
      
      updateWithdrawal: (withdrawal) => set((state) => ({
        withdrawals: state.withdrawals.map((w) => 
          w.id === withdrawal.id ? withdrawal : w
        ),
      })),
      
      setWithdrawalsPagination: (pagination) => set((state) => ({
        withdrawalsPagination: { ...state.withdrawalsPagination, ...pagination },
      })),
      
      setBankAccounts: (bankAccounts) => set({ bankAccounts }),
      
      addBankAccount: (account) => set((state) => ({
        bankAccounts: [...state.bankAccounts, account],
      })),
      
      updateBankAccount: (account) => set((state) => ({
        bankAccounts: state.bankAccounts.map((a) => 
          a.id === account.id ? account : a
        ),
      })),
      
      removeBankAccount: (accountId) => set((state) => ({
        bankAccounts: state.bankAccounts.filter((a) => a.id !== accountId),
      })),
      
      setDefaultBankAccount: (accountId) => set((state) => ({
        bankAccounts: state.bankAccounts.map((a) => ({
          ...a,
          isDefault: a.id === accountId,
        })),
      })),
      
      setStats: (stats) => set({ stats }),
      
      setLoading: (isLoading) => set({ isLoading, error: isLoading ? null : get().error }),
      
      setLoadingTransactions: (isLoadingTransactions) => set({ isLoadingTransactions }),
      
      setLoadingWithdrawals: (isLoadingWithdrawals) => set({ isLoadingWithdrawals }),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      setError: (error) => set({ 
        error, 
        isLoading: false, 
        isLoadingTransactions: false, 
        isLoadingWithdrawals: false,
        isProcessing: false,
      }),
      
      // Computed
      getAvailableBalance: () => get().balance.available,
      
      getPendingBalance: () => get().balance.pending,
      
      getTotalBalance: () => get().balance.total,
      
      getTransactionsByType: (type) => 
        get().transactions.filter((t) => t.type === type),
      
      getTransactionsByCategory: (category) => 
        get().transactions.filter((t) => t.category === category),
      
      getRecentTransactions: (limit = 10) => 
        get().transactions.slice(0, limit),
      
      getPendingWithdrawals: () => 
        get().withdrawals.filter((w) => 
          ['pending', 'processing'].includes(w.status)
        ),
      
      getCompletedWithdrawals: () => 
        get().withdrawals.filter((w) => w.status === 'completed'),
      
      getDefaultBankAccount: () => 
        get().bankAccounts.find((a) => a.isDefault),
      
      getThisMonthEarnings: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return get().transactions
          .filter((t) => 
            t.type === 'credit' && 
            new Date(t.createdAt) >= startOfMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);
      },
      
      getThisMonthSpending: () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return get().transactions
          .filter((t) => 
            t.type === 'debit' && 
            new Date(t.createdAt) >= startOfMonth
          )
          .reduce((sum, t) => sum + t.amount, 0);
      },
      
      clearAll: () => set({
        balance: defaultBalance,
        transactions: [],
        withdrawals: [],
        bankAccounts: [],
        stats: null,
        transactionsPagination: defaultPagination,
        withdrawalsPagination: defaultPagination,
        isLoading: false,
        isLoadingTransactions: false,
        isLoadingWithdrawals: false,
        isProcessing: false,
        error: null,
      }),
    }),
    {
      name: 'wallet-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        // Persist bank accounts and pagination
        bankAccounts: state.bankAccounts,
        transactionsPagination: state.transactionsPagination,
        withdrawalsPagination: state.withdrawalsPagination,
      }),
    }
  )
);

// Selectors
export const selectWalletBalance = (state: WalletState) => state.balance;
export const selectAvailableBalance = (state: WalletState) => state.balance.available;
export const selectPendingBalance = (state: WalletState) => state.balance.pending;
export const selectTotalBalance = (state: WalletState) => state.balance.total;
export const selectTransactions = (state: WalletState) => state.transactions;
export const selectWithdrawals = (state: WalletState) => state.withdrawals;
export const selectBankAccounts = (state: WalletState) => state.bankAccounts;
export const selectWalletStats = (state: WalletState) => state.stats;
export const selectWalletLoading = (state: WalletState) => state.isLoading;
export const selectWalletProcessing = (state: WalletState) => state.isProcessing;
export const selectWalletError = (state: WalletState) => state.error;
export const selectDefaultBankAccount = (state: WalletState) => 
  state.bankAccounts.find((a) => a.isDefault);
export const selectRecentTransactions = (limit?: number) => (state: WalletState) => 
  state.transactions.slice(0, limit || 10);