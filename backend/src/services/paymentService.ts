/**
 * Payment Service - PayU & Cash Integration
 * Supports PayU (online payments) and Cash (offline payments)
 * Handles payments, refunds, webhooks, and wallet transactions
 */

import { config } from '../config';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';
import axios from 'axios';

interface PayUOrder {
  mihpayid: string;
  request_id: string;
  bank_ref_num: string;
  amt: string;
  transaction_amount: string;
  txnid: string;
  additional_charges: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  status: string;
  hash: string;
  key: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

interface PaymentResult {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
  redirectUrl?: string;
  payuFormData?: Record<string, string>;
}

interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: string;
  error?: string;
}

class PaymentService {
  private db = getFirestore();
  private payuMerchantKey: string;
  private payuMerchantSalt: string;
  private payuBaseUrl: string;

  constructor() {
    this.payuMerchantKey = config.payu.merchantKey;
    this.payuMerchantSalt = config.payu.merchantSalt;
    this.payuBaseUrl = config.payu.baseUrl;

    if (!this.payuMerchantKey || !this.payuMerchantSalt) {
      console.warn('[PaymentService] PayU credentials not configured');
    }
  }

  // ============================================================
  // PayU Methods
  // ============================================================

  /**
   * Generate PayU payment form data
   */
  generatePayUFormData(
    txnid: string,
    amount: number,
    productinfo: string,
    firstname: string,
    email: string,
    phone: string,
    udf1?: string,
    udf2?: string,
    udf3?: string,
    udf4?: string,
    udf5?: string
  ): Record<string, string> {
    const hashString = `${this.payuMerchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|${udf1 || ''}|${udf2 || ''}|${udf3 || ''}|${udf4 || ''}|${udf5 || ''}||||||${this.payuMerchantSalt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    return {
      key: this.payuMerchantKey,
      txnid,
      amount: amount.toFixed(2),
      productinfo,
      firstname,
      email,
      phone,
      surl: `${config.app.url}/api/v1/wallet/payu/success`,
      furl: `${config.app.url}/api/v1/wallet/payu/failure`,
      curl: `${config.app.url}/api/v1/wallet/payu/cancel`,
      hash,
      udf1: udf1 || '',
      udf2: udf2 || '',
      udf3: udf3 || '',
      udf4: udf4 || '',
      udf5: udf5 || '',
      service_provider: 'payu_paisa',
    };
  }

  /**
   * Verify PayU callback hash
   */
  verifyPayUCallback(params: PayUOrder): boolean {
    // PayU sends hash in callback, we need to verify it
    // The hash verification for response is different from request
    const hashString = `${this.payuMerchantSalt}|${params.status}||||||||||${params.udf5 || ''}|${params.udf4 || ''}|${params.udf3 || ''}|${params.udf2 || ''}|${params.udf1 || ''}|${params.email}|${params.firstname}|${params.productinfo}|${params.amount}|${params.txnid}|${this.payuMerchantKey}`;
    const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    return calculatedHash === params.hash;
  }

  /**
   * Verify PayU payment via API
   */
  async verifyPayUPayment(mihpayid: string): Promise<PaymentResult> {
    try {
      const command = 'verify_payment';
      const hashString = `${this.payuMerchantKey}|${command}|${mihpayid}|${this.payuMerchantSalt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const response = await axios.post(
        `${this.payuBaseUrl}/merchant/postservice.php?form=2`,
        {
          key: this.payuMerchantKey,
          command,
          var1: mihpayid,
          hash,
        },
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      // Parse PayU response
      if (response.data && response.data.status === 1) {
        const transaction = response.data.transaction_details[mihpayid];
        return {
          success: true,
          paymentId: mihpayid,
          orderId: transaction?.txnid,
          amount: parseFloat(transaction?.amt || '0'),
          currency: 'INR',
          status: transaction?.status,
        };
      }

      return { success: false, error: 'Payment verification failed' };
    } catch (error: any) {
      console.error('[PaymentService] PayU verify error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ============================================================
  // Wallet Transaction Methods
  // ============================================================

  /**
   * Process wallet top-up (add money) - PayU only
   */
  async processWalletTopUp(
    userId: string,
    amount: number,
    paymentMode: 'payu' | 'cash' = 'payu',
    metadata: Record<string, any> = {}
  ): Promise<PaymentResult> {
    const receipt = `wallet_${userId}_${Date.now()}`;
    const notes = { userId, type: 'wallet_topup', ...metadata };

    if (paymentMode === 'payu') {
      const txnid = `payu_${receipt}`;
      const formData = this.generatePayUFormData(
        txnid,
        amount,
        'Wallet Top-up',
        metadata.name || 'User',
        metadata.email || '',
        metadata.phone || '',
        userId,
        'wallet_topup'
      );
      
      await this.createPendingTransaction(userId, {
        type: 'add',
        amount,
        paymentMode: 'payu',
        paymentId: txnid,
        status: 'pending',
        metadata: { ...metadata, payuTxnId: txnid },
      });

      return {
        success: true,
        orderId: txnid,
        amount,
        currency: 'INR',
        status: 'created',
        payuFormData: formData,
        redirectUrl: `${this.payuBaseUrl}/_payment`,
      };
    } else {
      // Cash payment - create pending transaction for manual verification
      const cashTxnId = `cash_${receipt}`;
      
      await this.createPendingTransaction(userId, {
        type: 'add',
        amount,
        paymentMode: 'cash',
        paymentId: cashTxnId,
        status: 'pending',
        metadata: { ...metadata, cashTxnId, note: 'Cash payment - requires admin verification' },
      });

      return {
        success: true,
        orderId: cashTxnId,
        amount,
        currency: 'INR',
        status: 'pending_verification',
        error: 'Cash payment requires admin verification',
      };
    }
  }

  /**
   * Process wallet withdrawal - cash only (manual)
   */
  async processWalletWithdrawal(
    userId: string,
    amount: number,
    upiId: string,
    metadata: Record<string, any> = {}
  ): Promise<PaymentResult> {
    const withdrawalId = `withdrawal_${userId}_${Date.now()}`;
    
    // Create pending withdrawal transaction
    await this.createPendingTransaction(userId, {
      type: 'withdraw',
      amount,
      paymentMode: 'cash',
      paymentId: withdrawalId,
      status: 'pending',
      metadata: { ...metadata, upiId, withdrawalId, note: 'Cash withdrawal - requires admin processing' },
    });

    return {
      success: true,
      orderId: withdrawalId,
      amount,
      currency: 'INR',
      status: 'pending_manual',
      error: 'Cash withdrawal requires admin processing',
    };
  }

  /**
   * Release payment for completed task (escrow release)
   */
  async releaseTaskPayment(
    taskId: string,
    buddyId: string,
    amount: number,
    platformFee: number,
    metadata: Record<string, any> = {}
  ): Promise<PaymentResult> {
    const releaseId = `release_${taskId}_${Date.now()}`;
    
    // Create transaction records for both buddy (credit) and platform (commission)
    const buddyAmount = amount - platformFee;
    
    await this.createPendingTransaction(buddyId, {
      type: 'release',
      amount: buddyAmount,
      paymentMode: 'internal',
      paymentId: releaseId,
      status: 'success', // Internal transfer is instant
      metadata: { ...metadata, taskId, buddyAmount, platformFee, releaseId },
    });

    // Record platform commission
    await this.createPendingTransaction('platform', {
      type: 'commission_payment',
      amount: platformFee,
      paymentMode: 'internal',
      paymentId: releaseId,
      status: 'success',
      metadata: { ...metadata, taskId, buddyId, releaseId },
    });

    return {
      success: true,
      orderId: releaseId,
      amount: buddyAmount,
      currency: 'INR',
      status: 'success',
    };
  }

  /**
   * Lock payment for task assignment (escrow lock)
   */
  async lockTaskPayment(
    customerId: string,
    taskId: string,
    amount: number,
    metadata: Record<string, any> = {}
  ): Promise<PaymentResult> {
    const lockId = `lock_${taskId}_${Date.now()}`;
    
    await this.createPendingTransaction(customerId, {
      type: 'lock',
      amount,
      paymentMode: 'internal',
      paymentId: lockId,
      status: 'success',
      metadata: { ...metadata, taskId, lockId },
    });

    return {
      success: true,
      orderId: lockId,
      amount,
      currency: 'INR',
      status: 'success',
    };
  }

  /**
   * Refund locked payment (task cancelled)
   */
  async refundLockedPayment(
    customerId: string,
    taskId: string,
    amount: number,
    lockPaymentId: string,
    metadata: Record<string, any> = {}
  ): Promise<RefundResult> {
    const refundId = `refund_${taskId}_${Date.now()}`;
    
    await this.createPendingTransaction(customerId, {
      type: 'add', // Refund adds money back
      amount,
      paymentMode: 'internal',
      paymentId: refundId,
      status: 'success',
      metadata: { ...metadata, taskId, originalLockId: lockPaymentId, refundId },
    });

    return {
      success: true,
      refundId,
      amount,
      status: 'success',
    };
  }

  /**
   * Create pending transaction record
   */
  private async createPendingTransaction(
    userId: string,
    data: {
      type: 'add' | 'release' | 'commission_payment' | 'lock' | 'withdraw';
      amount: number;
      paymentMode: string;
      paymentId: string;
      status: 'pending' | 'success' | 'failed' | 'refunded';
      metadata: Record<string, any>;
    }
  ): Promise<string> {
    const transactionRef = this.db.collection('transactions').doc();
    await transactionRef.set({
      userId,
      type: data.type,
      amount: data.amount,
      currency: 'INR',
      paymentMode: data.paymentMode,
      paymentId: data.paymentId,
      status: data.status,
      metadata: data.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return transactionRef.id;
  }

  /**
   * Update transaction status (called from webhooks)
   */
  async updateTransactionStatus(
    paymentId: string,
    status: 'pending' | 'success' | 'failed' | 'refunded',
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const snapshot = await this.db.collection('transactions')
        .where('paymentId', '==', paymentId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`[PaymentService] Transaction not found for paymentId: ${paymentId}`);
        return false;
      }

      const doc = snapshot.docs[0];
      await doc.ref.update({
        status,
        metadata: { ...doc.data().metadata, ...metadata },
        updatedAt: new Date().toISOString(),
      });

      // If successful wallet top-up, update user wallet balance
      if (status === 'success' && doc.data().type === 'add') {
        await this.updateWalletBalance(doc.data().userId, doc.data().amount);
      }

      return true;
    } catch (error) {
      console.error('[PaymentService] Update transaction error:', error);
      return false;
    }
  }

  /**
   * Update user wallet balance
   */
  async updateWalletBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const userRef = this.db.collection('users').doc(userId);
      await userRef.update({
        'wallet.balance': FieldValue.increment(amount),
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('[PaymentService] Update wallet balance error:', error);
      return false;
    }
  }

  /**
   * Get user wallet balance
   */
  async getWalletBalance(userId: string): Promise<number> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      return userDoc.data()?.wallet?.balance || 0;
    } catch (error) {
      console.error('[PaymentService] Get wallet balance error:', error);
      return 0;
    }
  }

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(
    userId: string,
    options: { type?: string; status?: string; limit?: number; offset?: number } = {}
  ): Promise<any[]> {
    try {
      let query = this.db.collection('transactions').where('userId', '==', userId);
      
      if (options.type) {
        query = query.where('type', '==', options.type);
      }
      if (options.status) {
        query = query.where('status', '==', options.status);
      }

      query = query.orderBy('createdAt', 'desc');
      
      if (options.offset) {
        query = query.offset(options.offset);
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[PaymentService] Get transaction history error:', error);
      return [];
    }
  }

  /**
   * Handle PayU webhook/callback
   */
  async handlePayUCallback(params: PayUOrder): Promise<{ success: boolean; error?: string }> {
    try {
      const isValid = this.verifyPayUCallback(params);
      if (!isValid) {
        return { success: false, error: 'Invalid PayU callback hash' };
      }

      const status = params.status === 'success' ? 'success' : 'failed';
      await this.updateTransactionStatus(params.txnid, status, {
        payuMihpayid: params.mihpayid,
        payuBankRefNum: params.bank_ref_num,
        payuStatus: params.status,
        callbackAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('[PaymentService] PayU callback error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Calculate platform commission
   */
  calculateCommission(amount: number, rate: number = 0.1): number {
    return Math.round(amount * rate * 100) / 100; // 10% default, rounded to 2 decimals
  }

  /**
   * Validate UPI ID format
   */
  validateUPIId(upiId: string): boolean {
    // Basic UPI ID validation: username@bankcode
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(upiId);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export class for testing
export { PaymentService };