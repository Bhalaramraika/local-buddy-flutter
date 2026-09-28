/**
 * User Store - Zustand
 * User profile, preferences, settings, and account management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import { 
  User, 
  UserProfile, 
  UserPreferences, 
  UserSettings,
  ReferralData,
  UserStats 
} from '@/types';

export interface UserState {
  // User data
  user: User | null;
  profile: UserProfile | null;
  preferences: UserPreferences;
  settings: UserSettings;
  
  // Referral
  referralData: ReferralData | null;
  
  // Stats
  stats: UserStats | null;
  
  // Loading/Error
  isLoading: boolean;
  isUpdatingProfile: boolean;
  isUpdatingPreferences: boolean;
  isUpdatingSettings: boolean;
  error: string | null;
  
  // Actions
  // User
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  
  // Profile
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  
  // Preferences
  setPreferences: (preferences: UserPreferences) => void;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  togglePreference: <K extends keyof UserPreferences>(key: K) => void;
  
  // Settings
  setSettings: (settings: UserSettings) => void;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  toggleSetting: <K extends keyof UserSettings>(key: K) => void;
  
  // Referral
  setReferralData: (data: ReferralData | null) => void;
  updateReferralCode: (code: string) => void;
  incrementReferralCount: () => void;
  addReferralEarning: (amount: number) => void;
  
  // Stats
  setStats: (stats: UserStats) => void;
  updateStat: <K extends keyof UserStats>(key: K, value: UserStats[K]) => void;
  incrementStat: <K extends keyof UserStats>(key: K, amount?: number) => void;
  
  // Loading/Error
  setLoading: (loading: boolean) => void;
  setUpdatingProfile: (updating: boolean) => void;
  setUpdatingPreferences: (updating: boolean) => void;
  setUpdatingSettings: (updating: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getDisplayName: () => string;
  getInitials: () => string;
  getAvatarUrl: () => string | null;
  isProfileComplete: () => boolean;
  getReferralLink: () => string;
  clearAll: () => void;
}

const defaultPreferences: UserPreferences = {
  language: 'en',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  theme: 'system',
  fontSize: 'medium',
  notifications: {
    push: true,
    email: true,
    sms: false,
    inApp: true,
    taskUpdates: true,
    chatMessages: true,
    payments: true,
    promotions: false,
    sos: true,
  },
  privacy: {
    showProfile: true,
    showRating: true,
    showLocation: false,
    showOnlineStatus: true,
    allowDirectMessages: true,
  },
  accessibility: {
    reduceMotion: false,
    highContrast: false,
    screenReader: false,
    largeText: false,
  },
};

const defaultSettings: UserSettings = {
  autoAcceptTasks: false,
  autoAcceptRadius: 5000, // 5km
  minTaskAmount: 100,
  maxTaskDistance: 20000, // 20km
  preferredCategories: [],
  blockedUsers: [],
  blockedCategories: [],
  workingHours: {
    enabled: false,
    start: '09:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5], // Mon-Fri
  },
  sosContacts: [],
  emergencyContacts: [],
  twoFactorEnabled: false,
  biometricEnabled: false,
  pinEnabled: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      profile: null,
      preferences: defaultPreferences,
      settings: defaultSettings,
      referralData: null,
      stats: null,
      isLoading: false,
      isUpdatingProfile: false,
      isUpdatingPreferences: false,
      isUpdatingSettings: false,
      error: null,
      
      // Actions
      // User
      setUser: (user) => set({ user, isLoading: false, error: null }),
      
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
      
      clearUser: () => set({ user: null, profile: null, referralData: null, stats: null }),
      
      // Profile
      setProfile: (profile) => set({ profile, isUpdatingProfile: false, error: null }),
      
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      })),
      
      // Preferences
      setPreferences: (preferences) => set({ preferences, isUpdatingPreferences: false, error: null }),
      
      updatePreference: (key, value) => set((state) => ({
        preferences: { ...state.preferences, [key]: value },
      })),
      
      togglePreference: (key) => set((state) => {
        const currentValue = state.preferences[key];
        if (typeof currentValue === 'boolean') {
          return { preferences: { ...state.preferences, [key]: !currentValue } };
        }
        return state;
      }),
      
      // Settings
      setSettings: (settings) => set({ settings, isUpdatingSettings: false, error: null }),
      
      updateSetting: (key, value) => set((state) => ({
        settings: { ...state.settings, [key]: value },
      })),
      
      toggleSetting: (key) => set((state) => {
        const currentValue = state.settings[key];
        if (typeof currentValue === 'boolean') {
          return { settings: { ...state.settings, [key]: !currentValue } };
        }
        return state;
      }),
      
      // Referral
      setReferralData: (referralData) => set({ referralData }),
      
      updateReferralCode: (code) => set((state) => ({
        referralData: state.referralData ? { ...state.referralData, referralCode: code } : null,
      })),
      
      incrementReferralCount: () => set((state) => ({
        referralData: state.referralData ? { 
          ...state.referralData, 
          referralCount: state.referralData.referralCount + 1 
        } : null,
      })),
      
      addReferralEarning: (amount) => set((state) => ({
        referralData: state.referralData ? { 
          ...state.referralData, 
          totalEarnings: state.referralData.totalEarnings + amount 
        } : null,
      })),
      
      // Stats
      setStats: (stats) => set({ stats }),
      
      updateStat: (key, value) => set((state) => ({
        stats: state.stats ? { ...state.stats, [key]: value } : null,
      })),
      
      incrementStat: (key, amount = 1) => set((state) => {
        if (!state.stats) return state;
        const currentValue = state.stats[key];
        if (typeof currentValue === 'number') {
          return { stats: { ...state.stats, [key]: currentValue + amount } };
        }
        return state;
      }),
      
      // Loading/Error
      setLoading: (isLoading) => set({ isLoading, error: isLoading ? null : get().error }),
      
      setUpdatingProfile: (isUpdatingProfile) => set({ isUpdatingProfile, error: isUpdatingProfile ? null : get().error }),
      
      setUpdatingPreferences: (isUpdatingPreferences) => set({ isUpdatingPreferences, error: isUpdatingPreferences ? null : get().error }),
      
      setUpdatingSettings: (isUpdatingSettings) => set({ isUpdatingSettings, error: isUpdatingSettings ? null : get().error }),
      
      setError: (error) => set({ error, isLoading: false, isUpdatingProfile: false, isUpdatingPreferences: false, isUpdatingSettings: false }),
      
      // Computed
      getDisplayName: () => {
        const { user, profile } = get();
        if (profile?.fullName) return profile.fullName;
        if (user?.name) return user.name;
        if (user?.phone) return `+91 ${user.phone.slice(-10)}`;
        return 'User';
      },
      
      getInitials: () => {
        const { user, profile } = get();
        const name = profile?.fullName || user?.name || '';
        return name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
      },
      
      getAvatarUrl: () => {
        const { user, profile } = get();
        return profile?.avatarUrl || user?.avatarUrl || null;
      },
      
      isProfileComplete: () => {
        const { profile } = get();
        if (!profile) return false;
        return !!(
          profile.fullName &&
          profile.phone &&
          profile.email &&
          profile.address &&
          profile.city
        );
      },
      
      getReferralLink: () => {
        const { referralData } = get();
        if (!referralData?.referralCode) return '';
        return `https://localbuddy.app/refer/${referralData.referralCode}`;
      },
      
      clearAll: () => set({
        user: null,
        profile: null,
        preferences: defaultPreferences,
        settings: defaultSettings,
        referralData: null,
        stats: null,
        isLoading: false,
        isUpdatingProfile: false,
        isUpdatingPreferences: false,
        isUpdatingSettings: false,
        error: null,
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        // Persist preferences and settings
        preferences: state.preferences,
        settings: state.settings,
        referralData: state.referralData,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: UserState) => state.user;
export const selectProfile = (state: UserState) => state.profile;
export const selectPreferences = (state: UserState) => state.preferences;
export const selectSettings = (state: UserState) => state.settings;
export const selectReferralData = (state: UserState) => state.referralData;
export const selectUserStats = (state: UserState) => state.stats;
export const selectUserLoading = (state: UserState) => state.isLoading;
export const selectUpdatingProfile = (state: UserState) => state.isUpdatingProfile;
export const selectUpdatingPreferences = (state: UserState) => state.isUpdatingPreferences;
export const selectUpdatingSettings = (state: UserState) => state.isUpdatingSettings;
export const selectUserError = (state: UserState) => state.error;

// Computed selectors
export const selectDisplayName = (state: UserState) => state.getDisplayName();
export const selectInitials = (state: UserState) => state.getInitials();
export const selectAvatarUrl = (state: UserState) => state.getAvatarUrl();
export const selectIsProfileComplete = (state: UserState) => state.isProfileComplete();
export const selectReferralLink = (state: UserState) => state.getReferralLink();

// Preference selectors
export const selectLanguage = (state: UserState) => state.preferences.language;
export const selectCurrency = (state: UserState) => state.preferences.currency;
export const selectTheme = (state: UserState) => state.preferences.theme;
export const selectFontSize = (state: UserState) => state.preferences.fontSize;
export const selectNotifications = (state: UserState) => state.preferences.notifications;
export const selectPrivacy = (state: UserState) => state.preferences.privacy;
export const selectAccessibility = (state: UserState) => state.preferences.accessibility;

// Setting selectors
export const selectAutoAcceptTasks = (state: UserState) => state.settings.autoAcceptTasks;
export const selectAutoAcceptRadius = (state: UserState) => state.settings.autoAcceptRadius;
export const selectMinTaskAmount = (state: UserState) => state.settings.minTaskAmount;
export const selectMaxTaskDistance = (state: UserState) => state.settings.maxTaskDistance;
export const selectPreferredCategories = (state: UserState) => state.settings.preferredCategories;
export const selectWorkingHours = (state: UserState) => state.settings.workingHours;
export const selectSOSContacts = (state: UserState) => state.settings.sosContacts;
export const selectEmergencyContacts = (state: UserState) => state.settings.emergencyContacts;
export const selectTwoFactorEnabled = (state: UserState) => state.settings.twoFactorEnabled;
export const selectBiometricEnabled = (state: UserState) => state.settings.biometricEnabled;
export const selectPinEnabled = (state: UserState) => state.settings.pinEnabled;