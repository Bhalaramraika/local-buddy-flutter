/**
 * Global Error Handler Middleware
 * Centralized error handling with proper HTTP status codes
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { config } from '../config';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(429, message, 'TOO_MANY_REQUESTS', { retryAfter });
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_ERROR');
  }
}

/**
 * Global error handler - must be last middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error('[Error]', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: config.server.isDev ? err.stack : undefined,
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Validation failed',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Custom app errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  // Firebase auth errors
  if (err.name === 'FirebaseAuthError') {
    const firebaseErr = err as any;
    if (firebaseErr.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (firebaseErr.code === 'auth/argument-error') {
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }
    res.status(401).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
    return;
  }

  // Firestore errors
  if (err.name === 'FirebaseFirestoreError') {
    const fsErr = err as any;
    if (fsErr.code === 'permission-denied') {
      res.status(403).json({ error: 'Permission denied', code: 'PERMISSION_DENIED' });
      return;
    }
    if (fsErr.code === 'not-found') {
      res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
      return;
    }
    if (fsErr.code === 'already-exists') {
      res.status(409).json({ error: 'Resource already exists', code: 'ALREADY_EXISTS' });
      return;
    }
  }

  // Default: internal server error
  res.status(500).json({
    error: config.server.isDev ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
  });
}