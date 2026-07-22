/**
 * Cleanup Job
 * Runs periodically to clean up expired data, old files, stale sessions
 */

import { CronJob } from 'cron';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';
import { supabaseAdmin } from '../config/supabase';
import { storage } from '../config/firebase';

export class CleanupJob {
  private jobs: CronJob[] = [];

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs(): void {
    // Daily cleanup at 2 AM
    this.jobs.push(new CronJob('0 2 * * *', () => this.runDailyCleanup(), null, true, 'Asia/Kolkata'));

    // Hourly cleanup for expired sessions
    this.jobs.push(new CronJob('0 * * * *', () => this.runHourlyCleanup(), null, true, 'Asia/Kolkata'));

    // Weekly deep cleanup on Sunday 3 AM
    this.jobs.push(new CronJob('0 3 * * 0', () => this.runWeeklyCleanup(), null, true, 'Asia/Kolkata'));
  }

  /**
   * Daily cleanup tasks
   */
  private async runDailyCleanup(): Promise<void> {
    logger.info('[CleanupJob] Starting daily cleanup...');
    const startTime = Date.now();

    try {
      // 1. Clean expired OTP codes (older than 24 hours)
      await this.cleanExpiredOTPs();

      // 2. Clean expired password reset tokens (older than 1 hour)
      await this.cleanExpiredResetTokens();

      // 3. Clean expired email verification tokens (older than 24 hours)
      await this.cleanExpiredVerificationTokens();

      // 4. Clean stale chat typing indicators (older than 30 seconds)
      await this.cleanStaleTypingIndicators();

      // 5. Clean expired task assignments (older than 24 hours unaccepted)
      await this.cleanExpiredTaskAssignments();

      // 6. Clean old notification read receipts (older than 90 days)
      await this.cleanOldReadReceipts();

      // 7. Clean temporary upload files (older than 24 hours)
      await this.cleanTempUploadFiles();

      logger.info(`[CleanupJob] Daily cleanup completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      logger.error('[CleanupJob] Daily cleanup failed:', error);
    }
  }

  /**
   * Hourly cleanup tasks
   */
  private async runHourlyCleanup(): Promise<void> {
    logger.info('[CleanupJob] Starting hourly cleanup...');

    try {
      // 1. Clean expired user sessions (JWT blacklist)
      await this.cleanExpiredSessions();

      // 2. Clean stale location sharing sessions (older than 1 hour)
      await this.cleanStaleLocationSessions();

      // 3. Clean expired payment orders (older than 30 minutes unpaid)
      await this.cleanExpiredPaymentOrders();

      logger.info('[CleanupJob] Hourly cleanup completed');
    } catch (error) {
      logger.error('[CleanupJob] Hourly cleanup failed:', error);
    }
  }

  /**
   * Weekly deep cleanup tasks
   */
  private async runWeeklyCleanup(): Promise<void> {
    logger.info('[CleanupJob] Starting weekly deep cleanup...');
    const startTime = Date.now();

    try {
      // 1. Clean old chat messages (older than 1 year, keep last 1000 per chat)
      await this.cleanOldChatMessages();

      // 2. Clean old audit logs (older than 2 years)
      await this.cleanOldAuditLogs();

      // 3. Clean orphaned files in storage (not referenced in DB)
      await this.cleanOrphanedFiles();

      // 4. Clean inactive users (no login for 1 year, not verified)
      await this.cleanInactiveUsers();

      // 5. Rebuild search indexes
      await this.rebuildSearchIndexes();

      // 6. Update user statistics aggregates
      await this.updateUserStatistics();

      logger.info(`[CleanupJob] Weekly cleanup completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      logger.error('[CleanupJob] Weekly cleanup failed:', error);
    }
  }

  // ============================================================
  // Individual Cleanup Methods
  // ============================================================

  private async cleanExpiredOTPs(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.otpCode.deleteMany({
      where: { createdAt: { lt: cutoff }, used: false },
    });
    logger.info(`[CleanupJob] Deleted ${result.count} expired OTP codes`);
  }

  private async cleanExpiredResetTokens(): Promise<void> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const result = await prisma.passwordResetToken.deleteMany({
      where: { createdAt: { lt: cutoff }, used: false },
    });
    logger.info(`[CleanupJob] Deleted ${result.count} expired reset tokens`);
  }

  private async cleanExpiredVerificationTokens(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.emailVerificationToken.deleteMany({
      where: { createdAt: { lt: cutoff }, used: false },
    });
    logger.info(`[CleanupJob] Deleted ${result.count} expired verification tokens`);
  }

  private async cleanStaleTypingIndicators(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 1000);
    const result = await prisma.typingIndicator.deleteMany({
      where: { updatedAt: { lt: cutoff } },
    });
    logger.info(`[CleanupJob] Deleted ${result.count} stale typing indicators`);
  }

  private async cleanExpiredTaskAssignments(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await prisma.taskAssignment.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      data: { status: 'EXPIRED' },
    });
    logger.info(`[CleanupJob] Expired ${result.count} pending task assignments`);
  }

  private async cleanOldReadReceipts(): Promise<void> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const result = await prisma.notificationReadReceipt.deleteMany({
      where: { readAt: { lt: cutoff } },
    });
    logger.info(`[CleanupJob] Deleted ${result.count} old read receipts`);
  }

  private async cleanTempUploadFiles(): Promise<void> {
    try {
      const bucket = storage.bucket();
      const [files] = await bucket.getFiles({ prefix: 'temp/' });
      
      let deleted = 0;
      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const created = new Date(metadata.timeCreated).getTime();
        if (Date.now() - created > 24 * 60 * 60 * 1000) {
          await file.delete();
          deleted++;
        }
      }
      logger.info(`[CleanupJob] Deleted ${deleted} temporary upload files`);
    } catch (error) {
      logger.error('[CleanupJob] Failed to clean temp files:', error);
    }
  }

  private async cleanExpiredSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
    const result = await prisma.userSession.deleteMany({
      where: { lastActivityAt: { lt: cutoff }, revoked: true },
    });
    logger.info(`[CleanupJob] Deleted ${result.count} expired sessions`);
  }

  private async cleanStaleLocationSessions(): Promise<void> {
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    const result = await prisma.locationSession.updateMany({
      where: { status: 'ACTIVE', updatedAt: { lt: cutoff } },
      data: { status: 'EXPIRED', endedAt: new Date() },
    });
    logger.info(`[CleanupJob] Expired ${result.count} stale location sessions`);
  }

  private async cleanExpiredPaymentOrders(): Promise<void> {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const result = await prisma.paymentOrder.updateMany({
      where: { status: 'CREATED', createdAt: { lt: cutoff } },
      data: { status: 'EXPIRED' },
    });
    logger.info(`[CleanupJob] Expired ${result.count} payment orders`);
  }

  private async cleanOldChatMessages(): Promise<void> {
    // Keep last 1000 messages per chat, delete older than 1 year
    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    
    // This is a complex operation - in production, use a more efficient approach
    // For now, we'll log that this is a placeholder for the actual implementation
    logger.info('[CleanupJob] Old chat messages cleanup - implement with batch processing');
  }

  private async cleanOldAuditLogs(): Promise<void> {
    const cutoff = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    const result = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    logger.info(`[CleanupJob] Deleted ${result.count} old audit logs`);
  }

  private async cleanOrphanedFiles(): Promise<void> {
    logger.info('[CleanupJob] Orphaned files cleanup - implement with storage audit');
    // This would require listing all files and checking DB references
  }

  private async cleanInactiveUsers(): Promise<void> {
    const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const result = await prisma.user.updateMany({
      where: {
        lastLoginAt: { lt: cutoff },
        emailVerified: false,
        isActive: true,
      },
      data: { isActive: false, deactivatedAt: new Date(), deactivationReason: 'INACTIVE_1_YEAR' },
    });
    logger.info(`[CleanupJob] Deactivated ${result.count} inactive unverified users`);
  }

  private async rebuildSearchIndexes(): Promise<void> {
    logger.info('[CleanupJob] Search index rebuild - implement with Algolia/Meilisync');
  }

  private async updateUserStatistics(): Promise<void> {
    logger.info('[CleanupJob] User statistics update - implement with aggregation queries');
  }

  /**
   * Start all jobs
   */
  public start(): void {
    this.jobs.forEach(job => job.start());
    logger.info('[CleanupJob] All cleanup jobs started');
  }

  /**
   * Stop all jobs
   */
  public stop(): void {
    this.jobs.forEach(job => job.stop());
    logger.info('[CleanupJob] All cleanup jobs stopped');
  }

  /**
   * Run a specific cleanup manually (for testing)
   */
  public async runManualCleanup(type: 'daily' | 'hourly' | 'weekly'): Promise<void> {
    switch (type) {
      case 'daily':
        await this.runDailyCleanup();
        break;
      case 'hourly':
        await this.runHourlyCleanup();
        break;
      case 'weekly':
        await this.runWeeklyCleanup();
        break;
    }
  }
}

// Export singleton instance
export const cleanupJob = new CleanupJob();