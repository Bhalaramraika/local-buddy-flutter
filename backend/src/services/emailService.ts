/**
 * Email Service - Brevo (Sendinblue) Integration
 * Supports transactional emails, templates, and bulk sending
 * Configured via BREVO_API_KEY in environment variables
 */

import { config } from '../config';
import { getMessaging } from 'firebase-admin/messaging';

interface EmailTemplate {
  templateId: number;
  params: Record<string, string>;
}

interface EmailOptions {
  to: string | string[];
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  template?: EmailTemplate;
  sender?: { name: string; email: string };
  replyTo?: { name: string; email: string };
  headers?: Record<string, string>;
  tags?: string[];
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface BulkEmailResult {
  success: boolean;
  count: number;
  messageIds: string[];
  errors: string[];
}

class EmailService {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';
  private defaultSender = {
    name: 'LocalBuddy',
    email: 'noreply@localbuddy.app',
  };

  constructor() {
    this.apiKey = config.brevo.apiKey;
    if (!this.apiKey) {
      console.warn('[EmailService] BREVO_API_KEY not configured. Email service will not work.');
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.apiKey) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const payload: Record<string, any> = {
        sender: options.sender || this.defaultSender,
        to: Array.isArray(options.to) 
          ? options.to.map(email => ({ email })) 
          : [{ email: options.to }],
        replyTo: options.replyTo,
        headers: options.headers,
        tags: options.tags,
      };

      if (options.template) {
        payload.templateId = options.template.templateId;
        payload.params = options.template.params;
      } else {
        payload.subject = options.subject || 'LocalBuddy Notification';
        payload.htmlContent = options.htmlContent || '';
        payload.textContent = options.textContent || '';
      }

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[EmailService] Brevo API error:', data);
        return { success: false, error: data.message || 'Failed to send email' };
      }

      return { success: true, messageId: data.messageId };
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send bulk emails using template
   */
  async sendBulkEmails(
    recipients: string[],
    templateId: number,
    paramsList: Record<string, string>[],
    options: Partial<EmailOptions> = {}
  ): Promise<BulkEmailResult> {
    if (!this.apiKey) {
      return { success: false, count: 0, messageIds: [], errors: ['Email service not configured'] };
    }

    if (recipients.length !== paramsList.length) {
      return { success: false, count: 0, messageIds: [], errors: ['Recipients and params length mismatch'] };
    }

    const messageIds: string[] = [];
    const errors: string[] = [];

    // Brevo supports batch sending via template
    try {
      const payload = {
        sender: options.sender || this.defaultSender,
        to: recipients.map((email, index) => ({
          email,
          params: paramsList[index],
        })),
        templateId,
        tags: options.tags,
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, count: 0, messageIds: [], errors: [data.message || 'Bulk send failed'] };
      }

      // Brevo returns a single messageId for batch
      return { success: true, count: recipients.length, messageIds: [data.messageId], errors: [] };
    } catch (error) {
      console.error('[EmailService] Bulk email error:', error);
      return { 
        success: false, 
        count: 0, 
        messageIds: [], 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Send OTP email
   */
  async sendOTPEmail(email: string, otp: string, purpose: 'login' | 'verify' | 'reset' = 'login'): Promise<EmailResult> {
    const templates: Record<string, number> = {
      login: config.brevo.templates.otpLogin,
      verify: config.brevo.templates.otpVerify,
      reset: config.brevo.templates.otpReset,
    };

    const templateId = templates[purpose] || config.brevo.templates.otpLogin;
    
    return this.sendEmail({
      to: email,
      template: {
        templateId,
        params: { OTP: otp, PURPOSE: purpose },
      },
      tags: ['otp', purpose],
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string, referralCode?: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      template: {
        templateId: config.brevo.templates.welcome,
        params: { 
          NAME: name, 
          REFERRAL_CODE: referralCode || 'N/A',
          APP_URL: config.app.url,
        },
      },
      tags: ['welcome', 'onboarding'],
    });
  }

  /**
   * Send task notification email
   */
  async sendTaskNotification(
    email: string, 
    name: string, 
    taskTitle: string, 
    taskId: string,
    type: 'assigned' | 'completed' | 'cancelled' | 'new_applicant'
  ): Promise<EmailResult> {
    const templates: Record<string, number> = {
      assigned: config.brevo.templates.taskAssigned,
      completed: config.brevo.templates.taskCompleted,
      cancelled: config.brevo.templates.taskCancelled,
      new_applicant: config.brevo.templates.newApplicant,
    };

    return this.sendEmail({
      to: email,
      template: {
        templateId: templates[type] || config.brevo.templates.taskAssigned,
        params: { 
          NAME: name, 
          TASK_TITLE: taskTitle,
          TASK_ID: taskId,
          APP_URL: `${config.app.url}/tasks/${taskId}`,
        },
      },
      tags: ['task', type],
    });
  }

  /**
   * Send wallet transaction email
   */
  async sendWalletEmail(
    email: string,
    name: string,
    amount: number,
    type: 'add' | 'release' | 'withdraw' | 'commission',
    balance: number,
    transactionId: string
  ): Promise<EmailResult> {
    const templates: Record<string, number> = {
      add: config.brevo.templates.walletAdd,
      release: config.brevo.templates.walletRelease,
      withdraw: config.brevo.templates.walletWithdraw,
      commission: config.brevo.templates.walletCommission,
    };

    return this.sendEmail({
      to: email,
      template: {
        templateId: templates[type] || config.brevo.templates.walletAdd,
        params: { 
          NAME: name, 
          AMOUNT: `₹${amount.toFixed(2)}`,
          BALANCE: `₹${balance.toFixed(2)}`,
          TRANSACTION_ID: transactionId,
          TYPE: type,
        },
      },
      tags: ['wallet', type],
    });
  }

  /**
   * Send KYC status email
   */
  async sendKYCEmail(
    email: string,
    name: string,
    status: 'verified' | 'rejected' | 'pending',
    reason?: string
  ): Promise<EmailResult> {
    const templates: Record<string, number> = {
      verified: config.brevo.templates.kycVerified,
      rejected: config.brevo.templates.kycRejected,
      pending: config.brevo.templates.kycPending,
    };

    return this.sendEmail({
      to: email,
      template: {
        templateId: templates[status] || config.brevo.templates.kycPending,
        params: { 
          NAME: name, 
          STATUS: status,
          REASON: reason || 'N/A',
        },
      },
      tags: ['kyc', status],
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, name: string, resetLink: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      template: {
        templateId: config.brevo.templates.passwordReset,
        params: { 
          NAME: name, 
          RESET_LINK: resetLink,
          EXPIRY_HOURS: '24',
        },
      },
      tags: ['password-reset', 'security'],
    });
  }

  /**
   * Send referral reward email
   */
  async sendReferralEmail(email: string, name: string, reward: number, referredName: string): Promise<EmailResult> {
    return this.sendEmail({
      to: email,
      template: {
        templateId: config.brevo.templates.referralReward,
        params: { 
          NAME: name, 
          REWARD: `₹${reward.toFixed(2)}`,
          REFERRED_NAME: referredName,
        },
      },
      tags: ['referral', 'reward'],
    });
  }

  /**
   * Send promotional/broadcast email
   */
  async sendBroadcastEmail(
    subject: string,
    htmlContent: string,
    textContent: string,
    recipientEmails: string[],
    tags: string[] = ['broadcast']
  ): Promise<BulkEmailResult> {
    if (!this.apiKey) {
      return { success: false, count: 0, messageIds: [], errors: ['Email service not configured'] };
    }

    try {
      const payload = {
        sender: this.defaultSender,
        to: recipientEmails.map(email => ({ email })),
        subject,
        htmlContent,
        textContent,
        tags,
      };

      const response = await fetch(`${this.baseUrl}/smtp/email`, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, count: 0, messageIds: [], errors: [data.message || 'Broadcast failed'] };
      }

      return { success: true, count: recipientEmails.length, messageIds: [data.messageId], errors: [] };
    } catch (error) {
      console.error('[EmailService] Broadcast error:', error);
      return { 
        success: false, 
        count: 0, 
        messageIds: [], 
        errors: [error instanceof Error ? error.message : 'Unknown error'] 
      };
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(startDate: string, endDate: string): Promise<any> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${this.baseUrl}/smtp/statistics/aggregatedReport?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: { 'api-key': this.apiKey },
        }
      );
      return await response.json();
    } catch (error) {
      console.error('[EmailService] Stats error:', error);
      return null;
    }
  }

  /**
   * Validate email address using Brevo's validation API
   */
  async validateEmail(email: string): Promise<{ valid: boolean; score?: number; error?: string }> {
    if (!this.apiKey) return { valid: false, error: 'Service not configured' };

    try {
      const response = await fetch(`${this.baseUrl}/smtp/email/validate?email=${encodeURIComponent(email)}`, {
        headers: { 'api-key': this.apiKey },
      });
      const data = await response.json();
      return { valid: data.valid, score: data.score };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Validation failed' };
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export class for testing
export { EmailService };