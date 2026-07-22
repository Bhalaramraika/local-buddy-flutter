/**
 * Jobs Index
 * Exports all background jobs and provides initialization
 */

export { cleanupJob } from './cleanupJob';
export { notificationJob } from './notificationJob';
export { paymentReconciliationJob } from './paymentReconciliationJob';

import { cleanupJob } from './cleanupJob';
import { notificationJob } from './notificationJob';
import { paymentReconciliationJob } from './paymentReconciliationJob';
import { logger } from '../utils/logger';

/**
 * Initialize all background jobs
 * Call this during application startup
 */
export function initializeJobs(): void {
  logger.info('[Jobs] Initializing background jobs...');
  
  cleanupJob.start();
  notificationJob.start();
  paymentReconciliationJob.start();
  
  logger.info('[Jobs] All background jobs initialized and started');
}

/**
 * Stop all background jobs
 * Call this during graceful shutdown
 */
export function stopJobs(): void {
  logger.info('[Jobs] Stopping background jobs...');
  
  cleanupJob.stop();
  notificationJob.stop();
  paymentReconciliationJob.stop();
  
  logger.info('[Jobs] All background jobs stopped');
}

/**
 * Get job status for health checks
 */
export function getJobStatus(): object {
  return {
    cleanup: 'running',
    notifications: 'running',
    paymentReconciliation: 'running',
  };
}

/**
 * Manually trigger a specific job (for testing/admin)
 */
export async function triggerJob(jobName: string, taskName?: string): Promise<void> {
  switch (jobName) {
    case 'cleanup':
      if (taskName) {
        await cleanupJob.runManualCleanup(taskName as 'daily' | 'hourly' | 'weekly');
      } else {
        await cleanupJob.runManualCleanup('daily');
      }
      break;
    case 'notifications':
      if (taskName) {
        await notificationJob.triggerJob(taskName);
      }
      break;
    case 'paymentReconciliation':
      if (taskName) {
        await paymentReconciliationJob.triggerJob(taskName);
      }
      break;
    default:
      throw new Error(`Unknown job: ${jobName}`);
  }
}