/**
 * Auth Store - Zustand
 * Authentication state management with persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import { User, UserRole, KYCStatus } from '@/types/user';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  fcmToken: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setFcmToken: (token: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  updateKYCStatus: (status: KYCStatus, details?: Partial<User['kyc']>) => void;
  updateWalletBalance: (balance: number) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isRefreshing: false,
  fcmToken: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false,
      }),
      
      setAuthenticated: (authenticated) => set({ 
        isAuthenticated: authenticated,
        isLoading: false,
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
      
      setFcmToken: (token) => set({ fcmToken: token }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
      
      updateKYCStatus: (status, details) => set((state) => ({
        user: state.user ? {
          ...state.user,
          kyc: {
            ...state.user.kyc,
            status,
            ...details,
          },
        } : null,
      })),
      
      updateWalletBalance: (balance) => set((state) => ({
        user: state.user ? {
          ...state.user,
          wallet: {
            ...state.user.wallet,
            balance,
          },
        } : null,
      })),
      
      logout: () => {
        // Clear storage
        storage.remove('auth_token');
        storage.remove('refresh_token');
        storage.remove('user_data');
        storage.remove('fcm_token');
        
        set({ ...initialState, isLoading: false });
      },
      
      hydrate: async () => {
        try {
          const [token, userData, fcmToken] = await Promise.all([
            storage.get<string>('auth_token'),
            storage.get<User>('user_data'),
            storage.get<string>('fcm_token'),
          ]);
          
          if (token && userData) {
            set({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              fcmToken,
            });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('[AuthStore] Hydration error:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        fcmToken: state.fcmToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
        }
      },
    }
  )
);

// Selectors for common use cases
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectKYCStatus = (state: AuthState) => state.user?.kyc?.status;
export const selectWalletBalance = (state: AuthState) => state.user?.wallet?.balance || 0;
export const selectIsKYCVerified = (state: AuthState) => state.user?.kyc?.status === 'verified';
export const selectCanAcceptTasks = (state: AuthState) => 
  state.isAuthenticated && state.user?.kyc?.status === 'verified' && state.user?.isActive;