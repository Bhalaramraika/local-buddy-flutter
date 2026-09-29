/**
 * Firebase Configuration
 * Based on Architecture.md - Firebase Auth, Firestore, FCM
 * Uses Firebase Custom Token auth flow (Q&A decision)
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase config - prevent crash on missing or placeholder config
const isFirebaseConfigured = (): boolean => {
  const requiredKeys = ['apiKey', 'projectId'] as const;
  return requiredKeys.every(key => {
    const value = firebaseConfig[key];
    return value && 
           typeof value === 'string' && 
           value.length > 0 && 
           !value.startsWith('your-') && 
           !value.includes('placeholder');
  });
};

// Initialize Firebase App only if configured
let app: FirebaseApp | null = null;
if (isFirebaseConfigured()) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} else {
  console.warn('[Firebase] Firebase not configured - missing or placeholder EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID. Auth/Firestore/Storage will be unavailable. Please add your Firebase config to .env file.');
}

// Initialize Auth
export const auth: Auth | null = app ? getAuth(app) : null;

// Initialize Firestore
export const db: Firestore | null = app ? getFirestore(app) : null;

// Initialize Storage
export const storage: FirebaseStorage | null = app ? getStorage(app) : null;

// Initialize Messaging (FCM) - only on supported platforms
let messaging: Messaging | null = null;
let messagingInitialized = false;
if (app) {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (e) {
        console.warn('[Firebase] Failed to initialize messaging:', e);
      }
    }
    messagingInitialized = true;
  });
}

export const getMessagingInstance = (): Messaging | null => {
  if (!messaging) {
    console.warn('[Firebase] Messaging not initialized');
  }
  return messaging;
};

// Export a promise that resolves when messaging is initialized
export const getMessagingAsync = async (): Promise<Messaging | null> => {
  if (messagingInitialized) {
    return messaging;
  }
  // Wait for initialization
  await new Promise<void>((resolve) => {
    const check = () => {
      if (messagingInitialized) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
  return messaging;
};

// Connect to emulators in development
if (__DEV__ && app) {
  // Uncomment and configure for local emulator testing
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export default app;