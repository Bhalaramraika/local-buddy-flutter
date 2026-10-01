/**
 * LocalBuddy Backend Server Entry Point
 * Express + Firestore (Admin SDK). Realtime is handled client-side
 * via Firestore listeners; this server exposes REST only.
 */

import express from 'express';
import 'express-async-errors'; // forwards async route rejections to errorHandler
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { config } from './config';
import { initializeFirebase } from './config/firebase';

// Initialize Firebase Admin (Firestore, Auth, Messaging) FIRST - before any route imports
initializeFirebase();

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import chatRoutes from './routes/chats';
import walletRoutes from './routes/wallet';
import reviewRoutes from './routes/reviews';
import metaRoutes from './routes/meta';
import notificationRoutes from './routes/notifications';
import referralRoutes from './routes/referral';
import sosRoutes from './routes/sos';
import locationRoutes from './routes/location';
import supportRoutes from './routes/support';
import achievementRoutes from './routes/achievements';

import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Global middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
    credentials: true,
  })
);
app.use(compression());
if (config.server.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// API routes
const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/chats`, chatRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/meta`, metaRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/referral`, referralRoutes);
app.use(`${API_PREFIX}/sos`, sosRoutes);
app.use(`${API_PREFIX}/location`, locationRoutes);
app.use(`${API_PREFIX}/support`, supportRoutes);
app.use(`${API_PREFIX}/achievements`, achievementRoutes);

app.use(`${API_PREFIX}/*`, (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Centralized error handler
app.use(errorHandler);

const server = app.listen(config.server.port, config.server.host, () => {
  console.log(
    `[Server] LocalBuddy API listening on http://${config.server.host}:${config.server.port} (${config.server.nodeEnv})`
  );
});

const shutdown = (signal: string) => {
  console.log(`[Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Last-resort safety nets so a single bad request never kills the server
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
});

export { app, server };
