/**
 * Payment Service
 * PayU + Cash payment system for wallet top-ups, task payments, and withdrawals
 * Handles PayU payment gateway integration and cash-based transactions
 */

import { apiGet, apiPost, apiDelete, ENDPOINTS } from './api';
import { PAYMENT_CONFIG } from '@/constants/app';
import { PaymentVerification, PayUFormData, PayUCallbackParams, CashPaymentDetails, PayUConfig } from '@/types';

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid' | 'failed';
  attempts: number;
  createdAt: number;
  notes?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'wallet' | 'netbanking' | 'cash';
  name: string;
  details: {
    upiId?: string;
    last4?: string;
    cardType?: string;
    bankName?: string;
    walletType?: string;
  };
  isDefault: boolean;
}

export interface WalletTopupRequest {
  amount: number;
  paymentMethodId: string;
  purpose: 'wallet_topup' | 'task_payment' | 'refund' | 'cash_deposit';
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason: string;
}

export interface PaymentConfig {
  supportedMethods: string[];
  upiApps: string[];
  minAmount: number;
  maxAmount: number;
}

// Create payment order
export const createPaymentOrder = async (
  amount: number,
  purpose: 'wallet_topup' | 'task_payment' | 'refund' | 'cash_deposit',
  metadata?: Record<string, any>
): Promise<PaymentOrder> => {
  try {
    const response = await apiPost<PaymentOrder>(ENDPOINTS.payments.createOrder, {
      amount: Math.round(amount * 100), // Convert to paise
      currency: PAYMENT_CONFIG.currency,
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notes: {
        purpose,
        ...metadata,
      },
    });
    return response;
  } catch (error) {
    console.error('[Payment] Create order error:', error);
    throw error;
  }
};

// Generate PayU form data for payment
export const generatePayUFormData = (
  order: PaymentOrder,
  userDetails: { name: string; email: string; phone: string },
  payuConfig: PayUConfig
): PayUFormData => {
  const txnid = order.receipt;
  const amount = (order.amount / 100).toFixed(2); // Convert paise to rupees
  const productinfo = `Wallet Top-up - ${order.receipt}`;
  const firstname = userDetails.name;
  const email = userDetails.email;
  const phone = userDetails.phone;
  const surl = `${payuConfig.baseUrl}/api/payments/payu/success`;
  const furl = `${payuConfig.baseUrl}/api/payments/payu/failure`;
  const curl = `${payuConfig.baseUrl}/api/payments/payu/cancel`;

  // Generate hash: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|||||salt
  const hashString = `${payuConfig.merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}||||||||||${payuConfig.merchantSalt}`;
  
  // Note: In production, hash should be generated on backend for security
  // This is a simplified client-side version for demo
  const hash = generateHash(hashString);

  return {
    key: payuConfig.merchantKey,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    phone,
    surl,
    furl,
    curl,
    hash,
    udf1: order.id,
    udf2: order.notes?.purpose || '',
    udf3: order.notes?.taskId || '',
    udf4: '',
    udf5: '',
  };
};

// Simple hash generation (in production, do this on backend)
const generateHash = (str: string): string => {
  // This is a placeholder - in production, use crypto-js or backend generation
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// Verify PayU callback
export const verifyPayUCallback = async (
  callbackParams: PayUCallbackParams
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    // Verify hash on backend
    const response = await apiPost<{ success: boolean; paymentId: string }>(
      ENDPOINTS.payments.verifyPayU,
      callbackParams
    );
    return response;
  } catch (error: any) {
    console.error('[Payment] Verify PayU callback error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'PayU payment verification failed' 
    };
  }
};

// Handle PayU callback (success/failure/cancel)
export const handlePayUCallback = (
  params: PayUCallbackParams
): { success: boolean; paymentId?: string; error?: string; orderId?: string } => {
  const { status, txnid, mihpayid, error, hash } = params;
  
  if (status === 'success' && mihpayid) {
    return { 
      success: true, 
      paymentId: mihpayid,
      orderId: txnid 
    };
  }
  
  return { 
    success: false, 
    error: error || 'Payment failed or cancelled',
    orderId: txnid 
  };
};

// Get payment methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  try {
    const response = await apiGet<PaymentMethod[]>(ENDPOINTS.wallet.paymentMethods);
    return response;
  } catch (error) {
    console.error('[Payment] Get payment methods error:', error);
    return [];
  }
};

// Add payment method
export const addPaymentMethod = async (
  type: 'upi' | 'card',
  details: { upiId?: string; token?: string }
): Promise<PaymentMethod> => {
  try {
    const response = await apiPost<PaymentMethod>(ENDPOINTS.wallet.addPaymentMethod, {
      type,
      ...details,
    });
    return response;
  } catch (error) {
    console.error('[Payment] Add payment method error:', error);
    throw error;
  }
};

// Remove payment method
export const removePaymentMethod = async (methodId: string): Promise<boolean> => {
  try {
    await apiDelete(ENDPOINTS.wallet.removePaymentMethod(methodId));
    return true;
  } catch (error) {
    console.error('[Payment] Remove payment method error:', error);
    return false;
  }
};

// Set default payment method
export const setDefaultPaymentMethod = async (methodId: string): Promise<boolean> => {
  try {
    await apiPost(`${ENDPOINTS.wallet.paymentMethods}/${methodId}/default`);
    return true;
  } catch (error) {
    console.error('[Payment] Set default payment method error:', error);
    return false;
  }
};

// Wallet top-up with PayU
export const topupWallet = async (
  amount: number,
  paymentMethodId: string
): Promise<{ success: boolean; orderId?: string; payuFormData?: PayUFormData; error?: string }> => {
  try {
    // Create order
    const order = await createPaymentOrder(amount, 'wallet_topup', {
      paymentMethodId,
    });

    // Get PayU config
    const payuConfig = await getPayUConfig();
    if (!payuConfig) {
      return { success: false, error: 'Payment configuration not available' };
    }

    // Get user details for PayU form
    const { getCurrentUser } = await import('./auth');
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Generate PayU form data
    const payuFormData = generatePayUFormData(order, {
      name: user.name || 'User',
      email: user.email || '',
      phone: user.phone || '',
    }, payuConfig);

    return { success: true, orderId: order.id, payuFormData };
  } catch (error: any) {
    console.error('[Payment] Wallet topup error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to initiate top-up' 
    };
  }
};

// Process wallet top-up after PayU payment
export const processWalletTopup = async (
  orderId: string,
  paymentId: string,
  payuCallbackParams: PayUCallbackParams
): Promise<{ success: boolean; balance?: number; error?: string }> => {
  try {
    const verification = await verifyPayUCallback(payuCallbackParams);

    if (!verification.success) {
      return { success: false, error: verification.error };
    }

    // Get updated balance
    const { getWalletBalance } = await import('./wallet');
    const balance = await getWalletBalance();
    
    return { success: true, balance: balance.available };
  } catch (error: any) {
    console.error('[Payment] Process wallet topup error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to process top-up' 
    };
  }
};

// Cash deposit for wallet top-up
export const cashDepositWallet = async (
  amount: number,
  cashDetails: CashPaymentDetails
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    const response = await apiPost<{ transactionId: string }>(ENDPOINTS.wallet.topup, {
      ...cashDetails,
      amount: Math.round(amount * 100), // Convert to paise
      paymentMode: 'cash',
    });
    return { success: true, transactionId: response.transactionId };
  } catch (error: any) {
    console.error('[Payment] Cash deposit error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to process cash deposit' 
    };
  }
};

// Task payment with PayU
export const payForTask = async (
  taskId: string,
  amount: number,
  paymentMethodId: string
): Promise<{ success: boolean; orderId?: string; payuFormData?: PayUFormData; error?: string }> => {
  try {
    const order = await createPaymentOrder(amount, 'task_payment', {
      taskId,
      paymentMethodId,
    });

    // Get PayU config
    const payuConfig = await getPayUConfig();
    if (!payuConfig) {
      return { success: false, error: 'Payment configuration not available' };
    }

    // Get user details for PayU form
    const { getCurrentUser } = await import('./auth');
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Generate PayU form data
    const payuFormData = generatePayUFormData(order, {
      name: user.name || 'User',
      email: user.email || '',
      phone: user.phone || '',
    }, payuConfig);

    return { success: true, orderId: order.id, payuFormData };
  } catch (error: any) {
    console.error('[Payment] Task payment error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to initiate payment' 
    };
  }
};

// Process task payment after PayU
export const processTaskPayment = async (
  taskId: string,
  orderId: string,
  paymentId: string,
  payuCallbackParams: PayUCallbackParams
): Promise<{ success: boolean; error?: string }> => {
  try {
    const verification = await verifyPayUCallback(payuCallbackParams);

    if (!verification.success) {
      return { success: false, error: verification.error };
    }

    // Notify backend of successful payment
    await apiPost(`/tasks/${taskId}/payment-complete`, {
      paymentId: verification.paymentId,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[Payment] Process task payment error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to process payment' 
    };
  }
};

// Cash payment for task
export const cashPaymentForTask = async (
  taskId: string,
  amount: number,
  cashDetails: CashPaymentDetails
): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
  try {
    const response = await apiPost<{ transactionId: string }>(`/tasks/${taskId}/cash-payment`, {
      ...cashDetails,
      amount: Math.round(amount * 100),
    });
    return { success: true, transactionId: response.transactionId };
  } catch (error: any) {
    console.error('[Payment] Cash payment for task error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to process cash payment' 
    };
  }
};

// Refund
export const requestRefund = async (
  paymentId: string,
  amount?: number,
  reason: string = 'Customer requested'
): Promise<{ success: boolean; refundId?: string; error?: string }> => {
  try {
    const response = await apiPost<{ refundId: string }>(ENDPOINTS.payments.refund, {
      paymentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    });
    return { success: true, refundId: response.refundId };
  } catch (error: any) {
    console.error('[Payment] Refund error:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || 'Failed to process refund' 
    };
  }
};

// Get PayU config
export const getPayUConfig = async (): Promise<PayUConfig | null> => {
  try {
    const response = await apiGet<{ payu: PayUConfig }>(ENDPOINTS.meta.config);
    return response.payu || null;
  } catch (error) {
    console.error('[Payment] Get PayU config error:', error);
    return null;
  }
};

// Get payment config
export const getPaymentConfig = async (): Promise<PaymentConfig | null> => {
  try {
    const response = await apiGet<{ payment: PaymentConfig }>(ENDPOINTS.meta.config);
    return response.payment || null;
  } catch (error) {
    console.error('[Payment] Get config error:', error);
    return null;
  }
};

// Validate UPI ID
export const validateUpiId = (upiId: string): boolean => {
  const upiRegex = /^[\w.\-]+@[\w.\-]+$/;
  return upiRegex.test(upiId);
};

// Format amount for display
export const formatAmount = (amountInPaise: number): string => {
  return `₹${(amountInPaise / 100).toFixed(2)}`;
};

// Parse amount from string
export const parseAmount = (amountStr: string): number => {
  const cleaned = amountStr.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100);
};

// Payment method display helpers
export const getPaymentMethodDisplayName = (method: PaymentMethod): string => {
  switch (method.type) {
    case 'upi':
      return method.details.upiId || 'UPI';
    case 'card':
      return `${method.details.cardType || 'Card'} •••• ${method.details.last4 || ''}`;
    case 'wallet':
      return method.details.walletType || 'Wallet';
    case 'netbanking':
      return method.details.bankName || 'Net Banking';
    case 'cash':
      return 'Cash';
    default:
      return method.name;
  }
};

export const getPaymentMethodIcon = (method: PaymentMethod): string => {
  switch (method.type) {
    case 'upi':
      return 'upi';
    case 'card':
      return method.details.cardType?.toLowerCase() || 'credit-card';
    case 'wallet':
      return 'wallet';
    case 'netbanking':
      return 'bank';
    case 'cash':
      return 'cash';
    default:
      return 'payment';
  }
};

export default {
  createPaymentOrder,
  generatePayUFormData,
  verifyPayUCallback,
  handlePayUCallback,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  topupWallet,
  processWalletTopup,
  cashDepositWallet,
  payForTask,
  processTaskPayment,
  cashPaymentForTask,
  requestRefund,
  getPayUConfig,
  getPaymentConfig,
  validateUpiId,
  formatAmount,
  parseAmount,
  getPaymentMethodDisplayName,
  getPaymentMethodIcon,
};