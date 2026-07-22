/**
 * Firebase Admin SDK Initialization
 * Singleton admin instance for Firestore, Auth, and Messaging
 */

import * as admin from 'firebase-admin';
import { config } from './config';

let firebaseApp: admin.app.App | null = null;

export function getFirebaseAdmin(): admin.app.App {
  if (firebaseApp) return firebaseApp;

  // For local development with emulator
  if (config.server.isDev && process.env.FIRESTORE_EMULATOR_HOST) {
    firebaseApp = admin.initializeApp({
      projectId: config.firebase.projectId,
    });
    console.log('[Firebase] Using Firestore emulator');
    return firebaseApp;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey,
    }),
    databaseURL: config.firebase.databaseURL,
  });

  console.log('[Firebase] Admin SDK initialized');
  return firebaseApp;
}

export function getFirestore(): admin.firestore.Firestore {
  return getFirebaseAdmin().firestore();
}

export function getAuth(): admin.auth.Auth {
  return getFirebaseAdmin().auth();
}

export function getMessaging(): admin.messaging.Messaging {
  return getFirebaseAdmin().messaging();
}

// Helper: verify Firebase ID token from client
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  return getAuth().verifyIdToken(token);
}

// Helper: get user by phone number
export async function getUserByPhone(phone: string): Promise<admin.auth.UserRecord | null> {
  try {
    return await getAuth().getUserByPhoneNumber(phone);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') return null;
    throw err;
  }
}

// Helper: create custom token for phone auth
export async function createCustomToken(uid: string): Promise<string> {
  return getAuth().createCustomToken(uid);
}