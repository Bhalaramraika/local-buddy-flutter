/**
 * Push Notification Service - Firebase FCM Integration
 * Supports FCM v1 HTTP API with topics, tokens, and conditions
 * Configured via Firebase Admin SDK (service account)
 */

import { getMessaging, Messaging, Message, BatchResponse, MulticastMessage } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from '../config';

interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

interface PushOptions {
  tokens?: string[];
  topic?: string;
  condition?: string;
  notification: NotificationPayload;
  android?: {
    priority?: 'high' | 'normal';
    notification?: {
      channelId?: string;
      icon?: string;
      color?: string;
      sound?: string;
      clickAction?: string;
    };
    data?: Record<string, string>;
  };
  apns?: {
    payload?: {
      aps: {
        alert: { title: string; body: string };
        badge?: number;
        sound?: string;
        'content-available'?: 1;
        'mutable-content'?: 1;
      };
    };
    headers?: Record<string, string>;
  };
  webpush?: {
    notification?: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    };
    fcmOptions?: { link: string };
  };
  data?: Record<string, string>;
  token?: string;
}

interface SendResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  responses: Array<{ success: boolean; messageId?: string; error?: string }>;
  multicastId?: number;
}

interface TopicSubscriptionResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
}

class PushNotificationService {
  private messaging: Messaging;
  private db = getFirestore();

  constructor() {
    this.messaging = getMessaging();
  }

  /**
   * Send notification to a single device token
   */
  async sendToToken(token: string, options: PushOptions): Promise<SendResult> {
    try {
      const message: Message = {
        token,
        notification: options.notification ? {
          title: options.notification.title,
          body: options.notification.body,
          imageUrl: options.notification.imageUrl,
        } : undefined,
        data: options.data || options.notification.data,
        android: options.android ? {
          priority: options.android.priority || 'high',
          notification: options.android.notification ? {
            channelId: options.android.notification.channelId || 'default',
            icon: options.android.notification.icon || 'ic_notification',
            color: options.android.notification.color || '#FF6B35',
            sound: options.android.notification.sound || 'default',
            clickAction: options.android.notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
          } : undefined,
          data: options.android.data,
        } : undefined,
        apns: options.apns ? {
          payload: options.apns.payload,
          headers: options.apns.headers,
        } : undefined,
        webpush: options.webpush ? {
          notification: options.webpush.notification,
          fcmOptions: options.webpush.fcmOptions,
        } : undefined,
      };

      const messageId = await this.messaging.send(message);
      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true, messageId }],
      };
    } catch (error) {
      console.error('[PushNotificationService] Error sending to token:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        responses: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  /**
   * Send notification to multiple device tokens (multicast)
   */
  async sendToTokens(tokens: string[], options: PushOptions): Promise<SendResult> {
    if (!tokens.length) {
      return { success: true, successCount: 0, failureCount: 0, responses: [] };
    }

    // FCM multicast limit is 500 tokens per request
    const chunks = this.chunkArray(tokens, 500);
    let totalSuccess = 0;
    let totalFailure = 0;
    const allResponses: SendResult['responses'] = [];

    for (const chunk of chunks) {
      try {
        const message: MulticastMessage = {
          tokens: chunk,
          notification: options.notification ? {
            title: options.notification.title,
            body: options.notification.body,
            imageUrl: options.notification.imageUrl,
          } : undefined,
          data: options.data || options.notification.data,
          android: options.android ? {
            priority: options.android.priority || 'high',
            notification: options.android.notification ? {
              channelId: options.android.notification.channelId || 'default',
              icon: options.android.notification.icon || 'ic_notification',
              color: options.android.notification.color || '#FF6B35',
              sound: options.android.notification.sound || 'default',
              clickAction: options.android.notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
            } : undefined,
            data: options.android.data,
          } : undefined,
          apns: options.apns ? {
            payload: options.apns.payload,
            headers: options.apns.headers,
          } : undefined,
          webpush: options.webpush ? {
            notification: options.webpush.notification,
            fcmOptions: options.webpush.fcmOptions,
          } : undefined,
        };

        const response: BatchResponse = await this.messaging.sendEachForMulticast(message);
        
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;
        allResponses.push(...response.responses.map(r => ({
          success: r.success,
          messageId: r.messageId,
          error: r.error?.message,
        })));

        // Handle invalid tokens - remove from user's FCM tokens
        await this.handleInvalidTokens(chunk, response.responses);
      } catch (error) {
        console.error('[PushNotificationService] Multicast error:', error);
        totalFailure += chunk.length;
        allResponses.push(...chunk.map(() => ({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })));
      }
    }

    return {
      success: totalFailure === 0,
      successCount: totalSuccess,
      failureCount: totalFailure,
      responses: allResponses,
    };
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(topic: string, options: PushOptions): Promise<SendResult> {
    try {
      const message: Message = {
        topic,
        notification: options.notification ? {
          title: options.notification.title,
          body: options.notification.body,
          imageUrl: options.notification.imageUrl,
        } : undefined,
        data: options.data || options.notification.data,
        android: options.android ? {
          priority: options.android.priority || 'high',
          notification: options.android.notification ? {
            channelId: options.android.notification.channelId || 'default',
            icon: options.android.notification.icon || 'ic_notification',
            color: options.android.notification.color || '#FF6B35',
            sound: options.android.notification.sound || 'default',
            clickAction: options.android.notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
          } : undefined,
          data: options.android.data,
        } : undefined,
        apns: options.apns ? {
          payload: options.apns.payload,
          headers: options.apns.headers,
        } : undefined,
        webpush: options.webpush ? {
          notification: options.webpush.notification,
          fcmOptions: options.webpush.fcmOptions,
        } : undefined,
      };

      const messageId = await this.messaging.send(message);
      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true, messageId }],
      };
    } catch (error) {
      console.error('[PushNotificationService] Error sending to topic:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        responses: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  /**
   * Send notification based on condition (e.g., "'topic1' in topics && 'topic2' in topics")
   */
  async sendToCondition(condition: string, options: PushOptions): Promise<SendResult> {
    try {
      const message: Message = {
        condition,
        notification: options.notification ? {
          title: options.notification.title,
          body: options.notification.body,
          imageUrl: options.notification.imageUrl,
        } : undefined,
        data: options.data || options.notification.data,
        android: options.android ? {
          priority: options.android.priority || 'high',
          notification: options.android.notification ? {
            channelId: options.android.notification.channelId || 'default',
            icon: options.android.notification.icon || 'ic_notification',
            color: options.android.notification.color || '#FF6B35',
            sound: options.android.notification.sound || 'default',
            clickAction: options.android.notification.clickAction || 'FLUTTER_NOTIFICATION_CLICK',
          } : undefined,
          data: options.android.data,
        } : undefined,
        apns: options.apns ? {
          payload: options.apns.payload,
          headers: options.apns.headers,
        } : undefined,
        webpush: options.webpush ? {
          notification: options.webpush.notification,
          fcmOptions: options.webpush.fcmOptions,
        } : undefined,
      };

      const messageId = await this.messaging.send(message);
      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        responses: [{ success: true, messageId }],
      };
    } catch (error) {
      console.error('[PushNotificationService] Error sending to condition:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        responses: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<TopicSubscriptionResult> {
    if (!tokens.length) {
      return { success: true, successCount: 0, failureCount: 0, errors: [] };
    }

    try {
      const response = await this.messaging.subscribeToTopic(tokens, topic);
      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors.map(e => e.error.message),
      };
    } catch (error) {
      console.error('[PushNotificationService] Subscribe error:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<TopicSubscriptionResult> {
    if (!tokens.length) {
      return { success: true, successCount: 0, failureCount: 0, errors: [] };
    }

    try {
      const response = await this.messaging.unsubscribeFromTopic(tokens, topic);
      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        errors: response.errors.map(e => e.error.message),
      };
    } catch (error) {
      console.error('[PushNotificationService] Unsubscribe error:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Send notification to a user by userId (fetches their FCM tokens)
   */
  async sendToUser(userId: string, options: PushOptions): Promise<SendResult> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return { success: false, successCount: 0, failureCount: 0, responses: [{ success: false, error: 'User not found' }] };
      }

      const userData = userDoc.data();
      const tokens = userData?.fcmTokens || [];

      if (!tokens.length) {
        return { success: true, successCount: 0, failureCount: 0, responses: [] };
      }

      // Filter valid tokens (non-empty strings)
      const validTokens = tokens.filter((t: string) => t && t.length > 0);
      
      if (!validTokens.length) {
        return { success: true, successCount: 0, failureCount: 0, responses: [] };
      }

      return this.sendToTokens(validTokens, options);
    } catch (error) {
      console.error('[PushNotificationService] Error sending to user:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        responses: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  /**
   * Send notification to multiple users by userIds
   */
  async sendToUsers(userIds: string[], options: PushOptions): Promise<SendResult> {
    if (!userIds.length) {
      return { success: true, successCount: 0, failureCount: 0, responses: [] };
    }

    let totalSuccess = 0;
    let totalFailure = 0;
    const allResponses: SendResult['responses'] = [];

    // Process in batches to avoid too many parallel requests
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(id => this.sendToUser(id, options)));
      
      for (const result of results) {
        totalSuccess += result.successCount;
        totalFailure += result.failureCount;
        allResponses.push(...result.responses);
      }
    }

    return {
      success: totalFailure === 0,
      successCount: totalSuccess,
      failureCount: totalFailure,
      responses: allResponses,
    };
  }

  /**
   * Send task-related notifications
   */
  async sendTaskNotification(
    userId: string,
    type: 'assigned' | 'completed' | 'cancelled' | 'new_applicant' | 'payment_released',
    taskData: { taskId: string; title: string; amount?: number; buddyName?: string }
  ): Promise<SendResult> {
    const notifications: Record<string, { title: string; body: string }> = {
      assigned: {
        title: 'Task Assigned! 🎉',
        body: `You've been assigned to "${taskData.title}". Tap to view details.`,
      },
      completed: {
        title: 'Task Completed ✅',
        body: `"${taskData.title}" has been marked as completed.`,
      },
      cancelled: {
        title: 'Task Cancelled ❌',
        body: `"${taskData.title}" has been cancelled.`,
      },
      new_applicant: {
        title: 'New Applicant 📝',
        body: `${taskData.buddyName || 'A buddy'} applied for "${taskData.title}".`,
      },
      payment_released: {
        title: 'Payment Released 💰',
        body: `₹${taskData.amount?.toFixed(2) || '0'} released for "${taskData.title}".`,
      },
    };

    const notification = notifications[type];
    if (!notification) {
      return { success: false, successCount: 0, failureCount: 0, responses: [{ success: false, error: 'Invalid notification type' }] };
    }

    return this.sendToUser(userId, {
      notification: {
        ...notification,
        data: { type, taskId: taskData.taskId, title: taskData.title, amount: String(taskData.amount ?? ''), buddyName: taskData.buddyName || '' },
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'tasks',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
        data: { type, taskId: taskData.taskId, screen: 'task_detail' },
      },
      apns: {
        payload: {
          aps: {
            alert: { title: notification.title, body: notification.body },
            badge: 1,
            sound: 'default',
            'content-available': 1,
          },
        },
      },
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/badge-72.png',
        },
        fcmOptions: { link: `/tasks/${taskData.taskId}` },
      },
    });
  }

  /**
   * Send wallet-related notifications
   */
  async sendWalletNotification(
    userId: string,
    type: 'add_money' | 'money_released' | 'withdrawal' | 'commission' | 'low_balance',
    data: { amount: number; balance: number; transactionId?: string }
  ): Promise<SendResult> {
    const notifications: Record<string, { title: string; body: string }> = {
      add_money: {
        title: 'Money Added 💳',
        body: `₹${data.amount.toFixed(2)} added to your wallet. New balance: ₹${data.balance.toFixed(2)}`,
      },
      money_released: {
        title: 'Payment Released 💰',
        body: `₹${data.amount.toFixed(2)} released to your wallet. Balance: ₹${data.balance.toFixed(2)}`,
      },
      withdrawal: {
        title: 'Withdrawal Initiated 🏦',
        body: `₹${data.amount.toFixed(2)} withdrawal requested. Balance: ₹${data.balance.toFixed(2)}`,
      },
      commission: {
        title: 'Commission Earned 💼',
        body: `You earned ₹${data.amount.toFixed(2)} commission. Balance: ₹${data.balance.toFixed(2)}`,
      },
      low_balance: {
        title: 'Low Balance Warning ⚠️',
        body: `Your wallet balance is ₹${data.balance.toFixed(2)}. Add money to continue posting tasks.`,
      },
    };

    const notification = notifications[type];
    if (!notification) {
      return { success: false, successCount: 0, failureCount: 0, responses: [{ success: false, error: 'Invalid notification type' }] };
    }

    return this.sendToUser(userId, {
      notification: {
        ...notification,
        data: { type, amount: String(data.amount), balance: String(data.balance), transactionId: data.transactionId || '' },
      },
      android: {
        priority: 'high',
        notification: { channelId: 'wallet', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
        data: { type, screen: 'wallet', amount: String(data.amount), balance: String(data.balance) },
      },
      apns: {
        payload: {
          aps: {
            alert: { title: notification.title, body: notification.body },
            badge: 1,
            sound: 'default',
          },
        },
      },
      webpush: {
        notification: { title: notification.title, body: notification.body, icon: '/icons/icon-192.png' },
        fcmOptions: { link: '/wallet' },
      },
    });
  }

  /**
   * Send chat/message notifications
   */
  async sendChatNotification(
    userId: string,
    data: { chatId: string; senderName: string; message: string; senderId: string }
  ): Promise<SendResult> {
    return this.sendToUser(userId, {
      notification: {
        title: data.senderName,
        body: data.message.length > 100 ? data.message.substring(0, 100) + '...' : data.message,
        data: { type: 'chat', chatId: data.chatId, senderId: data.senderId },
      },
      android: {
        priority: 'high',
        notification: { channelId: 'chat', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
        data: { type: 'chat', chatId: data.chatId, senderId: data.senderId, screen: 'chat' },
      },
      apns: {
        payload: {
          aps: {
            alert: { title: data.senderName, body: data.message },
            badge: 1,
            sound: 'default',
            'content-available': 1,
            'mutable-content': 1,
          },
        },
      },
      webpush: {
        notification: { title: data.senderName, body: data.message, icon: '/icons/icon-192.png' },
        fcmOptions: { link: `/chat/${data.chatId}` },
      },
    });
  }

  /**
   * Send KYC status notification
   */
  async sendKYCNotification(
    userId: string,
    status: 'verified' | 'rejected' | 'pending',
    reason?: string
  ): Promise<SendResult> {
    const notifications: Record<string, { title: string; body: string }> = {
      verified: {
        title: 'KYC Verified ✅',
        body: 'Your KYC has been verified. You can now access all features.',
      },
      rejected: {
        title: 'KYC Rejected ❌',
        body: `Your KYC was rejected. Reason: ${reason || 'Please check your documents and resubmit.'}`,
      },
      pending: {
        title: 'KYC Under Review ⏳',
        body: 'Your KYC documents are under review. You\'ll be notified once verified.',
      },
    };

    const notification = notifications[status];
    return this.sendToUser(userId, {
      notification: {
        ...notification,
        data: { type: 'kyc', status, reason: reason || '' },
      },
      android: { priority: 'high', notification: { channelId: 'kyc' }, data: { type: 'kyc', status, screen: 'kyc' } },
      apns: { payload: { aps: { alert: { title: notification.title, body: notification.body }, badge: 1 } } },
      webpush: { notification: { title: notification.title, body: notification.body }, fcmOptions: { link: '/kyc' } },
    });
  }

  /**
   * Send referral notification
   */
  async sendReferralNotification(
    userId: string,
    data: { referredName: string; reward: number }
  ): Promise<SendResult> {
    return this.sendToUser(userId, {
      notification: {
        title: 'Referral Reward! 🎁',
        body: `${data.referredName} signed up using your code. You earned ₹${data.reward.toFixed(2)}!`,
        data: { type: 'referral', referredName: data.referredName, reward: String(data.reward) },
      },
      android: { priority: 'high', notification: { channelId: 'referral' }, data: { type: 'referral', screen: 'referral' } },
      apns: { payload: { aps: { alert: { title: 'Referral Reward!', body: `You earned ₹${data.reward.toFixed(2)}` }, badge: 1 } } },
      webpush: { notification: { title: 'Referral Reward!', body: `You earned ₹${data.reward.toFixed(2)}` }, fcmOptions: { link: '/referral' } },
    });
  }

  /**
   * Send broadcast notification to all active users
   */
  async sendBroadcastNotification(
    notification: NotificationPayload,
    options: { userRole?: string; minAppVersion?: string } = {}
  ): Promise<SendResult> {
    try {
      // Build query for active users
      let query = this.db.collection('users').where('isActive', '==', true);
      
      if (options.userRole) {
        query = query.where('role', '==', options.userRole);
      }

      const snapshot = await query.get();
      const userIds = snapshot.docs.map(doc => doc.id);

      if (!userIds.length) {
        return { success: true, successCount: 0, failureCount: 0, responses: [] };
      }

      return this.sendToUsers(userIds, {
        notification: {
          ...notification,
          data: { type: 'broadcast', ...notification.data },
        },
        android: { priority: 'high', notification: { channelId: 'broadcast' }, data: { type: 'broadcast', screen: 'home' } },
        apns: { payload: { aps: { alert: { title: notification.title, body: notification.body }, badge: 1 } } },
        webpush: { notification: { title: notification.title, body: notification.body }, fcmOptions: { link: '/' } },
      });
    } catch (error) {
      console.error('[PushNotificationService] Broadcast error:', error);
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        responses: [{ success: false, error: error instanceof Error ? error.message : 'Unknown error' }],
      };
    }
  }

  /**
   * Save FCM token for a user
   */
  async saveFCMToken(userId: string, token: string): Promise<boolean> {
    try {
      const userRef = this.db.collection('users').doc(userId);
      await userRef.update({
        fcmTokens: FieldValue.arrayUnion(token),
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Error saving FCM token:', error);
      return false;
    }
  }

  /**
   * Remove FCM token for a user
   */
  async removeFCMToken(userId: string, token: string): Promise<boolean> {
    try {
      const userRef = this.db.collection('users').doc(userId);
      await userRef.update({
        fcmTokens: FieldValue.arrayRemove(token),
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Error removing FCM token:', error);
      return false;
    }
  }

  /**
   * Get user's FCM tokens
   */
  async getUserFCMTokens(userId: string): Promise<string[]> {
    try {
      const userDoc = await this.db.collection('users').doc(userId).get();
      return userDoc.data()?.fcmTokens || [];
    } catch (error) {
      console.error('[PushNotificationService] Error getting FCM tokens:', error);
      return [];
    }
  }

  /**
   * Handle invalid tokens from multicast response
   */
  private async handleInvalidTokens(tokens: string[], responses: BatchResponse['responses']): Promise<void> {
    const invalidTokens: string[] = [];
    
    responses.forEach((response, index) => {
      if (!response.success && response.error) {
        const errorCode = response.error.code;
        // FCM error codes for invalid tokens
        if (errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-argument') {
          invalidTokens.push(tokens[index]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      // Find users with these tokens and remove them
      try {
        const snapshot = await this.db.collection('users')
          .where('fcmTokens', 'array-contains-any', invalidTokens)
          .get();

        const batch = this.db.batch();
        snapshot.docs.forEach(doc => {
          const userData = doc.data();
          const updatedTokens = (userData.fcmTokens || []).filter((t: string) => !invalidTokens.includes(t));
          batch.update(doc.ref, { fcmTokens: updatedTokens, updatedAt: new Date().toISOString() });
        });
        await batch.commit();
        console.log(`[PushNotificationService] Removed ${invalidTokens.length} invalid tokens from ${snapshot.docs.length} users`);
      } catch (error) {
        console.error('[PushNotificationService] Error cleaning invalid tokens:', error);
      }
    }
  }

  /**
   * Utility: chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Import FieldValue for array operations
import { FieldValue } from 'firebase-admin/firestore';

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export { PushNotificationService };