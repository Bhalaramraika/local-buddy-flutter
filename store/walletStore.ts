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
import { apiGet, apiPost, ENDPOINTS } from '@/services/api';
import { initWalletTopup, refreshWalletAfterPayment, type PayUInitResponse } from '@/services/payment';
import { formatCurrency as formatINR } from '@/utils/helpers';

// Wallet shape returned by GET /wallet (whole INR, not paise)
export interface WalletInfo {
  balance: number;
  pendingBalance: number;
  currency: string;
  upiId?: string;
  totalEarnings?: number;
  totalSpent?: number;
}

interface WalletState {
  // State
  balance: WalletBalance;
  wallet: WalletInfo | null; // raw /wallet response shape used by screens
  isWithdrawing: boolean; // legacy withdrawal state (feature removed)
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
  isProcessing: boolean; // For PayU top-up initiation
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

  // ------------------------------------------------------------
  // Screen-facing API (REST-first; failures surface to UI)
  // ------------------------------------------------------------
  fetchWallet: () => Promise<WalletInfo | null>;
  fetchTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) => Promise<Transaction[]>;
  loadMoreTransactions: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  getTransaction: (id: string) => Promise<Transaction | undefined>;
  /**
   * Start PayU top-up; returns params the wallet-topup screen renders in a
   * WebView. The wallet is credited ONLY by the server-verified PayU callback.
   */
  startTopup: (amount: number) => Promise<PayUInitResponse | { success: false; error: string }>;
  /** Call after the PayU WebView flow finishes — pulls the real balance. */
  refreshAfterPayment: () => Promise<void>;
  /**
   * Withdrawals are not available yet. Kept as a safe stub so screens
   * destructuring it don't crash; never calls a backend endpoint.
   */
  withdraw: (payload?: any) => Promise<{ success: boolean; message?: string }>;
  fetchBankAccounts: () => void;
  formatCurrency: (amount: number | WalletBalance) => string;
  readonly pendingBalance: number;
  readonly defaultBankAccount: BankAccount | undefined;

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
      wallet: null,
      isWithdrawing: false,
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

      // ------------------------------------------------------------
      // Screen-facing API. Backend amounts are whole INR (₹).
      // ------------------------------------------------------------

      fetchWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await apiGet<any>('/wallet');
          const w = data?.wallet ?? data;
          const wallet: WalletInfo = {
            balance: w?.balance ?? 0,
            pendingBalance: w?.pendingBalance ?? 0,
            currency: w?.currency ?? 'INR',
            upiId: w?.upiId,
          };
          set({
            wallet,
            balance: {
              available: wallet.balance,
              pending: wallet.pendingBalance,
              total: wallet.balance + wallet.pendingBalance,
              currency: wallet.currency,
            },
            isLoading: false,
          });
          return wallet;
        } catch (error) {
          console.warn('[WalletStore] fetchWallet failed:', error);
          set({ isLoading: false });
          return get().wallet;
        }
      },

      fetchTransactions: async (params) => {
        const page = params?.page ?? 1;
        const limit = params?.limit ?? 20;
        set({ isLoadingTransactions: true, error: null });
        try {
          const data = await apiGet<any>('/wallet/transactions', {
            params: {
              limit,
              offset: (page - 1) * limit,
              ...(params?.type ? { type: params.type } : {}),
              ...(params?.status ? { status: params.status } : {}),
            },
          });
          const raw: any[] = data?.transactions ?? data?.data ?? [];
          const transactions: Transaction[] = raw.map((t: any): Transaction => ({
            id: t.id ?? t.txnid ?? String(Math.random()),
            type: t.type === 'add' || t.type === 'credit' || t.type === 'refund'
              ? 'credit'
              : 'debit',
            amount: t.amount ?? 0,
            balance: t.balance ?? 0,
            description: t.description ?? '',
            category: t.type === 'add' ? 'wallet_topup' : (t.type === 'withdraw' ? 'withdrawal' : 'task_payment'),
            status: t.status === 'success' ? 'completed' : (t.status ?? 'pending'),
            referenceId: t.taskId ?? t.txnid,
            referenceType: t.taskId ? 'task' : 'payment',
            metadata: t.metadata,
            createdAt: t.createdAt ?? '',
            updatedAt: t.updatedAt ?? t.createdAt ?? '',
          }));
          set((state) => ({
            transactions: page === 1
              ? transactions
              : [...state.transactions, ...transactions.filter((t) => !state.transactions.some((e) => e.id === t.id))],
            transactionsPagination: {
              ...state.transactionsPagination,
              page,
              limit,
              hasMore: transactions.length >= limit,
            },
            isLoadingTransactions: false,
          }));
        } catch (error) {
          console.warn('[WalletStore] fetchTransactions failed:', error);
          set({ isLoadingTransactions: false });
        }
        return get().transactions;
      },

      loadMoreTransactions: async () => {
        const { transactionsPagination } = get();
        if (!transactionsPagination.hasMore) return;
        await get().fetchTransactions({
          page: transactionsPagination.page + 1,
          limit: transactionsPagination.limit,
        });
      },

      refreshWallet: async () => {
        await get().fetchWallet();
        await get().fetchTransactions({ page: 1, limit: 20 });
      },

      getTransaction: async (id) => {
        try {
          const data = await apiGet<any>(`/wallet/transactions/${id}`);
          const t = data?.transaction ?? data;
          if (!t) return undefined;
          return {
            id: t.id ?? id,
            type: t.type === 'add' || t.type === 'credit' ? 'credit' : 'debit',
            amount: t.amount ?? 0,
            balance: t.balance ?? 0,
            description: t.description ?? '',
            category: t.type === 'add' ? 'wallet_topup' : 'task_payment',
            status: t.status === 'success' ? 'completed' : (t.status ?? 'pending'),
            referenceId: t.taskId ?? t.txnid,
            referenceType: t.taskId ? 'task' : 'payment',
            metadata: t.metadata,
            createdAt: t.createdAt ?? '',
            updatedAt: t.updatedAt ?? t.createdAt ?? '',
          } as Transaction;
        } catch (error) {
          console.warn('[WalletStore] getTransaction failed:', error);
          return undefined;
        }
      },

      startTopup: async (amount) => {
        set({ isProcessing: true, error: null });
        try {
          const res = await initWalletTopup(amount);
          if (!res?.success || !res.payuParams || !res.payuUrl) {
            throw new Error((res as any)?.error || 'Failed to initiate top-up');
          }
          set({ isProcessing: false });
          return res;
        } catch (error: any) {
          set({ isProcessing: false, error: error?.response?.data?.message || error?.message || 'Top-up failed' });
          return { success: false, error: error?.response?.data?.message || error?.message || 'Top-up failed' };
        }
      },

      refreshAfterPayment: async () => {
        try {
          const w = await refreshWalletAfterPayment();
          if (w) {
            set((state) => ({
              wallet: state.wallet ? { ...state.wallet, balance: w.balance } : state.wallet,
              balance: {
                ...state.balance,
                available: w.balance,
                total: w.balance + state.balance.pending,
              },
            }));
          }
        } catch (e) {
          console.warn('[WalletStore] refreshAfterPayment failed:', e);
        }
      },

      // Withdrawals are not available yet — safe stub, never calls an endpoint.
      withdraw: async (_payload) => {
        console.warn('[WalletStore] withdraw called, but withdrawals are not available yet');
        return { success: false, message: 'Withdrawals are not available yet' };
      },

      // No bank-account endpoint exists; keep locally persisted accounts only.
      fetchBankAccounts: () => {
        set({ bankAccounts: get().bankAccounts });
      },

      formatCurrency: (amount) =>
        formatINR(typeof amount === 'number' ? amount : amount?.available ?? 0),

      get pendingBalance() {
        return get().balance.pending;
      },
      get defaultBankAccount() {
        return get().bankAccounts.find((a) => a.isDefault);
      },

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
        wallet: null,
        isWithdrawing: false,
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