/**
 * Webhook Controller
 * Handles incoming webhooks from external services (PayU, Supabase, internal services)
 */

import { Request, Response } from 'express';
import { config } from '../config';
import { collections, timestamp } from '../models';
import { FieldValue } from 'firebase-admin/firestore';
import { sendPushNotification } from '../services/pushNotificationService';
import { sendSMS } from '../services/smsService';

export class WebhookController {
  /**
   * Handle PayU payment success callback
   */
  async handlePayUSuccess(req: Request, res: Response): Promise<void> {
    await this.handlePayUCallback(req, res, 'success');
  }

  /**
   * Handle PayU payment failure callback
   */
  async handlePayUFailure(req: Request, res: Response): Promise<void> {
    await this.handlePayUCallback(req, res, 'failed');
  }

  /**
   * Handle PayU payment cancel callback
   */
  async handlePayUCancel(req: Request, res: Response): Promise<void> {
    await this.handlePayUCallback(req, res, 'cancelled');
  }

  /**
   * Handle PayU server-to-server webhook
   */
  async handlePayUWebhook(req: Request, res: Response): Promise<void> {
    try {
      const params = req.body;
      const txnid = params.txnid;
      const status = params.status === 'success' ? 'success' : 'failed';
      const amount = parseFloat(params.amount);

      console.log('[PayU Webhook] Received:', { txnid, status, amount });

      // Find the transaction
      const txnSnap = await collections.transactions.where('txnid', '==', txnid).limit(1).get();
      
      if (txnSnap.empty) {
        console.error('[PayU Webhook] Transaction not found:', txnid);
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }

      const txnDoc = txnSnap.docs[0];
      const transaction = txnDoc.data();

      // Check if already processed
      if (transaction.status !== 'pending') {
        console.warn('[PayU Webhook] Transaction already processed:', txnid);
        res.json({ success: true, message: 'Already processed' });
        return;
      }

      // Update transaction and wallet in a transaction
      await collections.firestore.runTransaction(async (t) => {
        if (status === 'success') {
          // Update wallet balance
          t.update(collections.users.doc(transaction.userId), {
            'wallet.balance': FieldValue.increment(amount),
            updatedAt: timestamp(),
          });

          t.update(txnDoc.ref, {
            status: 'success',
            updatedAt: timestamp(),
            metadata: { ...transaction.metadata, payuResponse: params },
          });
        } else {
          t.update(txnDoc.ref, {
            status: 'failed',
            updatedAt: timestamp(),
            metadata: { ...transaction.metadata, payuResponse: params },
          });
        }
      });

      // Send notification to user
      try {
        await sendPushNotification(transaction.userId, {
          title: status === 'success' ? 'Payment Successful' : 'Payment Failed',
          body: status === 'success' 
            ? `₹${amount} has been added to your wallet`
            : `Payment of ₹${amount} failed. Please try again.`,
          data: { type: 'wallet_transaction', txnid, status },
        });
      } catch (notifyErr) {
        console.error('[PayU Webhook] Notification failed:', notifyErr);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[PayU Webhook] Error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Handle Firebase Auth user created webhook
   */
  async handleUserCreated(req: Request, res: Response): Promise<void> {
    try {
      const { uid, email, phoneNumber, displayName, photoURL, disabled, emailVerified, metadata, providerData, customClaims } = req.body;
      
      console.log('[Firebase Auth] User created:', uid);

      // Create user profile in Firestore if not exists
      const userRef = collections.users.doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({
          uid,
          email: email || '',
          phoneNumber: phoneNumber || '',
          displayName: displayName || '',
          photoURL: photoURL || '',
          disabled: disabled || false,
          emailVerified: emailVerified || false,
          role: 'customer',
          isOnline: false,
          wallet: { balance: 0, currency: 'INR' },
          createdAt: timestamp(),
          updatedAt: timestamp(),
          metadata: metadata || {},
          providerData: providerData || [],
          customClaims: customClaims || {},
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[Firebase Auth] User created error:', error);
      res.status(500).json({ error: 'User creation handling failed' });
    }
  }

  /**
   * Handle Firebase Auth user deleted webhook
   */
  async handleUserDeleted(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.body;
      
      console.log('[Firebase Auth] User deleted:', uid);

      // Soft delete - mark as deleted
      await collections.users.doc(uid).update({
        deleted: true,
        deletedAt: timestamp(),
        updatedAt: timestamp(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error('[Firebase Auth] User deleted error:', error);
      res.status(500).json({ error: 'User deletion handling failed' });
    }
  }

  /**
   * Handle Firebase Auth user signed in webhook
   */
  async handleUserSignedIn(req: Request, res: Response): Promise<void> {
    try {
      const { uid, metadata } = req.body;
      
      console.log('[Firebase Auth] User signed in:', uid);

      // Update last sign in time
      await collections.users.doc(uid).update({
        lastSignInAt: timestamp(),
        updatedAt: timestamp(),
        'metadata.lastSignInTime': metadata?.lastSignInTime,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('[Firebase Auth] User signed in error:', error);
      res.status(500).json({ error: 'Sign in handling failed' });
    }
  }

  /**
   * Handle Supabase chat message webhook
   */
  async handleChatMessage(req: Request, res: Response): Promise<void> {
    try {
      const { type, record } = req.body;
      
      console.log('[Supabase Chat] Message event:', type, record?.id);

      if (type === 'INSERT' && record) {
        // New message - notify recipient if not sender
        if (record.senderId !== record.recipientId) {
          await sendPushNotification(record.recipientId, {
            title: 'New Message',
            body: record.content?.substring(0, 100) || 'You have a new message',
            data: { type: 'new_message', chatId: record.chatId, messageId: record.id },
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[Supabase Chat] Error:', error);
      res.status(500).json({ error: 'Chat webhook processing failed' });
    }
  }

  /**
   * Handle Supabase task updated webhook
   */
  async handleTaskUpdated(req: Request, res: Response): Promise<void> {
    try {
      const { type, record, old_record } = req.body;
      
      console.log('[Supabase Task] Task event:', type, record?.id);

      if (type === 'UPDATE' && record && old_record) {
        // Task updated - check for status changes
        if (record.status !== old_record.status) {
          console.log('[Task Update] Status changed:', old_record.status, '->', record.status);
          
          // Notify relevant parties
          if (record.status === 'assigned' && record.buddyId) {
            await sendPushNotification(record.buddyId, {
              title: 'New Task Assigned',
              body: `You have been assigned: ${record.title}`,
              data: { type: 'task_assigned', taskId: record.id },
            });
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[Supabase Task] Error:', error);
      res.status(500).json({ error: 'Task webhook processing failed' });
    }
  }

  /**
   * Handle Supabase location updated webhook
   */
  async handleLocationUpdated(req: Request, res: Response): Promise<void> {
    try {
      const { record } = req.body;
      
      if (!record || !record.user_id) {
        res.status(400).json({ error: 'Invalid location data' });
        return;
      }

      // Update user's last known location in Firestore
      await collections.users.doc(record.user_id).update({
        'location.latitude': record.latitude,
        'location.longitude': record.longitude,
        'location.accuracy': record.accuracy,
        'location.heading': record.heading,
        'location.speed': record.speed,
        'location.updatedAt': timestamp(),
      });

      // Broadcast to nearby buddies if user is a buddy
      const userDoc = await collections.users.doc(record.user_id).get();
      const user = userDoc.data();
      
      if (user?.role === 'buddy' && user.isOnline) {
        // Notify nearby customers (handled by location service)
        console.log('[Location Webhook] Buddy location updated:', record.user_id);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[Location Webhook] Error:', error);
      res.status(500).json({ error: 'Location update failed' });
    }
  }

  /**
   * Handle internal job completion webhooks
   */
  async handleJobComplete(req: Request, res: Response): Promise<void> {
    try {
      const { jobId, jobType, status, result, error, completedAt } = req.body;
      
      console.log('[Job Complete Webhook] Received:', { jobId, jobType, status });

      // Update job status in Firestore
      const jobRef = collections.jobs.doc(jobId);
      await jobRef.update({
        status,
        result,
        error,
        completedAt: completedAt || timestamp(),
        updatedAt: timestamp(),
      });

      // Handle specific job types
      switch (jobType) {
        case 'payment_reconciliation':
          if (status === 'completed' && result) {
            await this.handlePaymentReconciliationResult(result);
          }
          break;
        case 'notification_batch':
          if (status === 'completed' && result) {
            console.log('[Job Complete] Notification batch sent:', result.sentCount);
          }
          break;
        case 'cleanup':
          console.log('[Job Complete] Cleanup job finished');
          break;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('[Job Complete Webhook] Error:', error);
      res.status(500).json({ error: 'Job completion handling failed' });
    }
  }

  /**
   * Handle internal notification trigger webhooks
   */
  async handleNotificationTrigger(req: Request, res: Response): Promise<void> {
    try {
      const { userIds, title, body, data, priority, category } = req.body;
      
      console.log('[Notification Trigger] Sending to:', userIds.length, 'users');

      const results = await Promise.allSettled(
        userIds.map(userId => sendPushNotification(userId, { title, body, data, priority, category }))
      );

      const sentCount = results.filter(r => r.status === 'fulfilled').length;
      const failedCount = results.filter(r => r.status === 'rejected').length;

      console.log('[Notification Trigger] Sent:', sentCount, 'Failed:', failedCount);

      res.json({ success: true, sent: sentCount, failed: failedCount });
    } catch (error) {
      console.error('[Notification Trigger] Error:', error);
      res.status(500).json({ error: 'Notification trigger failed' });
    }
  }

  // ============================================================
  // Private Helper Methods
  // ============================================================

  private async handlePayUCallback(req: Request, res: Response, status: 'success' | 'failed' | 'cancelled'): Promise<void> {
    try {
      const params = req.body;
      const txnid = params.txnid;
      const amount = parseFloat(params.amount);

      console.log('[PayU Callback] Received:', { txnid, status, amount });

      // Find the transaction
      const txnSnap = await collections.transactions.where('txnid', '==', txnid).limit(1).get();
      
      if (txnSnap.empty) {
        console.error('[PayU Callback] Transaction not found:', txnid);
        const redirectUrl = `${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=failed&txnid=${txnid}`;
        res.redirect(redirectUrl);
        return;
      }

      const txnDoc = txnSnap.docs[0];
      const transaction = txnDoc.data();

      // Check if already processed
      if (transaction.status !== 'pending') {
        console.warn('[PayU Callback] Transaction already processed:', txnid);
        const redirectUrl = `${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=${status}&txnid=${txnid}`;
        res.redirect(redirectUrl);
        return;
      }

      // Update transaction and wallet in a transaction
      await collections.firestore.runTransaction(async (t) => {
        if (status === 'success') {
          // Update wallet balance
          t.update(collections.users.doc(transaction.userId), {
            'wallet.balance': FieldValue.increment(amount),
            updatedAt: timestamp(),
          });

          t.update(txnDoc.ref, {
            status: 'success',
            updatedAt: timestamp(),
            metadata: { ...transaction.metadata, payuResponse: params },
          });
        } else {
          t.update(txnDoc.ref, {
            status: 'failed',
            updatedAt: timestamp(),
            metadata: { ...transaction.metadata, payuResponse: params },
          });
        }
      });

      // Send notification to user
      try {
        await sendPushNotification(transaction.userId, {
          title: status === 'success' ? 'Payment Successful' : 'Payment Failed',
          body: status === 'success' 
            ? `₹${amount} has been added to your wallet`
            : `Payment of ₹${amount} failed. Please try again.`,
          data: { type: 'wallet_transaction', txnid, status },
        });
      } catch (notifyErr) {
        console.error('[PayU Callback] Notification failed:', notifyErr);
      }

      // Redirect back to app
      const redirectUrl = `${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=${status}&txnid=${txnid}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('[PayU Callback] Error:', error);
      const redirectUrl = `${config.server.isDev ? 'http://localhost:8081' : 'https://app.localbuddy.app'}/wallet?status=error`;
      res.redirect(redirectUrl);
    }
  }

  private async handlePaymentReconciliationResult(result: any): Promise<void> {
    console.log('[Payment Reconciliation] Result:', result);
    // Handle any follow-up actions from payment reconciliation
  }
}