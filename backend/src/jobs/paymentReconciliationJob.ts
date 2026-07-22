/**
 * Payment Reconciliation Job
 * Reconciles PayU payments, handles failed transactions, processes refunds
 */

import { CronJob } from 'cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';
import { paymentService } from '../services/paymentService';
import { emailService } from '../services/emailService';
import { pushNotificationService } from '../services/pushNotificationService';

export class PaymentReconciliationJob {
  private jobs: CronJob[] = [];

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs(): void {
    // Every 15 minutes - reconcile pending payments
    this.jobs.push(new CronJob('*/15 * * * *', () => this.reconcilePendingPayments(), null, true, 'Asia/Kolkata'));

    // Every hour - check stuck payments
    this.jobs.push(new CronJob('0 * * * *', () => this.checkStuckPayments(), null, true, 'Asia/Kolkata'));

    // Daily at 3 AM - full reconciliation report
    this.jobs.push(new CronJob('0 3 * * *', () => this.runFullReconciliation(), null, true, 'Asia/Kolkata'));

    // Daily at 4 AM - process pending refunds
    this.jobs.push(new CronJob('0 4 * * *', () => this.processPendingRefunds(), null, true, 'Asia/Kolkata'));

    // Every 6 hours - verify PayU webhook deliveries
    this.jobs.push(new CronJob('0 */6 * * *', () => this.verifyWebhookDeliveries(), null, true, 'Asia/Kolkata'));

    // Weekly on Sunday 2 AM - audit all transactions
    this.jobs.push(new CronJob('0 2 * * 0', () => this.auditTransactions(), null, true, 'Asia/Kolkata'));
  }

  /**
   * Reconcile pending payments with PayU
   */
  private async reconcilePendingPayments(): Promise<void> {
    logger.info('[PaymentReconciliationJob] Starting pending payment reconciliation...');
    const startTime = Date.now();

    try {
      // Find payments stuck in PROCESSING or PENDING for more than 10 minutes
      const cutoff = new Date(Date.now() - 10 * 60 * 1000);
      
      const pendingPayments = await prisma.paymentOrder.findMany({
        where: {
          status: { in: ['PROCESSING', 'PENDING'] },
          createdAt: { lt: cutoff },
          // Only PayU payments
          gateway: 'PAYU',
        },
        include: {
          user: { select: { id: true, email: true, name: true, fcmToken: true } },
          task: { select: { id: true, title: true } },
        },
      });

      logger.info(`[PaymentReconciliationJob] Found ${pendingPayments.length} pending payments to reconcile`);

      for (const payment of pendingPayments) {
        await this.reconcileSinglePayment(payment);
      }

      logger.info(`[PaymentReconciliationJob] Reconciliation completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      logger.error('[PaymentReconciliationJob] Reconciliation failed:', error);
    }
  }

  /**
   * Reconcile a single payment with PayU
   */
  private async reconcileSinglePayment(payment: any): Promise<void> {
    try {
      // Query PayU for payment status
      const payuStatus = await paymentService.verifyPayUPayment(payment.gatewayOrderId);

      if (!payuStatus) {
        logger.warn(`[PaymentReconciliationJob] Could not verify payment ${payment.id} with PayU`);
        return;
      }

      const newStatus = this.mapPayUStatus(payuStatus.status);
      
      if (newStatus !== payment.status) {
        // Update payment status
        await prisma.paymentOrder.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            gatewayResponse: payuStatus,
            updatedAt: new Date(),
          },
        });

        // Handle status change
        await this.handlePaymentStatusChange(payment, newStatus, payuStatus);

        logger.info(`[PaymentReconciliationJob] Payment ${payment.id} status updated: ${payment.status} -> ${newStatus}`);
      }
    } catch (error) {
      logger.error(`[PaymentReconciliationJob] Failed to reconcile payment ${payment.id}:`, error);
    }
  }

  /**
   * Map PayU status to internal status
   */
  private mapPayUStatus(payuStatus: string): string {
    const statusMap: Record<string, string> = {
      'success': 'COMPLETED',
      'failure': 'FAILED',
      'pending': 'PENDING',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'chargeback': 'CHARGEBACK',
    };
    return statusMap[payuStatus.toLowerCase()] || 'UNKNOWN';
  }

  /**
   * Handle payment status change side effects
   */
  private async handlePaymentStatusChange(payment: any, newStatus: string, payuResponse: any): Promise<void> {
    const { user, task } = payment;

    switch (newStatus) {
      case 'COMPLETED':
        await this.handlePaymentCompleted(payment, user, task, payuResponse);
        break;
      case 'FAILED':
        await this.handlePaymentFailed(payment, user, task, payuResponse);
        break;
      case 'REFUNDED':
        await this.handlePaymentRefunded(payment, user, task, payuResponse);
        break;
      case 'CANCELLED':
        await this.handlePaymentCancelled(payment, user, task);
        break;
    }
  }

  private async handlePaymentCompleted(payment: any, user: any, task: any, payuResponse: any): Promise<void> {
    // 1. Credit wallet if it's a wallet deposit
    if (payment.type === 'WALLET_DEPOSIT') {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { increment: payment.amount } },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          amount: payment.amount,
          status: 'COMPLETED',
          description: `Wallet deposit via PayU`,
          referenceId: payment.id,
          gateway: 'PAYU',
          gatewayTransactionId: payuResponse.mihpayid,
        },
      });
    }

    // 2. If it's a task payment, update task status
    if (payment.type === 'TASK_PAYMENT' && task) {
      await prisma.task.update({
        where: { id: task.id },
        data: { paymentStatus: 'PAID', paidAt: new Date() },
      });

      // Notify task poster
      await this.sendNotification(user.id, {
        title: 'Payment Successful',
        body: `Your payment of ₹${payment.amount} for "${task.title}" was successful`,
        data: { paymentId: payment.id, taskId: task.id, type: 'PAYMENT_SUCCESS' },
        type: 'PAYMENT_SUCCESS',
      });
    }

    // 3. Send success notification
    await this.sendNotification(user.id, {
      title: 'Payment Completed',
      body: `Your payment of ₹${payment.amount} has been processed successfully`,
      data: { paymentId: payment.id, type: 'PAYMENT_COMPLETED' },
      type: 'PAYMENT_COMPLETED',
    });
  }

  private async handlePaymentFailed(payment: any, user: any, task: any, payuResponse: any): Promise<void> {
    // 1. Update payment with failure reason
    await prisma.paymentOrder.update({
      where: { id: payment.id },
      data: {
        failureReason: payuResponse.error || payuResponse.error_message || 'Payment failed',
        failureCode: payuResponse.error_code,
      },
    });

    // 2. If task payment, update task
    if (payment.type === 'TASK_PAYMENT' && task) {
      await prisma.task.update({
        where: { id: task.id },
        data: { paymentStatus: 'FAILED' },
      });
    }

    // 3. Send failure notification
    await this.sendNotification(user.id, {
      title: 'Payment Failed',
      body: `Your payment of ₹${payment.amount} could not be processed. Reason: ${payuResponse.error || 'Unknown error'}`,
      data: { paymentId: payment.id, type: 'PAYMENT_FAILED', reason: payuResponse.error },
      type: 'PAYMENT_FAILED',
    });

    // 4. If wallet deposit failed, notify user to retry
    if (payment.type === 'WALLET_DEPOSIT') {
      await this.sendNotification(user.id, {
        title: 'Wallet Deposit Failed',
        body: 'Your wallet deposit failed. Please try again or contact support.',
        data: { paymentId: payment.id, type: 'WALLET_DEPOSIT_FAILED' },
        type: 'WALLET_DEPOSIT_FAILED',
      });
    }
  }

  private async handlePaymentRefunded(payment: any, user: any, task: any, payuResponse: any): Promise<void> {
    // 1. Debit wallet if it was a wallet deposit
    if (payment.type === 'WALLET_DEPOSIT') {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: payment.amount } },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'REFUND',
          amount: -payment.amount,
          status: 'COMPLETED',
          description: `Refund for wallet deposit`,
          referenceId: payment.id,
          gateway: 'PAYU',
          gatewayTransactionId: payuResponse.mihpayid,
        },
      });
    }

    // 2. If task payment refunded
    if (payment.type === 'TASK_PAYMENT' && task) {
      await prisma.task.update({
        where: { id: task.id },
        data: { paymentStatus: 'REFUNDED' },
      });
    }

    // 3. Send refund notification
    await this.sendNotification(user.id, {
      title: 'Refund Processed',
      body: `A refund of ₹${payment.amount} has been processed to your account`,
      data: { paymentId: payment.id, type: 'REFUND_PROCESSED' },
      type: 'REFUND_PROCESSED',
    });
  }

  private async handlePaymentCancelled(payment: any, user: any, task: any): Promise<void> {
    // 1. If task payment, update task
    if (payment.type === 'TASK_PAYMENT' && task) {
      await prisma.task.update({
        where: { id: task.id },
        data: { paymentStatus: 'CANCELLED' },
      });
    }

    // 2. Send cancellation notification
    await this.sendNotification(user.id, {
      title: 'Payment Cancelled',
      body: `Your payment of ₹${payment.amount} was cancelled`,
      data: { paymentId: payment.id, type: 'PAYMENT_CANCELLED' },
      type: 'PAYMENT_CANCELLED',
    });
  }

  /**
   * Check for stuck payments (in PROCESSING for too long)
   */
  private async checkStuckPayments(): Promise<void> {
    logger.info('[PaymentReconciliationJob] Checking for stuck payments...');

    try {
      // Payments stuck in PROCESSING for more than 30 minutes
      const cutoff = new Date(Date.now() - 30 * 60 * 1000);
      
      const stuckPayments = await prisma.paymentOrder.findMany({
        where: {
          status: 'PROCESSING',
          updatedAt: { lt: cutoff },
          gateway: 'PAYU',
        },
        include: {
          user: { select: { id: true, email: true, name: true, fcmToken: true } },
        },
      });

      for (const payment of stuckPayments) {
        // Force reconciliation
        await this.reconcileSinglePayment(payment);
        
        // If still processing after reconciliation, alert admin
        const updated = await prisma.paymentOrder.findUnique({ where: { id: payment.id } });
        if (updated?.status === 'PROCESSING') {
          await this.alertAdminStuckPayment(payment);
        }
      }

      logger.info(`[PaymentReconciliationJob] Checked ${stuckPayments.length} stuck payments`);
    } catch (error) {
      logger.error('[PaymentReconciliationJob] Stuck payment check failed:', error);
    }
  }

  /**
   * Run full daily reconciliation
   */
  private async runFullReconciliation(): Promise<void> {
    logger.info('[PaymentReconciliationJob] Starting full daily reconciliation...');
    const startTime = Date.now();

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      // Get all payments from yesterday
      const payments = await prisma.paymentOrder.findMany({
        where: {
          createdAt: { gte: yesterday, lt: today },
          gateway: 'PAYU',
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      let reconciled = 0;
      let discrepancies = 0;

      for (const payment of payments) {
        if (payment.status === 'COMPLETED' || payment.status === 'FAILED' || payment.status === 'REFUNDED') {
          // Verify with PayU
          const payuStatus = await paymentService.verifyPayUPayment(payment.gatewayOrderId);
          
          if (payuStatus) {
            const expectedStatus = this.mapPayUStatus(payuStatus.status);
            if (expectedStatus !== payment.status) {
              discrepancies++;
              logger.warn(`[PaymentReconciliationJob] Discrepancy found for payment ${payment.id}: DB=${payment.status}, PayU=${expectedStatus}`);
              
              // Auto-fix
              await prisma.paymentOrder.update({
                where: { id: payment.id },
                data: { status: expectedStatus, gatewayResponse: payuStatus },
              });
              
              await this.handlePaymentStatusChange(payment, expectedStatus, payuStatus);
            } else {
              reconciled++;
            }
          }
        }
      }

      // Generate reconciliation report
      const report = {
        date: yesterday.toISOString().split('T')[0],
        totalPayments: payments.length,
        reconciled,
        discrepancies,
        completed: payments.filter(p => p.status === 'COMPLETED').length,
        failed: payments.filter(p => p.status === 'FAILED').length,
        refunded: payments.filter(p => p.status === 'REFUNDED').length,
        pending: payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      };

      // Save report
      await prisma.reconciliationReport.create({ data: report });

      // Email report to admins
      await this.emailReconciliationReport(report);

      logger.info(`[PaymentReconciliationJob] Full reconciliation completed in ${Date.now() - startTime}ms`, report);
    } catch (error) {
      logger.error('[PaymentReconciliationJob] Full reconciliation failed:', error);
    }
  }

  /**
   * Process pending refunds
   */
  private async processPendingRefunds(): Promise<void> {
    logger.info('[PaymentReconciliationJob] Processing pending refunds...');

    try {
      const pendingRefunds = await prisma.refundRequest.findMany({
        where: { status: 'PENDING' },
        include: {
          payment: { include: { user: { select: { id: true, email: true, name: true } } } },
        },
        take: 50,
      });

      for (const refund of pendingRefunds) {
        try {
          // Process refund via PayU
          const result = await paymentService.processPayURefund(
            refund.payment.gatewayTransactionId!,
            refund.amount,
            refund.reason
          );

          if (result.success) {
            await prisma.refundRequest.update({
              where: { id: refund.id },
              data: {
                status: 'PROCESSING',
                gatewayRefundId: result.refundId,
                processedAt: new Date(),
              },
            });

            // Notify user
            await this.sendNotification(refund.payment.userId, {
              title: 'Refund Initiated',
              body: `Your refund of ₹${refund.amount} has been initiated. It will reflect in 5-7 business days.`,
              data: { refundId: refund.id, type: 'REFUND_INITIATED' },
              type: 'REFUND_INITIATED',
            });
          } else {
            await prisma.refundRequest.update({
              where: { id: refund.id },
              data: { status: 'FAILED', failureReason: result.error },
            });
          }
        } catch (error) {
          logger.error(`[PaymentReconciliationJob] Failed to process refund ${refund.id}:`, error);
        }
      }

      logger.info(`[PaymentReconciliationJob] Processed ${pendingRefunds.length} pending refunds`);
    } catch (error) {
      logger.error('[PaymentReconciliationJob] Pending refund processing failed:', error);
    }
  }

  /**
   * Verify webhook deliveries
   */
  private async verifyWebhookDeliveries(): Promise<void> {
    logger.info('[PaymentReconciliationJob] Verifying webhook deliveries...');

    try {
      // Find webhook events that haven't been processed
      const unprocessedWebhooks = await prisma.webhookEvent.findMany({
        where: {
          processed: false,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      for (const webhook of unprocessedWebhooks) {
        try {
          // Process based on type
          await this.processWebhookEvent(webhook);
          
          await prisma.webhookEvent.update({
            where: { id: webhook.id },
            data: { processed: true, processedAt: new Date() },
          });
        } catch (error) {
          logger.error(`[PaymentReconciliationJob] Failed to process webhook ${webhook.id}:`, error);
          
          // Increment retry count
          await prisma.webhookEvent.update({
            where: { id: webhook.id },
            data: { 
              retryCount: { increment: 1 },
              lastError: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }

      logger.info(`[PaymentReconciliationJob] Verified ${unprocessedWebhooks.length} webhook deliveries`);
    } catch (error) {
      logger.error('[PaymentReconciliationJob] Webhook verification failed:', error);
    }
  }

  private async processWebhookEvent(webhook: any): Promise<void> {
    const payload = webhook.payload as any;
    
    switch (webhook.type) {
      case 'PAYU_PAYMENT':
        // Already handled by webhook endpoint, but double-check
        if (payload.paymentId) {
          const payment = await prisma.paymentOrder.findUnique({ where: { id: payload.paymentId } });
          if (payment && payment.status !== 'COMPLETED') {
            await this.reconcileSinglePayment(payment);
          }
        }
        break;
      case 'PAYU_REFUND':
        if (payload.refundId) {
          const refund = await prisma.refundRequest.findUnique({ where: { gatewayRefundId: payload.refundId } });
          if (refund && refund.status !== 'COMPLETED') {
            await prisma.refundRequest.update({
              where: { id: refund.id },
              data: { status: 'COMPLETED', completedAt: new Date() },
            });
          }
        }
        break;
    }
  }

  /**
   * Audit all transactions weekly
   */
  private async auditTransactions(): Promise<void> {
    logger.info('[PaymentReconciliationJob] Starting weekly transaction audit...');
    const startTime = Date.now();

    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // Check wallet balances match transaction history
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, wallet: { select: { balance: true } } },
      });

      let balanceMismatches = 0;

      for (const user of users) {
        const calculatedBalance = await this.calculateWalletBalance(user.id);
        const actualBalance = user.wallet?.balance || 0;

        if (Math.abs(calculatedBalance - actualBalance) > 0.01) {
          balanceMismatches++;
          logger.warn(`[PaymentReconciliationJob] Balance mismatch for user ${user.id}: calculated=${calculatedBalance}, actual=${actualBalance}`);
          
          // Auto-correct
          await prisma.wallet.update({
            where: { userId: user.id },
            data: { balance: calculatedBalance },
          });
        }
      }

      // Check for duplicate transactions
      const duplicates = await this.findDuplicateTransactions(weekAgo);

      // Check for orphaned transactions (no payment order)
      const orphans = await this.findOrphanedTransactions(weekAgo);

      const auditReport = {
        periodStart: weekAgo,
        periodEnd: new Date(),
        usersAudited: users.length,
        balanceMismatches,
        duplicateTransactions: duplicates.length,
        orphanedTransactions: orphans.length,
      };

      await prisma.auditReport.create({ data: auditReport });
      await this.emailAuditReport(auditReport);

      logger.info(`[PaymentReconciliationJob] Weekly audit completed in ${Date.now() - startTime}ms`, auditReport);
    } catch (error) {
      logger.error('[PaymentReconciliationJob] Weekly audit failed:', error);
    }
  }

  private async calculateWalletBalance(userId: string): Promise<number> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      select: { amount: true, type: true, status: true },
    });

    let balance = 0;
    for (const tx of transactions) {
      if (tx.status !== 'COMPLETED') continue;
      
      switch (tx.type) {
        case 'DEPOSIT':
        case 'EARNING':
        case 'REFUND':
        case 'CASHBACK':
          balance += tx.amount;
          break;
        case 'WITHDRAWAL':
        case 'SPENDING':
        case 'FEE':
        case 'PENALTY':
          balance -= tx.amount;
          break;
      }
    }

    return balance;
  }

  private async findDuplicateTransactions(since: Date): Promise<any[]> {
    // Find transactions with same gatewayTransactionId
    const duplicates = await prisma.transaction.groupBy({
      by: ['gatewayTransactionId'],
      where: {
        gatewayTransactionId: { not: null },
        createdAt: { gte: since },
      },
      _count: { id: true },
      having: { id: { _count: { gt: 1 } } },
    });

    return duplicates;
  }

  private async findOrphanedTransactions(since: Date): Promise<any[]> {
    // Transactions without corresponding payment order (for task payments)
    const orphans = await prisma.transaction.findMany({
      where: {
        type: 'SPENDING',
        referenceId: { not: null },
        createdAt: { gte: since },
        paymentOrder: null, // This would need a relation
      },
    });

    return orphans;
  }

  /**
   * Send notification to user
   */
  private async sendNotification(userId: string, notification: {
    title: string;
    body: string;
    data: any;
    type: string;
  }): Promise<void> {
    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        type: notification.type,
        read: false,
      },
    });

    // Get user for push
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, email: true, preferences: true },
    });

    if (!user) return;

    const prefs = user.preferences as any || {};
    if (prefs.notifications?.[notification.type] === false) return;

    // Push notification
    if (user.fcmToken) {
      await pushNotificationService.sendToToken(user.fcmToken, {
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    }
  }

  /**
   * Alert admin about stuck payment
   */
  private async alertAdminStuckPayment(payment: any): Promise<void> {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true, fcmToken: true, email: true },
    });

    for (const admin of admins) {
      await this.sendNotification(admin.id, {
        title: '⚠️ Stuck Payment Alert',
        body: `Payment ${payment.id} (₹${payment.amount}) stuck in PROCESSING for >30 min`,
        data: { paymentId: payment.id, type: 'ADMIN_STUCK_PAYMENT' },
        type: 'ADMIN_STUCK_PAYMENT',
      });
    }
  }

  /**
   * Email reconciliation report to admins
   */
  private async emailReconciliationReport(report: any): Promise<void> {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { email: true },
    });

    for (const admin of admins) {
      await emailService.sendReconciliationReport(admin.email, report);
    }
  }

  /**
   * Email audit report to admins
   */
  private async emailAuditReport(report: any): Promise<void> {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true },
      select: { email: true },
    });

    for (const admin of admins) {
      await emailService.sendAuditReport(admin.email, report);
    }
  }

  /**
   * Start all jobs
   */
  public start(): void {
    this.jobs.forEach(job => job.start());
    logger.info('[PaymentReconciliationJob] All payment reconciliation jobs started');
  }

  /**
   * Stop all jobs
   */
  public stop(): void {
    this.jobs.forEach(job => job.stop());
    logger.info('[PaymentReconciliationJob] All payment reconciliation jobs stopped');
  }

  /**
   * Trigger a specific job manually (for testing)
   */
  public async triggerJob(jobName: string): Promise<void> {
    switch (jobName) {
      case 'reconcile':
        await this.reconcilePendingPayments();
        break;
      case 'stuckPayments':
        await this.checkStuckPayments();
        break;
      case 'fullReconciliation':
        await this.runFullReconciliation();
        break;
      case 'pendingRefunds':
        await this.processPendingRefunds();
        break;
      case 'webhooks':
        await this.verifyWebhookDeliveries();
        break;
      case 'audit':
        await this.auditTransactions();
        break;
    }
  }
}

export const paymentReconciliationJob = new PaymentReconciliationJob();