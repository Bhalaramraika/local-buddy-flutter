/**
 * Auth Context - Authentication state management
 * Bridges Zustand authStore with React Context for provider pattern
 */

import React, { createContext, useContext, useCallback, useState } from 'react';
import { User, AuthTokens } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';
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

  // Initialize auth from stored tokens
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const storedTokens = await authService.getStoredTokens();
      if (storedTokens?.accessToken) {
        // Validate token and fetch user
        const isValid = await authService.validateToken(storedTokens.accessToken);
        if (isValid) {
          setTokens(storedTokens);
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(userData);
            hydrateSettingsFromServer();
          }
        } else {
          // Try refresh token
          const refreshed = await authService.refreshAccessToken(storedTokens.refreshToken);
          if (refreshed) {
            setTokens(refreshed);
            const userData = await authService.getCurrentUser();
            if (userData) {
              setUser(userData);
            }
          } else {
            await authService.clearTokens();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await authService.clearTokens();
    } finally {
      setIsInitialized(true);
      setLoading(false);
    }
  }, [setLoading, setError, setTokens, setUser]);

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
      setError(error.message || 'Login failed');
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
      setError(error.message || 'Registration failed');
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
      clearAll();
    } catch (error) {
      console.error('Logout error:', error);
      clearAll();
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearAll]);

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
      setError(error.message || 'Profile update failed');
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