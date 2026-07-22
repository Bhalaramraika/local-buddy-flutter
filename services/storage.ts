/**
 * Storage Service
 * Wrapper around AsyncStorage for type-safe local persistence
 * Based on Architecture.md - Secure storage for tokens, user data, preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/app';

// Generic storage functions
export const storage = {
  // Get item with type safety
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Storage] Error getting ${key}:`, error);
      return null;
    }
  },

  // Set item with type safety
  set: async <T>(key: string, value: T): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`[Storage] Error setting ${key}:`, error);
      return false;
    }
  },

  // Remove item
  remove: async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Storage] Error removing ${key}:`, error);
      return false;
    }
  },

  // Clear all
  clear: async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('[Storage] Error clearing:', error);
      return false;
    }
  },

  // Get all keys
  getAllKeys: async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('[Storage] Error getting keys:', error);
      return [];
    }
  },

  // Multi-get
  multiGet: async <T>(keys: string[]): Promise<Record<string, T | null>> => {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, T | null> = {};
      pairs.forEach(([key, value]) => {
        result[key] = value ? JSON.parse(value) : null;
      });
      return result;
    } catch (error) {
      console.error('[Storage] Error multi-get:', error);
      return {};
    }
  },

  // Multi-set
  multiSet: async (keyValuePairs: [string, string][]): Promise<boolean> => {
    try {
      await AsyncStorage.multiSet(keyValuePairs);
      return true;
    } catch (error) {
      console.error('[Storage] Error multi-set:', error);
      return false;
    }
  },

  // Multi-remove
  multiRemove: async (keys: string[]): Promise<boolean> => {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('[Storage] Error multi-remove:', error);
      return false;
    }
  },
};

// Typed storage helpers for specific keys
export const authStorage = {
  getToken: () => storage.get<string>(STORAGE_KEYS.authToken),
  setToken: (token: string) => storage.set(STORAGE_KEYS.authToken, token),
  removeToken: () => storage.remove(STORAGE_KEYS.authToken),

  getRefreshToken: () => storage.get<string>(STORAGE_KEYS.refreshToken),
  setRefreshToken: (token: string) => storage.set(STORAGE_KEYS.refreshToken, token),
  removeRefreshToken: () => storage.remove(STORAGE_KEYS.refreshToken),

  clearAuth: async () => {
    await storage.multiRemove([STORAGE_KEYS.authToken, STORAGE_KEYS.refreshToken]);
  },
};

export const userStorage = {
  getProfile: () => storage.get<any>(STORAGE_KEYS.userProfile),
  setProfile: (profile: any) => storage.set(STORAGE_KEYS.userProfile, profile),
  removeProfile: () => storage.remove(STORAGE_KEYS.userProfile),
};

export const preferencesStorage = {
  getLanguage: () => storage.get<string>(STORAGE_KEYS.language),
  setLanguage: (lang: string) => storage.set(STORAGE_KEYS.language, lang),

  getCity: () => storage.get<string>(STORAGE_KEYS.city),
  setCity: (city: string) => storage.set(STORAGE_KEYS.city, city),

  getFcmToken: () => storage.get<string>(STORAGE_KEYS.fcmToken),
  setFcmToken: (token: string) => storage.set(STORAGE_KEYS.fcmToken, token),
  removeFcmToken: () => storage.remove(STORAGE_KEYS.fcmToken),

  getOnboardingComplete: () => storage.get<boolean>(STORAGE_KEYS.onboardingComplete),
  setOnboardingComplete: (complete: boolean) => storage.set(STORAGE_KEYS.onboardingComplete, complete),

  getKycSubmitted: () => storage.get<boolean>(STORAGE_KEYS.kycSubmitted),
  setKycSubmitted: (submitted: boolean) => storage.set(STORAGE_KEYS.kycSubmitted, submitted),

  getPushNotificationsEnabled: () => storage.get<boolean>(STORAGE_KEYS.pushNotificationsEnabled),
  setPushNotificationsEnabled: (enabled: boolean) => storage.set(STORAGE_KEYS.pushNotificationsEnabled, enabled),

  getLocationPermissionGranted: () => storage.get<boolean>(STORAGE_KEYS.locationPermissionGranted),
  setLocationPermissionGranted: (granted: boolean) => storage.set(STORAGE_KEYS.locationPermissionGranted, granted),

  getCameraPermissionGranted: () => storage.get<boolean>(STORAGE_KEYS.cameraPermissionGranted),
  setCameraPermissionGranted: (granted: boolean) => storage.set(STORAGE_KEYS.cameraPermissionGranted, granted),

  getLastKnownLocation: () => storage.get<{ latitude: number; longitude: number; timestamp: number }>(STORAGE_KEYS.lastKnownLocation),
  setLastKnownLocation: (location: { latitude: number; longitude: number; timestamp: number }) => storage.set(STORAGE_KEYS.lastKnownLocation, location),

  getWalletBalance: () => storage.get<number>(STORAGE_KEYS.walletBalance),
  setWalletBalance: (balance: number) => storage.set(STORAGE_KEYS.walletBalance, balance),

  getTheme: () => storage.get<'light' | 'dark' | 'system'>(STORAGE_KEYS.theme),
  setTheme: (theme: 'light' | 'dark' | 'system') => storage.set(STORAGE_KEYS.theme, theme),
};

export const clearAllUserData = async (): Promise<boolean> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await storage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing user data:', error);
    return false;
  }
};

export default storage;