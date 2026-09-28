/**
 * Wallet Service
 * Based on Architecture.md - Wallet management with balance, transactions, withdrawals
 */

import { apiGet, apiPost, apiDelete, ENDPOINTS } from './api';
import { STORAGE_KEYS } from '@/constants/app';
import { storage } from './storage';

export interface WalletBalance {
  available: number;
  pending: number;
  total: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  balance: number;
  description: string;
  category: 'task_earning' | 'task_payment' | 'wallet_topup' | 'withdrawal' | 'refund' | 'bonus' | 'penalty' | 'referral';
  status: 'completed' | 'pending' | 'failed' | 'reversed';
  referenceId?: string;
  referenceType?: 'task' | 'payment' | 'withdrawal' | 'refund';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalRequest {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'rejected' | 'failed';
  bankAccount: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    bankName: string;
  };
  upiId?: string;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string;
  ifsc: string;
  accountHolderName: string;
  bankName: string;
  isVerified: boolean;
  isDefault: boolean;
}

export interface WalletStats {
  totalEarnings: number;
  totalSpent: number;
  totalWithdrawn: number;
  currentBalance: number;
  pendingBalance: number;
  thisMonthEarnings: number;
  thisMonthSpending: number;
}

// Get wallet balance
export const getWalletBalance = async (): Promise<WalletBalance> => {
  try {
    const response = await apiGet<WalletBalance>(ENDPOINTS.wallet.balance);
    
    // Cache balance locally
    await storage.set(STORAGE_KEYS.walletBalance, response.available);
    
    return response;
  } catch (error) {
    console.error('[Wallet] Get balance error:', error);
    // Return cached balance on error
    const cached = await storage.get<number>(STORAGE_KEYS.walletBalance);
    return {
      available: cached || 0,
      pending: 0,
      total: cached || 0,
      currency: 'INR',
    };
  }
};

// Get transactions with pagination
export const getTransactions = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    type?: 'credit' | 'debit';
    category?: Transaction['category'];
    status?: Transaction['status'];
    startDate?: string;
    endDate?: string;
  }
): Promise<{ transactions: Transaction[]; total: number; page: number; hasMore: boolean }> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const response = await apiGet<{ transactions: Transaction[]; total: number }>(
      `${ENDPOINTS.wallet.transactions}?${params.toString()}`
    );
    
    return {
      transactions: response.transactions,
      total: response.total,
      page,
      hasMore: page * limit < response.total,
    };
  } catch (error) {
    console.error('[Wallet] Get transactions error:', error);
    return { transactions: [], total: 0, page, hasMore: false };
  }
};

// Get transaction by ID
export const getTransaction = async (id: string): Promise<Transaction | null> => {
  try {
    const response = await apiGet<Transaction>(`${ENDPOINTS.wallet.transactions}/${id}`);
    return response;
  } catch (error) {
    console.error('[Wallet] Get transaction error:', error);
    return null;
  }
};

// Request withdrawal
export const requestWithdrawal = async (
  amount: number,
  method: 'bank' | 'upi',
  details: { bankAccountId?: string; upiId?: string }
): Promise<{ success: boolean; withdrawalId?: string; error?: string }> => {
  try {
    const response = await apiPost<{ withdrawalId: string }>(ENDPOINTS.wallet.withdraw, {
      amount: Math.round(amount * 100), // Convert to paise
      method,
      ...details,
    });
    return { success: true, withdrawalId: response.withdrawalId };
  } catch (error: any) {
    console.error('[Wallet] Withdrawal error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to request withdrawal' 
    };
  }
};

// Get withdrawal history
export const getWithdrawals = async (
  page: number = 1,
  limit: number = 20
): Promise<{ withdrawals: WithdrawalRequest[]; total: number }> => {
  try {
    const response = await apiGet<{ withdrawals: WithdrawalRequest[]; total: number }>(
      `${ENDPOINTS.wallet.withdraw}?page=${page}&limit=${limit}`
    );
    return response;
  } catch (error) {
    console.error('[Wallet] Get withdrawals error:', error);
    return { withdrawals: [], total: 0 };
  }
};

// Get withdrawal by ID
export const getWithdrawal = async (id: string): Promise<WithdrawalRequest | null> => {
  try {
    const response = await apiGet<WithdrawalRequest>(`${ENDPOINTS.wallet.withdraw}/${id}`);
    return response;
  } catch (error) {
    console.error('[Wallet] Get withdrawal error:', error);
    return null;
  }
};

// Cancel withdrawal (if still pending)
export const cancelWithdrawal = async (id: string): Promise<boolean> => {
  try {
    await apiPost(`${ENDPOINTS.wallet.withdraw}/${id}/cancel`);
    return true;
  } catch (error) {
    console.error('[Wallet] Cancel withdrawal error:', error);
    return false;
  }
};

// Add bank account
export const addBankAccount = async (account: Omit<BankAccount, 'id' | 'isVerified' | 'isDefault'>): Promise<BankAccount | null> => {
  try {
    const response = await apiPost<BankAccount>(ENDPOINTS.wallet.paymentMethods, {
      type: 'bank',
      ...account,
    });
    return response;
  } catch (error) {
    console.error('[Wallet] Add bank account error:', error);
    return null;
  }
};

// Get bank accounts
export const getBankAccounts = async (): Promise<BankAccount[]> => {
  try {
    const response = await apiGet<BankAccount[]>(ENDPOINTS.wallet.paymentMethods);
    return (response as any[]).filter((m: any) => m.type === 'bank');
  } catch (error) {
    console.error('[Wallet] Get bank accounts error:', error);
    return [];
  }
};

// Remove bank account
export const removeBankAccount = async (id: string): Promise<boolean> => {
  try {
    await apiDelete(`${ENDPOINTS.wallet.paymentMethods}/${id}`);
    return true;
  } catch (error) {
    console.error('[Wallet] Remove bank account error:', error);
    return false;
  }
};

// Set default bank account
export const setDefaultBankAccount = async (id: string): Promise<boolean> => {
  try {
    await apiPost(`${ENDPOINTS.wallet.paymentMethods}/${id}/default`);
    return true;
  } catch (error) {
    console.error('[Wallet] Set default bank account error:', error);
    return false;
  }
};

// Verify bank account (penny drop)
export const verifyBankAccount = async (id: string): Promise<boolean> => {
  try {
    await apiPost(`${ENDPOINTS.wallet.paymentMethods}/${id}/verify`);
    return true;
  } catch (error) {
    console.error('[Wallet] Verify bank account error:', error);
    return false;
  }
};

// Get wallet stats
export const getWalletStats = async (): Promise<WalletStats | null> => {
  try {
    const response = await apiGet<WalletStats>(`${ENDPOINTS.wallet.balance}/stats`);
    return response;
  } catch (error) {
    console.error('[Wallet] Get stats error:', error);
    return null;
  }
};

// Format amount for display
export const formatAmount = (amountInPaise: number, currency: string = 'INR'): string => {
  const amount = amountInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Parse amount from string
export const parseAmount = (amountStr: string): number => {
  const cleaned = amountStr.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
};

// Transaction type helpers
export const getTransactionTypeLabel = (type: Transaction['type']): string => {
  return type === 'credit' ? 'Received' : 'Paid';
};

export const getTransactionCategoryLabel = (category: Transaction['category']): string => {
  const labels: Record<Transaction['category'], string> = {
    task_earning: 'Task Earning',
    task_payment: 'Task Payment',
    wallet_topup: 'Wallet Top-up',
    withdrawal: 'Withdrawal',
    refund: 'Refund',
    bonus: 'Bonus',
    penalty: 'Penalty',
    referral: 'Referral Bonus',
  };
  return labels[category] || category;
};

export const getTransactionStatusLabel = (status: Transaction['status']): string => {
  const labels: Record<Transaction['status'], string> = {
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    reversed: 'Reversed',
  };
  return labels[status] || status;
};

export const getTransactionStatusColor = (status: Transaction['status']): string => {
  const colors: Record<Transaction['status'], string> = {
    completed: '#10B981', // green
    pending: '#F59E0B',   // amber
    failed: '#EF4444',    // red
    reversed: '#6B7280',  // gray
  };
  return colors[status] || '#6B7280';
};

// Withdrawal status helpers
export const getWithdrawalStatusLabel = (status: WithdrawalRequest['status']): string => {
  const labels: Record<WithdrawalRequest['status'], string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    rejected: 'Rejected',
    failed: 'Failed',
  };
  return labels[status] || status;
};

export const getWithdrawalStatusColor = (status: WithdrawalRequest['status']): string => {
  const colors: Record<WithdrawalRequest['status'], string> = {
    pending: '#F59E0B',
    processing: '#3B82F6',
    completed: '#10B981',
    rejected: '#EF4444',
    failed: '#EF4444',
  };
  return colors[status] || '#6B7280';
};

// Validate withdrawal amount
export const validateWithdrawalAmount = (
  amount: number,
  availableBalance: number,
  minWithdrawal: number = 100,
  maxWithdrawal: number = 50000
): { valid: boolean; error?: string } => {
  if (amount < minWithdrawal) {
    return { valid: false, error: `Minimum withdrawal amount is ${formatAmount(minWithdrawal * 100)}` };
  }
  if (amount > maxWithdrawal) {
    return { valid: false, error: `Maximum withdrawal amount is ${formatAmount(maxWithdrawal * 100)}` };
  }
  if (amount > availableBalance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  return { valid: true };
};

// Validate bank account details
export const validateBankAccount = (account: Omit<BankAccount, 'id' | 'isVerified' | 'isDefault'>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!account.accountNumber || account.accountNumber.length < 9) {
    errors.push('Invalid account number');
  }
  
  if (!account.ifsc || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(account.ifsc)) {
    errors.push('Invalid IFSC code');
  }
  
  if (!account.accountHolderName || account.accountHolderName.length < 3) {
    errors.push('Invalid account holder name');
  }
  
  if (!account.bankName) {
    errors.push('Bank name is required');
  }
  
  return { valid: errors.length === 0, errors };
};

export default {
  getWalletBalance,
  getTransactions,
  getTransaction,
  requestWithdrawal,
  getWithdrawals,
  getWithdrawal,
  cancelWithdrawal,
  addBankAccount,
  getBankAccounts,
  removeBankAccount,
  setDefaultBankAccount,
  verifyBankAccount,
  getWalletStats,
  formatAmount,
  parseAmount,
  getTransactionTypeLabel,
  getTransactionCategoryLabel,
  getTransactionStatusLabel,
  getTransactionStatusColor,
  getWithdrawalStatusLabel,
  getWithdrawalStatusColor,
  validateWithdrawalAmount,
  validateBankAccount,
};