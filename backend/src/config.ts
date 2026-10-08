/**
 * Environment Configuration
 * Loads and validates all environment variables
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  server: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    databaseURL: process.env.FIREBASE_DATABASE_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiry: process.env.JWT_EXPIRY || '7d',
  },

  payu: {
    merchantKey: process.env.PAYU_MERCHANT_KEY || '',
    merchantSalt: process.env.PAYU_MERCHANT_SALT || '',
    baseUrl: process.env.PAYU_BASE_URL || 'https://test.payu.in',
  },

  mojoauth: {
    apiKey: process.env.MOJOAUTH_API_KEY || '',
    apiSecret: process.env.MOJOAUTH_API_SECRET || '',
    baseUrl: process.env.MOJOAUTH_BASE_URL || 'https://api.mojoauth.com',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    otpMax: parseInt(process.env.OTP_RATE_LIMIT_MAX || '3', 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },

  app: {
    url: process.env.APP_URL || 'http://localhost:3000',
    // Public URL where THIS API is reachable (PayU redirects surl/furl here).
    // Set API_PUBLIC_URL on Render, e.g. https://localbuddy-api.onrender.com
    // (NOT the app URL — PayU must POST back to this server).
    apiUrl: process.env.API_PUBLIC_URL || '',
  },
} as const;

// Validate critical config in production
if (!config.server.isDev) {
  const required = [
    ['FIREBASE_PRIVATE_KEY', config.firebase.privateKey],
    ['JWT_SECRET', config.jwt.secret],
    ['PAYU_MERCHANT_KEY', config.payu.merchantKey],
    ['PAYU_MERCHANT_SALT', config.payu.merchantSalt],
    ['MOJOAUTH_API_KEY', config.mojoauth.apiKey],
  ];

  for (const [name, value] of required) {
    if (!value || value.includes('your_') || value.includes('YOUR_KEY')) {
      console.error(`[CONFIG] Missing required env var: ${name}`);
      process.exit(1);
    }
  }
}