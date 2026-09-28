/**
 * Firebase Admin Configuration — single source of truth.
 *
 * Lazy-initializes the Firebase Admin app from:
 *   - FIREBASE_SERVICE_ACCOUNT_KEY (full JSON), or
 *   - FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
 *
 * All getters throw a clear error if Firebase is not configured, so the
 * server can still boot (e.g. health checks) without credentials.
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging as adminGetMessaging, Messaging } from 'firebase-admin/messaging';
import { getAuth as adminGetAuth, Auth, DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore as adminGetFirestore, Firestore } from 'firebase-admin/firestore';

let firebaseApp: App | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_PROJECT_ID
  );
}

export function initializeFirebase(): void {
  if (firebaseApp || getApps().length > 0) {
    firebaseApp = firebaseApp || getApps()[0];
    return;
  }

  if (!isFirebaseConfigured()) {
    console.warn(
      '[Firebase] Credentials not configured. Auth/Firestore/FCM calls will fail.'
    );
    return;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    firebaseApp = initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
    return;
  }

  firebaseApp = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Initialize on module load (no-op without credentials — see isFirebaseConfigured)
initializeFirebase();

function requireApp(): App {
  if (!firebaseApp) initializeFirebase();
  if (!firebaseApp) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY.'
    );
  }
  return firebaseApp;
}

export function getAuth(): Auth {
  return adminGetAuth(requireApp());
}

export function getMessaging(): Messaging {
  return adminGetMessaging(requireApp());
}

export function getFirestore(): Firestore {
  return adminGetFirestore(requireApp());
}

export async function verifyIdToken(token: string): Promise<DecodedIdToken> {
  return getAuth().verifyIdToken(token);
}

export const getFirebaseAdmin = initializeFirebase;
export const getFirebaseApp = requireApp;

export default {
  initializeFirebase,
  getAuth,
  getMessaging,
  getFirestore,
  verifyIdToken,
  getFirebaseAdmin,
  getFirebaseApp,
};
