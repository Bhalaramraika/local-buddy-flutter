/**
 * Firebase Admin Configuration
 * For push notifications and admin operations
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getAuth, Auth } from 'firebase-admin/auth';

let firebaseApp: App | null = null;
let messaging: Messaging | null = null;
let auth: Auth | null = null;

export function initializeFirebase(): void {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
  } else {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };

    if (serviceAccount.projectId) {
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      });
    } else {
      console.warn('Firebase credentials not configured. Push notifications will not work.');
    }
  }

  if (firebaseApp) {
    messaging = getMessaging(firebaseApp);
    auth = getAuth(firebaseApp);
  }
}

export function getMessagingInstance(): Messaging | null {
  if (!messaging) {
    initializeFirebase();
  }
  return messaging;
}

export function getAuthInstance(): Auth | null {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

export function getFirebaseApp(): App | null {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp;
}

// Initialize on module load
initializeFirebase();

export default {
  getMessaging: getMessagingInstance,
  getAuth: getAuthInstance,
  getApp: getFirebaseApp,
};