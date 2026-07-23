/**
 * Services Index - Initialize all services
 */

import { auth } from './firebase';
import { supabase } from './supabase';
import { api } from './api';
import { authService } from './auth';

/**
 * Initialize Firebase client
 * Called once at app startup
 */
export const initializeFirebase = async (): Promise<void> => {
  try {
    // Firebase is already initialized via the module import
    // Check if Firebase is configured
    const { auth } = await import('./firebase');
    if (!auth) {
      console.warn('[Services] Firebase not configured - skipping Firebase initialization');
      return;
    }
    console.log('[Services] Firebase initialized');
  } catch (error) {
    console.error('[Services] Firebase initialization failed:', error);
    // Don't throw - allow app to continue without Firebase
    console.warn('[Services] Continuing without Firebase...');
  }
};

/**
 * Initialize Supabase client
 * Called once at app startup
 */
export const initializeSupabase = async (): Promise<void> => {
  try {
    // Supabase is already initialized via the module import
    // Verify connection by checking auth session
    const { data } = await supabase.auth.getSession();
    console.log('[Services] Supabase initialized, session:', !!data.session);
  } catch (error) {
    console.error('[Services] Supabase initialization failed:', error);
    throw error;
  }
};

/**
 * Initialize all services
 * Called once at app startup
 */
export const initializeServices = async (): Promise<void> => {
  try {
    await initializeFirebase();
    await initializeSupabase();
    // API is ready (axios instance)
    console.log('[Services] All services initialized');
  } catch (error) {
    console.error('[Services] Service initialization failed:', error);
    throw error;
  }
};

// Re-export services
export { auth } from './firebase';
export { supabase } from './supabase';
export { api } from './api';
export { authService } from './auth';
export { storageService } from './storage';
export { locationService } from './location';
export { notificationService } from './notifications';
export { paymentService } from './payment';
export { walletService } from './wallet';
export { imagePickerService } from './imagePicker';