/**
 * Worker Entry Point
 * Runs background jobs as a separate process
 * Usage: NODE_ENV=production node dist/worker.js
 */

import { initializeJobs } from './jobs';
import { logger } from './utils/logger';

logger.info('[Worker] Starting background worker process...');

// Initialize all background jobs
initializeJobs();

// Handle graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`[Worker] Received ${signal}, shutting down gracefully...`);
  // Jobs are stopped via stopJobs() if needed
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Keep process alive
setInterval(() => {
  // Heartbeat log every 5 minutes
  logger.debug('[Worker] Heartbeat - jobs running');
}, 5 * 60 * 1000);

logger.info('[Worker] Background worker started successfully');