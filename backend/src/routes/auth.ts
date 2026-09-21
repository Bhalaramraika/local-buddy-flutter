/**
 * Auth Routes
 * OTP send/verify, phone auth, custom tokens
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { getAuth } from '../firebase';
import { collections, OTPSession, runTransaction, timestamp } from '../models';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { otpRateLimiter } from '../middleware/rateLimiter';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../middleware/errorHandler';
import crypto from 'crypto';

const router = Router();

// ============================================================
// Schemas
// ============================================================

const sendOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/, 'Phone must be in +91XXXXXXXXXX format'),
});

const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$/),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const refreshTokenSchema = z.object({
  uid: z.string().min(1),
});

// ============================================================
// Helpers
// ============================================================

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSMS(phone: string, otp: string): Promise<void> {
  const authKeyApiKey = process.env.AUTHKEY_API_KEY;
  const senderId = process.env.AUTHKEY_SENDER_ID || 'LBUDDY';
  const route = process.env.AUTHKEY_ROUTE || '4';

  if (!authKeyApiKey) {
    console.warn('[SMS] AUTHKEY_API_KEY not configured, logging OTP to console');
    console.log(`[SMS] To ${phone}: Your LocalBuddy OTP is ${otp}. Valid for 10 minutes.`);
    return;
  }

  // Format phone number for AuthKey.io (remove +91 prefix)
  const mobile = phone.replace('+91', '');
  const message = `Your LocalBuddy OTP is ${otp}. Valid for 10 minutes.`;

  try {
    const url = `https://api.authkey.io/request?authkey=${authKeyApiKey}&mobile=${mobile}&message=${encodeURIComponent(message)}&sender=${senderId}&route=${route}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Message && data.Message !== 'Success') {
      console.error('[SMS] AuthKey.io error:', data);
      throw new Error(`AuthKey.io error: ${data.Message}`);
    }
    
    console.log(`[SMS] OTP sent to ${phone} via AuthKey.io`);
  } catch (error) {
    console.error('[SMS] Failed to send OTP via AuthKey.io:', error);
    // Fallback to console logging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS] To ${phone}: Your LocalBuddy OTP is ${otp}. Valid for 10 minutes.`);
    }
    throw error;
  }
}

async function checkUserLock(phone: string): Promise<void> {
  const lockDoc = await collections.userLocks.doc(phone).get();
  if (lockDoc.exists) {
    const lock = lockDoc.data()!;
    if (new Date(lock.lockedUntil) > new Date()) {
      throw new UnauthorizedError(`Account locked until ${lock.lockedUntil}. Reason: ${lock.reason}`);
    }
  }
}

async function incrementLockAttempts(phone: string): Promise<void> {
  const lockRef = collections.userLocks.doc(phone);
  const lockDoc = await lockRef.get();
  
  if (!lockDoc.exists) {
    await lockRef.set({
      phone,
      reason: 'Too many failed OTP attempts',
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
 * Send OTP to phone number
 */
router.post(
  '/otp/send',
  otpRateLimiter,
  validateBody(sendOtpSchema),
  async (req: Request, res: Response) => {
    const { phone } = req.body;

    await checkUserLock(phone);

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

    // Store OTP session
    await collections.otpSessions.doc(phone).set({
      phone,
      otp,
      attempts: 0,
      expiresAt,
      createdAt: timestamp(),
      verified: false,
    });

    // Send SMS
    await sendSMS(phone, otp);

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
    const { phone, otp } = req.body;

    const sessionDoc = await collections.otpSessions.doc(phone).get();
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

    if (session.otp !== otp) {
      // Increment attempts
      await sessionDoc.ref.update({ attempts: session.attempts + 1 });
      
      if (session.attempts + 1 >= 3) {
        await incrementLockAttempts(phone);
      }
      
      throw new BadRequestError('Invalid OTP');
    }

    // Mark OTP as verified
    await sessionDoc.ref.update({ verified: true });

    // Get or create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await getAuth().getUserByPhoneNumber(phone);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        firebaseUser = await getAuth().createUser({
          phoneNumber: phone,
          displayName: `User ${phone.slice(-4)}`,
        });
        
        // Create user document
        await collections.users.doc(firebaseUser.uid).set({
          id: firebaseUser.uid,
          phone,
          name: `User ${phone.slice(-4)}`,
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