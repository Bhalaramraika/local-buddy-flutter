/**
 * Authentication Middleware
 * Verifies Firebase ID tokens and attaches user context
 */

import { Request, Response, NextFunction } from 'express';
import { verifyIdToken } from './firebase';
import { collections } from './models';

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        phone: string;
        role: string;
        firebaseUser: any;
        userDoc?: any;
      };
    }
  }
}

/**
 * Required auth middleware - rejects unauthenticated requests
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify Firebase ID token
    const decodedToken = await verifyIdToken(token);

    // Fetch user document from Firestore
    const userDoc = await collections.users.doc(decodedToken.uid).get();
    const userData = userDoc.data();

    // Check if user is banned/suspended
    if (userData?.status === 'banned') {
      res.status(403).json({ error: 'Account has been banned', code: 'ACCOUNT_BANNED' });
      return;
    }
    if (userData?.status === 'suspended') {
      res.status(403).json({ error: 'Account is temporarily suspended', code: 'ACCOUNT_SUSPENDED' });
      return;
    }

    req.user = {
      uid: decodedToken.uid,
      phone: decodedToken.phone_number || userData?.phone || '',
      role: userData?.role || 'customer',
      firebaseUser: decodedToken,
      userDoc: userData,
    };

    next();
  } catch (err: any) {
    if (err.code === 'auth/id-token-expired') {
      res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      return;
    }
    if (err.code === 'auth/argument-error') {
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      return;
    }
    console.error('[Auth Middleware] Error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional auth middleware - attaches user if token present, but doesn't reject
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      next();
      return;
    }

    const decodedToken = await verifyIdToken(token);
    const userDoc = await collections.users.doc(decodedToken.uid).get();

    req.user = {
      uid: decodedToken.uid,
      phone: decodedToken.phone_number || userDoc.data()?.phone || '',
      role: userDoc.data()?.role || 'customer',
      firebaseUser: decodedToken,
      userDoc: userDoc.data(),
    };
  } catch {
    // Silently continue without user context
  }
  next();
}

/**
 * Role-based access control middleware factory
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions', requiredRoles: roles });
      return;
    }
    next();
  };
}

/**
 * KYC verification middleware - blocks if KYC not completed
 */
export function requireKYC(req: Request, res: Response, next: NextFunction): void {
  if (!req.user?.userDoc) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const kycStatus = req.user.userDoc.kyc?.status;
  if (kycStatus !== 'verified') {
    res.status(403).json({
      error: 'KYC verification required',
      code: 'KYC_REQUIRED',
      kycStatus: kycStatus || 'not_started',
    });
    return;
  }
  next();
}

/**
 * Alias for requireAuth - used by admin routes
 */
export const authMiddleware = requireAuth;