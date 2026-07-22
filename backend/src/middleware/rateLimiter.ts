/**
 * Rate Limiting Middleware
 * General rate limiter + OTP-specific limiter
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// In-memory store (use Redis in production)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts) {
    if (value.resetAt <= now) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * General rate limiter
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'Too many requests',
      retryAfterSeconds: retryAfter,
    });
    return;
  }

  entry.count++;
  next();
}

/**
 * OTP-specific rate limiter (3 requests per 10 minutes per phone)
 */
export function otpRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const phone = req.body?.phone || req.query?.phone || 'unknown';
  const key = `otp:${phone}`;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = config.rateLimit.otpMax;

  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt <= now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.status(429).json({
      error: 'Too many OTP requests. Please try again later.',
      retryAfterSeconds: retryAfter,
    });
    return;
  }

  entry.count++;
  next();
}