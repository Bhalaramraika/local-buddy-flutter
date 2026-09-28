/**
 * Store Index - Export all Zustand stores
 */

// Auth Store
export { useAuthStore } from './authStore';
export type { AuthState } from './authStore';
export {
  selectUser as selectAuthUser,
  selectIsAuthenticated,
  selectIsLoading as selectAuthLoading,
  selectUserRole,
  selectKYCStatus as selectAuthKYCStatus,
  selectWalletBalance,
  selectIsKYCVerified,
  selectCanAcceptTasks,
} from './authStore';

// Task Store
export { useTaskStore } from './taskStore';
import { useTaskStore } from './taskStore';
export type TaskState = ReturnType<typeof useTaskStore.getState>;
export {
  selectTasks,
  selectMyTasks,
  selectAssignedTasks,
  selectNearbyTasks,
  selectCurrentTask,
  selectTaskFilters,
  selectTaskSortOptions,
  selectTaskPagination,
  selectTaskLoading,
  selectTaskLoadingMore,
  selectTaskError,
  selectFilteredTasks,
  selectOpenTasks,
  selectAssignedTasksCount,
  selectMyTasksCount,
} from './taskStore';

// Chat Store
export { useChatStore } from './chatStore';
import { useChatStore } from './chatStore';
export type ChatState = ReturnType<typeof useChatStore.getState>;
export {
  selectChats,
  selectCurrentChat,
  selectMessages,
  selectUnreadCount as selectChatUnreadCount,
  selectTotalUnreadCount,
  selectChatLoading,
  selectChatSending,
  selectChatError,
  selectTypingUsers,
  selectSortedChats,
} from './chatStore';

// Wallet Store
export { useWalletStore } from './walletStore';
import { useWalletStore } from './walletStore';
export type WalletState = ReturnType<typeof useWalletStore.getState>;
export {
  selectWalletBalance as selectBalance,
  selectAvailableBalance,
  selectPendingBalance,
  selectTotalBalance,
  selectTransactions,
  selectWithdrawals,
  selectBankAccounts,
  selectWalletStats,
  selectWalletLoading,
  selectWalletProcessing,
  selectWalletError,
  selectDefaultBankAccount,
  selectRecentTransactions,
} from './walletStore';

// Location Store
export { useLocationStore } from './locationStore';
export type { LocationState } from './locationStore';
export {
  selectCurrentLocation,
  selectLastKnownLocation,
  selectCity,
  selectArea,
  selectIsTracking,
  selectTrackingMode,
  selectTrackingAccuracy,
  selectGeofences,
  selectActiveGeofence,
  selectNearbyBuddies,
  selectAvailableBuddies,
  selectNearbyBuddiesRadius,
  selectLocationPermissions,
  selectLocationLoading,
  selectLocationError,
} from './locationStore';

// UI Store
export { useUIStore } from './uiStore';
import { useUIStore } from './uiStore';
export type UIState = ReturnType<typeof useUIStore.getState>;
export {
  selectModals,
  selectToasts,
  selectGlobalLoading,
  selectIsOnline,
  selectIsSlowConnection,
  selectIsAppActive,
  selectIsFirstLaunch,
  selectHasSeenOnboarding,
  selectTheme,
  selectLanguage,
  selectFontSize,
  selectPreviousRoute,
  selectCurrentRoute,
  selectIsKeyboardVisible,
  selectKeyboardHeight,
  selectSafeAreaInsets,
  useModal,
  useToast,
} from './uiStore';

// Notification Store
export { useNotificationStore } from './notificationStore';
export type { NotificationState } from './notificationStore';
export {
  selectNotifications,
  selectUnreadCount,
  selectFCMToken,
  selectIsTokenRegistered,
  selectTokenRegistrationError,
  selectNotificationPermission,
  selectNotificationSettings,
  selectNotificationLoading,
  selectNotificationError,
  selectUnreadNotifications,
  selectRecentNotifications,
  selectHighPriorityNotifications,
  selectUrgentNotifications,
} from './notificationStore';

// KYC Store
export { useKYCStore } from './kycStore';
export type { KYCState } from './kycStore';
export {
  selectKYCStatus,
  selectKYCSubmission,
  selectKYCDocuments,
  selectPendingDocuments,
  selectRejectedDocuments,
  selectCurrentSubmission,
  selectVerificationLevel,
  selectIsVerified,
  selectVerificationScore,
  selectKYCLoading,
  selectKYCSubmitting,
  selectKYCError,
  selectMissingDocuments,
  selectCompletionPercentage,
  selectCanSubmitForVerification,
  selectRequiredDocuments,
} from './kycStore';

// User Store
export { useUserStore } from './userStore';
export type { UserState } from './userStore';
export {
  selectUser,
  selectProfile,
  selectPreferences,
  selectSettings,
  selectReferralData,
  selectUserStats,
  selectUserLoading,
  selectUpdatingProfile,
  selectUpdatingPreferences,
  selectUpdatingSettings,
  selectUserError,
  selectDisplayName,
  selectInitials,
  selectAvatarUrl,
  selectIsProfileComplete,
  selectReferralLink,
  selectLanguage as selectUserLanguage,
  selectCurrency,
  selectTheme as selectUserTheme,
  selectFontSize as selectUserFontSize,
  selectNotifications as selectUserNotifications,
  selectPrivacy,
  selectAccessibility,
  selectAutoAcceptTasks,
  selectAutoAcceptRadius,
  selectMinTaskAmount,
  selectMaxTaskDistance,
  selectPreferredCategories,
  selectWorkingHours,
  selectSOSContacts,
  selectEmergencyContacts,
  selectTwoFactorEnabled,
  selectBiometricEnabled,
  selectPinEnabled,
} from './userStore';

// Store initialization helper
import { useAuthStore } from './authStore';
import { useLocationStore } from './locationStore';
import { useNotificationStore } from './notificationStore';
import { useKYCStore } from './kycStore';
import { useUserStore } from './userStore';

export const initializeStores = () => {
  // Initialize all stores by calling their hooks
  // This ensures persistence is loaded
  useAuthStore.getState();
  useTaskStore.getState();
  useChatStore.getState();
  useWalletStore.getState();
  useLocationStore.getState();
  useUIStore.getState();
  useNotificationStore.getState();
  useKYCStore.getState();
  useUserStore.getState();
};

export const clearAllStores = () => {
  useAuthStore.getState().clearAll();
  useTaskStore.getState().clearAll();
  useChatStore.getState().clearAll();
  useWalletStore.getState().clearAll();
  useLocationStore.getState().clearAll();
  useUIStore.getState().clearAll();
  useNotificationStore.getState().clearAllNotifications();
  useKYCStore.getState().clearAll();
  useUserStore.getState().clearAll();
};

// Store persistence keys
export const STORE_PERSISTENCE_KEYS = {
  auth: 'auth-storage',
  tasks: 'task-storage',
  chat: 'chat-storage',
  wallet: 'wallet-storage',
  location: 'location-storage',
  ui: 'ui-storage',
  notification: 'notification-storage',
  kyc: 'kyc-storage',
  user: 'user-storage',
} as const;

// Store reset helpers
export const resetAuthStore = () => useAuthStore.getState().clearAll();
export const resetTaskStore = () => useTaskStore.getState().clearAll();
export const resetChatStore = () => useChatStore.getState().clearAll();
export const resetWalletStore = () => useWalletStore.getState().clearAll();
export const resetLocationStore = () => useLocationStore.getState().clearAll();
export const resetUIStore = () => useUIStore.getState().clearAll();
export const resetNotificationStore = () => useNotificationStore.getState().clearAllNotifications();
export const resetKYCStore = () => useKYCStore.getState().clearAll();
export const resetUserStore = () => useUserStore.getState().clearAll();
