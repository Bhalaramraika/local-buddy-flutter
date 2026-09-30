/**
 * Auth Routes
 * OTP send/verify, email auth, custom tokens
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAuth } from '../config/firebase';
import { collections, OTPSession, runTransaction, timestamp } from '../models';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { otpRateLimiter } from '../middleware/rateLimiter';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../middleware/errorHandler';

const router = Router();

// ============================================================
// Schemas
// ============================================================

const sendOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
});

const verifyOtpSchema = z.object({
  email: z.string().email().toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const refreshTokenSchema = z.object({
  uid: z.string().min(1),
});

// ============================================================
// MojoAuth Helpers
// ============================================================

const MOJOAUTH_BASE_URL = process.env.MOJOAUTH_BASE_URL || 'https://api.mojoauth.com';
const MOJOAUTH_API_KEY = process.env.MOJOAUTH_API_KEY;
const MOJOAUTH_API_SECRET = process.env.MOJOAUTH_API_SECRET;

function mojoAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': MOJOAUTH_API_KEY!,
  };
  if (MOJOAUTH_API_SECRET) headers['X-API-Secret'] = MOJOAUTH_API_SECRET;
  return headers;
}

interface MojoAuthSendResponse {
  state_id?: string;
  message?: string;
  error?: string;
}

interface MojoAuthVerifyResponse {
  access_token?: string;
  refresh_token?: string;
  user?: { email: string };
  message?: string;
  error?: string;
}

async function sendEmailOtp(email: string): Promise<string> {
  if (!MOJOAUTH_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[MojoAuth] MOJOAUTH_API_KEY not configured, logging OTP to console');
      console.log(`[MojoAuth] To ${email}: Your LocalBuddy OTP is 123456. Valid for 10 minutes.`);
      return `dev-${email}`;
    }
    throw new Error('MojoAuth not configured');
  }

  try {
    const url = `${MOJOAUTH_BASE_URL}/users/emailotp?email=${encodeURIComponent(email)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: mojoAuthHeaders(),
      body: JSON.stringify({ email }),
    });

    const data = (await response.json()) as MojoAuthSendResponse;

    if (data.error || !data.state_id) {
      console.error('[MojoAuth] Send error:', data);
      throw new Error(data.error || data.message || 'Failed to send OTP');
    }

    console.log(`[MojoAuth] OTP sent to ${email}`);
    return data.state_id;
  } catch (error) {
    console.error('[MojoAuth] Failed to send OTP:', error);
    throw error;
  }
}

async function verifyEmailOtp(stateId: string, otp: string): Promise<{ email: string }> {
  if (!MOJOAUTH_API_KEY) {
    if (process.env.NODE_ENV !== 'production') {
      if (otp !== '123456') {
        throw new Error('Invalid development OTP. Use 123456.');
      }
      return { email: stateId.replace('dev-', '') };
    }
    throw new Error('MojoAuth not configured');
  }

  try {
    const url = `${MOJOAUTH_BASE_URL}/users/emailotp/verify?state_id=${encodeURIComponent(stateId)}&otp=${encodeURIComponent(otp)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: mojoAuthHeaders(),
      body: JSON.stringify({ state_id: stateId, otp }),
    });

    const data = (await response.json()) as MojoAuthVerifyResponse;

    if (data.error || !data.user?.email) {
      console.error('[MojoAuth] Verify error:', data);
      throw new Error(data.error || data.message || 'Invalid OTP');
    }

    console.log(`[MojoAuth] OTP verified for ${data.user.email}`);
    return { email: data.user.email };
  } catch (error) {
    console.error('[MojoAuth] Failed to verify OTP:', error);
    throw error;
  }
}

async function checkUserLock(email: string): Promise<void> {
  const lockDoc = await collections.userLocks.doc(email).get();
  if (lockDoc.exists) {
    const lock = lockDoc.data()!;
    if (new Date(lock.lockedUntil) > new Date()) {
      throw new UnauthorizedError(`Account locked until ${lock.lockedUntil}. Reason: ${lock.reason}`);
    }
  }
}

async function incrementLockAttempts(email: string): Promise<void> {
  const lockRef = collections.userLocks.doc(email);
  const lockDoc = await lockRef.get();
  
  if (!lockDoc.exists) {
    await lockRef.set({
      email,
      reason: 'Too many failed OTP attempts',
      attempts: 1,
      lockedUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min lock
      createdAt: timestamp(),
    });
    return;
  }
  
  const lock = lockDoc.data()!;
  if (lock.attempts >= 5) {
    await lockRef.update({
      lockedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour lock
    });
  } else {
    await lockRef.update({ attempts: lock.attempts + 1 });
  }
}

// ============================================================
// Routes
// ============================================================

/**
 * POST /api/v1/auth/otp/send
 * Send OTP to email
 */
router.post(
  '/otp/send',
  otpRateLimiter,
  validateBody(sendOtpSchema),
  async (req: Request, res: Response) => {
    const { email } = req.body;

    await checkUserLock(email);

    const stateId = await sendEmailOtp(email);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store OTP session (without OTP - MojoAuth holds it)
    await collections.otpSessions.doc(email).set({
      email,
      stateId,
      attempts: 0,
      expiresAt,
      createdAt: timestamp(),
      verified: false,
      // Dev fallback only - don't store OTP in production
      ...(process.env.NODE_ENV !== 'production' && !MOJOAUTH_API_KEY && { otp: '123456' }),
    });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 600, // seconds
    });
  }
);

/**
 * POST /api/v1/auth/otp/verify
 * Verify OTP and return custom token
 */
router.post(
  '/otp/verify',
  validateBody(verifyOtpSchema),
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const sessionDoc = await collections.otpSessions.doc(email).get();
    if (!sessionDoc.exists) {
      throw new BadRequestError('OTP not found or expired');
    }

    const session = sessionDoc.data() as OTPSession;

    if (session.verified) {
      throw new BadRequestError('OTP already used');
    }

    if (new Date(session.expiresAt) < new Date()) {
      throw new BadRequestError('OTP expired');
    }

    // Verify OTP (dev fallback compares session.otp; production calls MojoAuth)
    let verifiedEmail = email;
    const isDevBypass = !MOJOAUTH_API_KEY && process.env.NODE_ENV !== 'production';
    try {
      if (isDevBypass) {
        if (session.otp !== otp) throw new BadRequestError('Invalid OTP');
      } else {
        const result = await verifyEmailOtp(session.stateId, otp);
        if (result.email.toLowerCase() !== email.toLowerCase()) {
          throw new BadRequestError('OTP verification failed');
        }
        verifiedEmail = result.email;
      }
    } catch (err) {
      if (err instanceof BadRequestError) {
        // Track wrong-OTP attempts and lock after repeated failures
        const attempts = (session.attempts || 0) + 1;
        await sessionDoc.ref.update({ attempts });
        if (attempts >= 3) {
          await incrementLockAttempts(email);
        }
        throw err;
      }
      // MojoAuth API/network failures
      throw new Error('OTP verification service unavailable');
    }

    // Mark OTP as verified
    await sessionDoc.ref.update({ verified: true });

    // Get or create Firebase user by email
    let firebaseUser;
    try {
      firebaseUser = await getAuth().getUserByEmail(email);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        firebaseUser = await getAuth().createUser({
          email,
          emailVerified: true,
          displayName: `User ${email.split('@')[0]}`,
        });
        
        // Create user document
        await collections.users.doc(firebaseUser.uid).set({
          id: firebaseUser.uid,
          email,
          phone: '',
          name: `User ${email.split('@')[0]}`,
          profileCompleted: false,
          role: 'customer',
          status: 'active',
          isActive: true,
          language: 'en',
          city: '',
          kyc: { status: 'not_started', documents: [] },
          wallet: { balance: 0, pendingBalance: 0, currency: 'INR', bankAccounts: [] },
          rating: { average: 0, count: 0, breakdown: {} },
          stats: { tasksCompleted: 0, tasksPosted: 0, totalEarnings: 0, totalSpent: 0, responseTime: 0, completionRate: 100 },
          preferences: {},
          fcmTokens: [],
          commissionDue: 0,
          createdAt: timestamp(),
          updatedAt: timestamp(),
          lastActiveAt: timestamp(),
        });
      } else {
        throw err;
      }
    }

    // Create custom token for client
    const customToken = await getAuth().createCustomToken(firebaseUser.uid);

    // Update last active
    await collections.users.doc(firebaseUser.uid).update({ lastActiveAt: timestamp() });

    res.json({
      success: true,
      customToken,
      uid: firebaseUser.uid,
      isNewUser: !firebaseUser.metadata.creationTime || 
        new Date(firebaseUser.metadata.creationTime).getTime() > Date.now() - 60000,
    });
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh custom token (requires auth)
 */
router.post(
  '/refresh',
  requireAuth,
  validateBody(refreshTokenSchema),
  async (req: Request, res: Response) => {
    const { uid } = req.body;
    
    // Verify the requesting user matches or is admin
    if (req.user!.uid !== uid && req.user!.role !== 'admin') {
      throw new UnauthorizedError('Cannot refresh token for another user');
    }

    const customToken = await getAuth().createCustomToken(uid);
    res.json({ success: true, customToken });
  }
);

/**
 * POST /api/v1/auth/logout
 * Stateless logout — client discards tokens; revoke Firebase refresh tokens
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    await getAuth().revokeRefreshTokens(req.user!.uid);
  } catch (err) {
    // Non-fatal: refresh-token revocation is best-effort
    console.warn('[Auth] Failed to revoke refresh tokens:', err);
  }
  res.json({ success: true, message: 'Logged out' });
});

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  if (!userDoc.exists) {
    throw new NotFoundError('User not found');
  }
  res.json({ success: true, user: userDoc.data() });
});

export default router;