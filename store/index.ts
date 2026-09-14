/**
 * Store Index - Export all Zustand stores
 */

// Auth Store
export { useAuthStore } from './authStore';
export type { AuthState } from './authStore';
export {
  selectIsAuthenticated,
  selectIsLoading,
  selectAuthError,
  selectTokens,
  selectWalletBalance,
} from './authStore';

// Task Store
export { useTaskStore } from './taskStore';
export type { TaskState } from './taskStore';
export {
  selectTasks,
  selectMyTasks,
  selectAssignedTasks,
  selectNearbyTasks,
  selectTaskFilters,
  selectTaskSort,
  selectTaskPagination,
  selectSelectedTask,
  selectTaskLoading,
  selectTaskError,
  selectAvailableTasks,
  selectActiveTasks,
  selectCompletedTasks,
  selectPendingTasks,
} from './taskStore';

// Chat Store
export { useChatStore } from './chatStore';
export type { ChatState } from './chatStore';
export {
  selectChats,
  selectMessages,
  selectActiveChat,
  selectUnreadCounts,
  selectTypingUsers,
  selectChatLoading,
  selectChatError,
  selectUnreadChatsCount,
  selectActiveChatMessages,
  selectActiveChatTypingUsers,
} from './chatStore';

// Wallet Store
export { useWalletStore } from './walletStore';
export type { WalletState } from './walletStore';
export {
  selectWallet,
  selectBalance,
  selectPendingBalance,
  selectAvailableBalance,
  selectTransactions,
  selectTransactionsPagination,
  selectTransactionsFilter,
  selectWithdrawals,
  selectPendingWithdrawal,
  selectEarningsSummary,
  selectPaymentMethods,
  selectDefaultPaymentMethod,
  selectWalletLoading,
  selectWalletRefreshing,
  selectWalletError,
  selectCompletedTransactions,
  selectPendingTransactions,
  selectFailedTransactions,
  selectPendingWithdrawals,
  selectCompletedWithdrawals,
  selectUPIPaymentMethods,
  selectBankPaymentMethods,
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
export type { UIState } from './uiStore';
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
  selectCurrency,
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
  selectPinEnabled,
} from './userStore';

// Store initialization helper
import { useAuthStore } from './authStore';
import { useTaskStore } from './taskStore';
import { useChatStore } from './chatStore';
import { useWalletStore } from './walletStore';
import { useLocationStore } from './locationStore';
import { useUIStore } from './uiStore';
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