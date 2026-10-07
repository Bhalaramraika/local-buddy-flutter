/**
 * Auth Context - Authentication state management
 * Bridges Zustand authStore with React Context for provider pattern
 */

import React, { createContext, useContext, useCallback, useState } from 'react';
import { User, AuthTokens } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
import { getApiErrorMessage } from '@/services/api';
import { auth as firebaseAuth } from '@/services/firebase';
import { hydrateSettingsFromServer } from '@/store/uiStore';

interface AuthContextType {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, otp: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateFCMToken: (token: string) => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  name: string;
  phone?: string;
  referralCode?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setTokens,
    setLoading,
    setError,
    clearAll,
    setFCMToken,
    setBiometricEnabled,
  } = useAuthStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth from the persisted Firebase session
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Wait for Firebase Auth to finish restoring the persisted session
      // from AsyncStorage before reading currentUser.
      if (firebaseAuth) {
        try {
          await firebaseAuth.authStateReady();
        } catch {
          // best effort — fall through to the checks below
        }
      }

      if (firebaseAuth?.currentUser) {
        try {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setTokens({
              accessToken: await firebaseAuth.currentUser.getIdToken(),
              refreshToken: firebaseAuth.currentUser.refreshToken ?? '',
              expiresIn: 3600,
              tokenType: 'Bearer',
            });
            setUser(userData);
            hydrateSettingsFromServer();
            return;
          }
          // Defensive: API responded but returned no user profile
          clearAll();
        } catch (err: any) {
          const status = err?.response?.status;
          if (status === 401 || status === 403) {
            // Session is actually dead — wipe everything
            await authService.clearTokens();
            clearAll();
          } else {
            // Transient failure (offline / backend down): keep the Firebase
            // session so the next cold start can retry, but don't leave a
            // stale "authenticated" local state that Firestore rules reject.
            clearAll();
          }
        }
      } else {
        // No Firebase session — clear any stale persisted auth state
        await authService.clearTokens();
        clearAll();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAll();
    } finally {
      setIsInitialized(true);
      setLoading(false);
    }
  }, [setLoading, setError, setTokens, setUser, clearAll]);

  // Login with email and OTP
  const login = useCallback(async (email: string, otp: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.login(email, otp);
      setTokens(response.tokens);
      setUser(response.user);
      // Pull server-saved settings so preferences persist across devices/logins
      hydrateSettingsFromServer();
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Login failed. Please try again.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTokens, setUser]);

  // Register new user
  const register = useCallback(async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(data);
      setTokens(response.tokens);
      setUser(response.user);
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Registration failed. Please try again.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setTokens, setUser]);

  // Logout
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Full local teardown: resets auth state + sibling stores, stops
      // Firestore listeners and signs out of Firebase Auth.
      useAuthStore.getState().logout();
      setLoading(false);
    }
  }, [setLoading]);

  // Refresh access token
  const refreshToken = useCallback(async () => {
    try {
      const { refreshToken } = useAuthStore.getState().tokens || {};
      if (!refreshToken) throw new Error('No refresh token');

      const newTokens = await authService.refreshAccessToken(refreshToken);
      if (newTokens) {
        setTokens(newTokens);
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, [setTokens, logout]);

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error: any) {
      setError(getApiErrorMessage(error, 'Profile update failed. Please try again.'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setUser]);

  // Update FCM token
  const updateFCMToken = useCallback(async (token: string) => {
    try {
      await authService.updateFCMToken(token);
      setFCMToken(token);
    } catch (error) {
      console.error('FCM token update failed:', error);
    }
  }, [setFCMToken]);

  // Enable biometric
  const enableBiometric = useCallback(async () => {
    try {
      const success = await authService.enableBiometric();
      if (success) {
        setBiometricEnabled(true);
      }
      return success;
    } catch (error) {
      console.error('Biometric enable failed:', error);
      return false;
    }
  }, [setBiometricEnabled]);

  // Disable biometric
  const disableBiometric = useCallback(async () => {
    try {
      await authService.disableBiometric();
      setBiometricEnabled(false);
    } catch (error) {
      console.error('Biometric disable failed:', error);
    }
  }, [setBiometricEnabled]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    initializeAuth,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    updateFCMToken,
    enableBiometric,
    disableBiometric,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}