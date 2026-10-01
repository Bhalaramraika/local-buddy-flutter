/**
 * UI Store - Zustand
 * Global UI state: modals, toasts, loading, navigation, theme, etc.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import { ModalState, ToastMessage, LoadingState } from '@/types';
import { apiPut } from '@/services/api';
import { authService } from '@/services/auth';

/**
 * Sync appearance/preference keys to backend (users/{uid}.preferences). Best-effort,
 * non-blocking; hydrateFromServer() pulls the authoritative copy on login/app start.
 */
const persistPreference = (key: 'appearance' | 'location', value: Record<string, any>) => {
  apiPut('/users/me/profile', { preferences: { [key]: value } })
    .catch((err) => console.warn(`[UIStore] Failed to persist ${key} preference:`, err));
};

const syncAppearance = (state: Pick<UIState, 'theme' | 'language' | 'fontSize'>) => {
  persistPreference('appearance', {
    theme: state.theme,
    language: state.language,
    fontSize: state.fontSize,
  });
};

/** Fetch server-saved preferences and apply them (called on login/app start). */
export const hydrateSettingsFromServer = async (): Promise<void> => {
  try {
    const user = await authService.getCurrentUser();
    const prefs: any = user?.preferences || {};
    const appearance = prefs.appearance || {};
    const patch: Partial<UIState> = {};
    if (appearance.theme) patch.theme = appearance.theme;
    if (appearance.language) patch.language = appearance.language;
    if (appearance.fontSize) patch.fontSize = appearance.fontSize;
    if (Object.keys(patch).length) useUIStore.setState(patch);
  } catch (err) {
    console.warn('[UIStore] hydrateSettingsFromServer failed:', err);
  }
};

interface UIState {
  // Modals
  modals: Record<string, ModalState>;
  
  // Toasts
  toasts: ToastMessage[];
  
  // Global loading
  globalLoading: LoadingState;
  
  // Network
  isOnline: boolean;
  isSlowConnection: boolean;
  
  // App state
  isAppActive: boolean;
  isFirstLaunch: boolean;
  hasSeenOnboarding: boolean;
  
  // Theme/Appearance
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'hi';
  fontSize: 'small' | 'medium' | 'large';
  
  // Navigation
  previousRoute: string | null;
  currentRoute: string | null;
  
  // Keyboard
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  
  // Safe area
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Actions
  // Modals
  openModal: (id: string, type: string, data?: any) => void;
  closeModal: (id: string) => void;
  // Aliases kept for screens using showModal/hideModal
  showModal: (id: string, type?: string, data?: any) => void;
  hideModal: (id: string) => void;
  closeAllModals: () => void;
  updateModalData: (id: string, data: any) => void;
  isModalOpen: (id: string) => boolean;

  // Toasts — supports both object and positional styles:
  //   showToast({ type, title, message, duration })
  //   showToast(message, 'success' | 'error' | 'warning' | 'info', duration?)
  showToast: {
    (toast: Omit<ToastMessage, 'id'>): string;
    (
      message: string,
      type?: ToastMessage['type'],
      duration?: number,
      title?: string
    ): string;
  };
  hideToast: (id: string) => void;
  clearToasts: () => void;
  
  // Global loading (accepts a bare boolean or a LoadingState)
  setGlobalLoading: (loading: LoadingState | boolean) => void;
  
  // Network
  setOnlineStatus: (isOnline: boolean) => void;
  setSlowConnection: (isSlow: boolean) => void;
  
  // App state
  setAppActive: (isActive: boolean) => void;
  setFirstLaunch: (isFirst: boolean) => void;
  setHasSeenOnboarding: (hasSeen: boolean) => void;
  
  // Theme/Appearance
  setTheme: (theme: UIState['theme']) => void;
  setLanguage: (language: UIState['language']) => void;
  setFontSize: (fontSize: UIState['fontSize']) => void;
  
  // Navigation
  setPreviousRoute: (route: string | null) => void;
  setCurrentRoute: (route: string | null) => void;
  
  // Keyboard
  setKeyboardVisible: (visible: boolean, height?: number) => void;
  
  // Safe area
  setSafeAreaInsets: (insets: UIState['safeAreaInsets']) => void;
  
  // Reset
  clearAll: () => void;
}

const defaultSafeAreaInsets = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      modals: {},
      toasts: [],
      globalLoading: { isLoading: false },
      isOnline: true,
      isSlowConnection: false,
      isAppActive: true,
      isFirstLaunch: true,
      hasSeenOnboarding: false,
      theme: 'system',
      language: 'en',
      fontSize: 'medium',
      previousRoute: null,
      currentRoute: null,
      isKeyboardVisible: false,
      keyboardHeight: 0,
      safeAreaInsets: defaultSafeAreaInsets,
      
      // Modal actions
      openModal: (id, type, data) => set((state) => ({
        modals: {
          ...state.modals,
          [id]: { isVisible: true, type, data },
        },
      })),
      
      closeModal: (id) => set((state) => {
        const { [id]: closed, ...rest } = state.modals;
        return { modals: rest };
      }),

      // Aliases for screens calling showModal/hideModal
      showModal: (id, type = 'default', data) => get().openModal(id, type, data),
      hideModal: (id) => get().closeModal(id),
      
      closeAllModals: () => set({ modals: {} }),
      
      updateModalData: (id, data) => set((state) => ({
        modals: {
          ...state.modals,
          [id]: { ...state.modals[id], data },
        },
      })),
      
      isModalOpen: (id) => get().modals[id]?.isVisible || false,
      
      // Toast actions (accepts object or positional call styles)
      showToast: ((toastOrMessage: any, type?: ToastMessage['type'], duration?: number, title?: string) => {
        let toast: Omit<ToastMessage, 'id'>;
        if (typeof toastOrMessage === 'string') {
          // Positional style: showToast(message, type?, duration?)
          toast = {
            type: type ?? 'info',
            title: title ?? toastOrMessage,
            message: title ? toastOrMessage : undefined,
            duration,
          };
        } else {
          toast = toastOrMessage as Omit<ToastMessage, 'id'>;
        }
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: ToastMessage = { ...toast, id };
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));
        // Auto-hide after duration
        setTimeout(() => {
          get().hideToast(id);
        }, toast.duration || 4000);
        return id;
      }) as UIState['showToast'],
      
      hideToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),
      
      clearToasts: () => set({ toasts: [] }),
      
      // Global loading
      setGlobalLoading: (globalLoading) =>
        set({
          globalLoading:
            typeof globalLoading === 'boolean'
              ? { isLoading: globalLoading }
              : globalLoading,
        }),
      
      // Network
      setOnlineStatus: (isOnline) => set({ isOnline }),
      
      setSlowConnection: (isSlowConnection) => set({ isSlowConnection }),
      
      // App state
      setAppActive: (isAppActive) => set({ isAppActive }),
      
      setFirstLaunch: (isFirstLaunch) => set({ isFirstLaunch }),
      
      setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
      
      // Theme/Appearance
      setTheme: (theme) => {
        set({ theme });
        syncAppearance({ theme, language: get().language, fontSize: get().fontSize });
      },
      
      setLanguage: (language) => {
        set({ language });
        syncAppearance({ theme: get().theme, language, fontSize: get().fontSize });
      },
      
      setFontSize: (fontSize) => {
        set({ fontSize });
        syncAppearance({ theme: get().theme, language: get().language, fontSize });
      },
      
      // Navigation
      setPreviousRoute: (previousRoute) => set({ previousRoute }),
      
      setCurrentRoute: (currentRoute) => set((state) => ({
        previousRoute: state.currentRoute,
        currentRoute,
      })),
      
      // Keyboard
      setKeyboardVisible: (isKeyboardVisible, keyboardHeight = 0) => set({ 
        isKeyboardVisible, 
        keyboardHeight 
      }),
      
      // Safe area
      setSafeAreaInsets: (safeAreaInsets) => set({ safeAreaInsets }),
      
      // Reset
      clearAll: () => set({
        modals: {},
        toasts: [],
        globalLoading: { isLoading: false },
        isOnline: true,
        isSlowConnection: false,
        isAppActive: true,
        isFirstLaunch: false,
        hasSeenOnboarding: false,
        theme: 'system',
        language: 'en',
        fontSize: 'medium',
        previousRoute: null,
        currentRoute: null,
        isKeyboardVisible: false,
        keyboardHeight: 0,
        safeAreaInsets: defaultSafeAreaInsets,
      }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        fontSize: state.fontSize,
        hasSeenOnboarding: state.hasSeenOnboarding,
        isFirstLaunch: state.isFirstLaunch,
      }),
    }
  )
);

// Selectors
export const selectModals = (state: UIState) => state.modals;
export const selectToasts = (state: UIState) => state.toasts;
export const selectGlobalLoading = (state: UIState) => state.globalLoading;
export const selectIsOnline = (state: UIState) => state.isOnline;
export const selectIsSlowConnection = (state: UIState) => state.isSlowConnection;
export const selectIsAppActive = (state: UIState) => state.isAppActive;
export const selectIsFirstLaunch = (state: UIState) => state.isFirstLaunch;
export const selectHasSeenOnboarding = (state: UIState) => state.hasSeenOnboarding;
export const selectTheme = (state: UIState) => state.theme;
export const selectLanguage = (state: UIState) => state.language;
export const selectFontSize = (state: UIState) => state.fontSize;
export const selectPreviousRoute = (state: UIState) => state.previousRoute;
export const selectCurrentRoute = (state: UIState) => state.currentRoute;
export const selectIsKeyboardVisible = (state: UIState) => state.isKeyboardVisible;
export const selectKeyboardHeight = (state: UIState) => state.keyboardHeight;
export const selectSafeAreaInsets = (state: UIState) => state.safeAreaInsets;

// Helper hooks
export const useModal = (id: string) => {
  const modal = useUIStore((state) => state.modals[id]);
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  const updateModalData = useUIStore((state) => state.updateModalData);
  
  return {
    isOpen: modal?.isVisible || false,
    type: modal?.type,
    data: modal?.data,
    open: (type: string, data?: any) => openModal(id, type, data),
    close: () => closeModal(id),
    updateData: (data: any) => updateModalData(id, data),
  };
};

export const useToast = () => {
  const toasts = useUIStore((state) => state.toasts);
  const showToast = useUIStore((state) => state.showToast);
  const hideToast = useUIStore((state) => state.hideToast);
  const clearToasts = useUIStore((state) => state.clearToasts);
  
  return { toasts, showToast, hideToast, clearToasts };
};