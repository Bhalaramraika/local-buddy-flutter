/**
 * Location Store - Zustand
 * Location tracking, geofencing, nearby buddies, and city detection
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/services/storage';
import { 
  LocationData, 
  Geofence, 
  NearbyBuddy 
} from '@/types';

interface LocationState {
  // Current location
  currentLocation: LocationData | null;
  lastKnownLocation: LocationData | null;
  city: string | null;
  area: string | null;
  
  // Tracking
  isTracking: boolean;
  trackingMode: 'foreground' | 'background' | 'off';
  trackingAccuracy: 'high' | 'balanced' | 'low';
  
  // Geofences
  geofences: Geofence[];
  activeGeofence: Geofence | null;
  
  // Nearby buddies
  nearbyBuddies: NearbyBuddy[];
  nearbyBuddiesRadius: number; // in meters
  
  // Permissions
  hasLocationPermission: boolean;
  hasBackgroundPermission: boolean;
  permissionStatus: 'granted' | 'denied' | 'restricted' | 'undetermined';
  
  // Loading/Error
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentLocation: (location: LocationData) => void;
  setLastKnownLocation: (location: LocationData) => void;
  setCity: (city: string | null) => void;
  setArea: (area: string | null) => void;
  
  setTracking: (isTracking: boolean) => void;
  setTrackingMode: (mode: LocationState['trackingMode']) => void;
  setTrackingAccuracy: (accuracy: LocationState['trackingAccuracy']) => void;
  
  setGeofences: (geofences: Geofence[]) => void;
  addGeofence: (geofence: Geofence) => void;
  updateGeofence: (geofence: Geofence) => void;
  removeGeofence: (geofenceId: string) => void;
  setActiveGeofence: (geofence: Geofence | null) => void;
  
  setNearbyBuddies: (buddies: NearbyBuddy[]) => void;
  addNearbyBuddy: (buddy: NearbyBuddy) => void;
  updateNearbyBuddy: (buddy: NearbyBuddy) => void;
  removeNearbyBuddy: (buddyId: string) => void;
  setNearbyBuddiesRadius: (radius: number) => void;
  
  setPermissions: (permissions: {
    hasLocationPermission: boolean;
    hasBackgroundPermission: boolean;
    permissionStatus: LocationState['permissionStatus'];
  }) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getDistanceTo: (latitude: number, longitude: number) => number | null;
  isInGeofence: (geofenceId: string) => boolean;
  getActiveGeofences: () => Geofence[];
  getAvailableBuddies: () => NearbyBuddy[];
  clearAll: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLocation: null,
      lastKnownLocation: null,
      city: null,
      area: null,
      isTracking: false,
      trackingMode: 'off',
      trackingAccuracy: 'balanced',
      geofences: [],
      activeGeofence: null,
      nearbyBuddies: [],
      nearbyBuddiesRadius: 5000, // 5km default
      hasLocationPermission: false,
      hasBackgroundPermission: false,
      permissionStatus: 'undetermined',
      isLoading: false,
      error: null,
      
      // Actions
      setCurrentLocation: (currentLocation) => set((state) => ({
        currentLocation,
        lastKnownLocation: state.currentLocation || currentLocation,
        city: currentLocation.city || state.city,
        area: currentLocation.area || state.area,
        isLoading: false,
        error: null,
      })),
      
      setLastKnownLocation: (lastKnownLocation) => set({ lastKnownLocation }),
      
      setCity: (city) => set({ city }),
      
      setArea: (area) => set({ area }),
      
      setTracking: (isTracking) => set({ isTracking }),
      
      setTrackingMode: (trackingMode) => set({ trackingMode }),
      
      setTrackingAccuracy: (trackingAccuracy) => set({ trackingAccuracy }),
      
      setGeofences: (geofences) => set({ geofences }),
      
      addGeofence: (geofence) => set((state) => ({
        geofences: [...state.geofences, geofence],
      })),
      
      updateGeofence: (geofence) => set((state) => ({
        geofences: state.geofences.map((g) => g.id === geofence.id ? geofence : g),
        activeGeofence: state.activeGeofence?.id === geofence.id ? geofence : state.activeGeofence,
      })),
      
      removeGeofence: (geofenceId) => set((state) => ({
        geofences: state.geofences.filter((g) => g.id !== geofenceId),
        activeGeofence: state.activeGeofence?.id === geofenceId ? null : state.activeGeofence,
      })),
      
      setActiveGeofence: (activeGeofence) => set({ activeGeofence }),
      
      setNearbyBuddies: (nearbyBuddies) => set({ nearbyBuddies }),
      
      addNearbyBuddy: (buddy) => set((state) => ({
        nearbyBuddies: [...state.nearbyBuddies.filter((b) => b.id !== buddy.id), buddy],
      })),
      
      updateNearbyBuddy: (buddy) => set((state) => ({
        nearbyBuddies: state.nearbyBuddies.map((b) => b.id === buddy.id ? buddy : b),
      })),
      
      removeNearbyBuddy: (buddyId) => set((state) => ({
        nearbyBuddies: state.nearbyBuddies.filter((b) => b.id !== buddyId),
      })),
      
      setNearbyBuddiesRadius: (nearbyBuddiesRadius) => set({ nearbyBuddiesRadius }),
      
      setPermissions: (permissions) => set({ ...permissions }),
      
      setLoading: (isLoading) => set({ isLoading, error: isLoading ? null : get().error }),
      
      setError: (error) => set({ error, isLoading: false }),
      
      // Computed
      getDistanceTo: (latitude, longitude) => {
        const { currentLocation } = get();
        if (!currentLocation) return null;
        
        const R = 6371e3; // Earth radius in meters
        const φ1 = currentLocation.latitude * Math.PI / 180;
        const φ2 = latitude * Math.PI / 180;
        const Δφ = (latitude - currentLocation.latitude) * Math.PI / 180;
        const Δλ = (longitude - currentLocation.longitude) * Math.PI / 180;
        
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distance in meters
      },
      
      isInGeofence: (geofenceId) => {
        const { currentLocation, geofences } = get();
        if (!currentLocation) return false;
        
        const geofence = geofences.find((g) => g.id === geofenceId);
        if (!geofence || !geofence.isActive) return false;
        
        const distance = get().getDistanceTo(geofence.latitude, geofence.longitude);
        return distance !== null && distance <= geofence.radius;
      },
      
      getActiveGeofences: () => 
        get().geofences.filter((g) => g.isActive),
      
      getAvailableBuddies: () => 
        get().nearbyBuddies.filter((b) => b.isAvailable),
      
      clearAll: () => set({
        currentLocation: null,
        lastKnownLocation: null,
        city: null,
        area: null,
        isTracking: false,
        trackingMode: 'off',
        trackingAccuracy: 'balanced',
        geofences: [],
        activeGeofence: null,
        nearbyBuddies: [],
        nearbyBuddiesRadius: 5000,
        hasLocationPermission: false,
        hasBackgroundPermission: false,
        permissionStatus: 'undetermined',
        isLoading: false,
        error: null,
      }),
    }),
    {
      name: 'location-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        // Persist tracking preferences and geofences
        trackingMode: state.trackingMode,
        trackingAccuracy: state.trackingAccuracy,
        nearbyBuddiesRadius: state.nearbyBuddiesRadius,
        geofences: state.geofences,
      }),
    }
  )
);

// Selectors
export const selectCurrentLocation = (state: LocationState) => state.currentLocation;
export const selectLastKnownLocation = (state: LocationState) => state.lastKnownLocation;
export const selectCity = (state: LocationState) => state.city;
export const selectArea = (state: LocationState) => state.area;
export const selectIsTracking = (state: LocationState) => state.isTracking;
export const selectTrackingMode = (state: LocationState) => state.trackingMode;
export const selectTrackingAccuracy = (state: LocationState) => state.trackingAccuracy;
export const selectGeofences = (state: LocationState) => state.geofences;
export const selectActiveGeofence = (state: LocationState) => state.activeGeofence;
export const selectNearbyBuddies = (state: LocationState) => state.nearbyBuddies;
export const selectAvailableBuddies = (state: LocationState) => state.getAvailableBuddies();
export const selectNearbyBuddiesRadius = (state: LocationState) => state.nearbyBuddiesRadius;
export const selectLocationPermissions = (state: LocationState) => ({
  hasLocationPermission: state.hasLocationPermission,
  hasBackgroundPermission: state.hasBackgroundPermission,
  permissionStatus: state.permissionStatus,
});
export const selectLocationLoading = (state: LocationState) => state.isLoading;
export const selectLocationError = (state: LocationState) => state.error;