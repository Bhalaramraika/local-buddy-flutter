/**
 * Firebase Admin Configuration
 * For verifying ID tokens and sending push notifications
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let firebaseApp: App | null = null;
let firebaseAuth: Auth | null = null;
let firebaseMessaging: Messaging | null = null;

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
      console.warn('Firebase credentials not configured. Auth and push notifications will not work.');
    }
  }

  if (firebaseApp) {
    firebaseAuth = getAuth(firebaseApp);
    firebaseMessaging = getMessaging(firebaseApp);
  }
}

export function getFirebaseAuth(): Auth | null {
  if (!firebaseAuth) {
    initializeFirebase();
  }
  return firebaseAuth;
}

export function getFirebaseMessaging(): Messaging | null {
  if (!firebaseMessaging) {
    initializeFirebase();
  }
  return firebaseMessaging;
}

export async function verifyIdToken(token: string) {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase not initialized');
  }
  return auth.verifyIdToken(token);
}

export async function createCustomToken(uid: string, claims?: object) {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase not initialized');
  }
  return auth.createCustomToken(uid, claims);
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    throw new Error('Firebase messaging not initialized');
  }

  const message = {
    token,
    notification: { title, body },
    data: data || {},
    android: {
      priority: 'high' as const,
      notification: {
        channelId: 'default',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  return messaging.send(message);
}

export async function sendMulticastNotification(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const messaging = getFirebaseMessaging();
  if (!messaging) {
    throw new Error('Firebase messaging not initialized');
  }

  const message = {
    tokens,
    notification: { title, body },
    data: data || {},
    android: {
      priority: 'high' as const,
      notification: {
        channelId: 'default',
        sound: 'default',
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
        },
      },
    },
  };

  return messaging.sendEachForMulticast(message);
}

export function getFirebaseApp(): App | null {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return firebaseApp;
}