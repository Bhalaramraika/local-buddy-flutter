/**
 * Services Index - Initialize all services
 */

import { auth } from './firebase';

/**
 * Initialize Firebase client (non-fatal if env vars missing)
 */
export const initializeFirebase = async (): Promise<void> => {
  try {
    const { auth: firebaseAuth } = await import('./firebase');
    if (!firebaseAuth) {
      console.warn('[Services] Firebase not configured - skipping');
      return;
    }
    console.log('[Services] Firebase initialized');
  } catch (error) {
    console.warn('[Services] Firebase init failed, continuing without:', error);
  }
};

export const initializeServices = async (): Promise<void> => {
  try {
    await initializeFirebase();
    console.log('[Services] All services initialized');
  } catch (error) {
    console.error('[Services] Initialization failed:', error);
  }
};

// Re-export services
export { auth, db, storage } from './firebase';
export { api } from './api';
export { authService } from './auth';
export { default as storageService } from './storage';
export { default as paymentService } from './payment';
export { default as walletService } from './wallet';
export { default as imagePickerService } from './imagePicker';
export { startRealtimeSync, stopRealtimeSync, subscribeToChatMessages } from './realtime';