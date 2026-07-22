/**
 * LocalBuddy Backend Server Entry Point
 * Express server with WebSocket, Firebase, and all API routes
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { getFirebaseAdmin } from './firebase';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import chatRoutes from './routes/chats';
import walletRoutes from './routes/wallet';
import reviewRoutes from './routes/reviews';
import notificationRoutes from './routes/notifications';
import locationRoutes from './routes/location';
import adminRoutes from './routes/admin';
import webhookRoutes from './routes/webhooks';
import uploadRoutes from './routes/upload';

// Jobs
import { initializeJobs, stopJobs } from './jobs';

// WebSocket Manager
import { SocketManager } from './websocket/socketManager';

// Initialize Firebase Admin
getFirebaseAdmin();

// Create Express app
const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time features
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6, // 1MB
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================================
// Global Middleware
// ============================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
  credentials: true,
}));

// Compression
app.use(compression());

// Request logging
if (config.server.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check (no auth required)
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// ============================================================
// API Routes
// ============================================================

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/chats`, chatRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/location`, locationRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/webhooks`, webhookRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);

// 404 handler for unmatched API routes
app.use(`${API_PREFIX}/*`, (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ============================================================
// WebSocket / Socket.IO
// ============================================================

// Initialize SocketManager with the HTTP server
const socketManager = new SocketManager(httpServer);

// Initialize background jobs
initializeJobs();

// Graceful shutdown for jobs
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  stopJobs();
  socketManager.io.close();
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down...');
  stopJobs();
  socketManager.io.close();
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };