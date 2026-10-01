/**
 * Location Context - Location services and geofencing
 * Foreground/background tracking, geofences, nearby buddies
 */

import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { Platform, PermissionsAndroid, AppState, AppStateStatus } from 'react-native';
import { useLocationStore } from '@/store/locationStore';
import { useAuthStore } from '@/store/authStore';
import { Geofence, NearbyBuddy } from '@/types';

// @react-native-community/geolocation is a native-only module that throws at
// import time inside Expo Go. Lazy-require it so the app stays bootable as a
// dev build and gracefully degrades everywhere else.
type GeolocationType = typeof import('@react-native-community/geolocation').default;
let _geolocation: GeolocationType | null = null;
export function getGeolocation(): GeolocationType | null {
  if (_geolocation) return _geolocation;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _geolocation = require('@react-native-community/geolocation').default;
    return _geolocation;
  } catch {
    console.warn('[Location] @react-native-community/geolocation unavailable (needs dev build)');
    return null;
  }
}

interface LocationContextType {
  // State
  currentLocation: { latitude: number; longitude: number } | null;
  lastKnownLocation: { latitude: number; longitude: number } | null;
  isTracking: boolean;
  trackingMode: 'foreground' | 'background' | 'off';
  permissionStatus: 'granted' | 'denied' | 'restricted' | 'undetermined';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<boolean>;
  startTracking: (mode?: 'foreground' | 'background') => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  updateLocation: (location: { latitude: number; longitude: number }) => void;
  
  // Geofences
  geofences: Geofence[];
  addGeofence: (geofence: Omit<Geofence, 'id'>) => string;
  removeGeofence: (id: string) => void;
  clearGeofences: () => void;
  
  // Nearby buddies
  nearbyBuddies: NearbyBuddy[];
  refreshNearbyBuddies: (radius?: number) => Promise<void>;
  
  // City/Area
  currentCity: string | null;
  currentArea: string | null;
  detectCityAndArea: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const {
    currentLocation,
    lastKnownLocation,
    isTracking,
    trackingMode,
    permissionStatus,
    geofences,
    nearbyBuddies,
    currentCity,
    currentArea,
    error,
    setCurrentLocation,
    setLastKnownLocation,
    setTracking,
    setTrackingMode,
    setPermissionStatus,
    addGeofence: storeAddGeofence,
    removeGeofence: storeRemoveGeofence,
    clearGeofences: storeClearGeofences,
    setNearbyBuddies,
    setCurrentCity,
    setCurrentArea,
    setError,
    setLoading,
  } = useLocationStore();
  
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = React.useRef<number | null>(null);
  const backgroundTaskRef = React.useRef<any>(null);

  // Refresh nearby buddies (real API via /location/nearby-buddies)
  const refreshNearbyBuddies = useCallback(async (radius: number = 5000) => {
    if (!currentLocation || !user) return;
    try {
      const { apiGet } = await import('@/services/api');
      const radiusKm = Math.max(1, Math.round(radius / 1000));
      const res = await apiGet<{ buddies: any[] }>(
        `/location/nearby-buddies?lat=${currentLocation.latitude}&lng=${currentLocation.longitude}&radiusKm=${radiusKm}`
      );
      setNearbyBuddies(
        (res?.buddies || []).map((b: any) => ({
          id: b.id,
          name: b.name,
          avatar: b.avatar || '',
          distance: (b.distanceKm ?? 0) * 1000,
          location: currentLocation,
          lastSeen: new Date().toISOString(),
          isOnline: true,
        }))
      );
    } catch (err) {
      console.error('Failed to refresh nearby buddies:', err);
      setNearbyBuddies([]);
    }
  }, [currentLocation, user, setNearbyBuddies]);
  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      let granted = false;
      
      if (Platform.OS === 'ios') {
        // iOS uses Geolocation.requestAuthorization
        const geo = getGeolocation();
        if (!geo) {
          console.warn('[Location] Geolocation module not available');
          setPermissionStatus('denied');
          return false;
        }
        geo.requestAuthorization();
        // On iOS, we need to check after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        granted = true; // iOS handles via system dialog
      } else {
        // Android
        const geo = getGeolocation();
        if (!geo) {
          console.warn('[Location] Geolocation module not available');
          setPermissionStatus('denied');
          return false;
        }
        
        try {
          const grantedPermission = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'LocalBuddy needs access to your location to find nearby tasks and buddies.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          granted = grantedPermission === PermissionsAndroid.RESULTS.GRANTED;
          
          // Also request background location for Android 10+
          if (granted && Number(Platform.Version) >= 29) {
            await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            );
          }
        } catch (permError) {
          console.error('[Location] Android permission request failed:', permError);
          granted = false;
        }
      }
      
      const status = granted ? 'granted' : 'denied';
      setPermissionStatus(status);
      
      return granted;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Permission request failed';
      setError(message);
      setPermissionStatus('denied');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [setPermissionStatus, setError, setIsLoading]);

  // Start location tracking
  const startTracking = useCallback(async (mode: 'foreground' | 'background' = 'foreground') => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check permission first
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }
      
      // Configure Geolocation
      const geo = getGeolocation();
      if (!geo) throw new Error('Geolocation unavailable');
      geo.setRNConfiguration({
        skipPermissionRequests: false,
        authorizationLevel: mode === 'background' ? 'always' : 'whenInUse',
      });
      
      // Start watching position
      const watchId = geo.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const location = { latitude, longitude };
          
          setCurrentLocation(location);
          setLastKnownLocation(location);
          
          // Update nearby buddies periodically
          refreshNearbyBuddies();
        },
        (err) => {
          console.error('Location tracking error:', err);
          setError(err.message);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 10, // Update every 10 meters
          interval: 5000, // 5 seconds
          fastestInterval: 2000,
          useSignificantChanges: mode === 'background',
        }
      );
      
      watchIdRef.current = watchId;
      setTracking(true);
      setTrackingMode(mode);
      
      // For background tracking on Android, we'd need a headless task
      // This is a simplified version - full background tracking requires
      // react-native-background-geolocation or similar
      if (mode === 'background' && Platform.OS === 'android') {
        // Register background task (requires additional setup)
        console.log('Background tracking started (requires headless task setup)');
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start tracking';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    permissionStatus, 
    requestPermission, 
    setCurrentLocation, 
    setLastKnownLocation, 
    setTracking, 
    setTrackingMode, 
    setError, 
    setIsLoading
  ]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      getGeolocation()?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    setTracking(false);
    setTrackingMode('off');
  }, [setTracking, setTrackingMode]);

  // Get current location once
  const getCurrentLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (permissionStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) return null;
      }
      
      const geo = getGeolocation();
      if (!geo) {
        setError('Geolocation module not available');
        return null;
      }
      
      return new Promise((resolve, reject) => {
        geo.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            setCurrentLocation(location);
            setLastKnownLocation(location);
            resolve(location);
          },
          (err) => {
            setError(err.message);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [permissionStatus, requestPermission, setCurrentLocation, setLastKnownLocation, setError, setIsLoading]);

  // Update location manually
  const updateLocation = useCallback((location: { latitude: number; longitude: number }) => {
    setCurrentLocation(location);
    setLastKnownLocation(location);
  }, [setCurrentLocation, setLastKnownLocation]);

  // Geofence management
  const addGeofence = useCallback((
    geofence: Omit<Geofence, 'id'>
  ): string => {
    const id = `geofence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    storeAddGeofence({ ...geofence, id });
    return id;
  }, [storeAddGeofence]);

  const removeGeofence = useCallback((id: string) => {
    storeRemoveGeofence(id);
  }, [storeRemoveGeofence]);

  const clearGeofences = useCallback(() => {
    storeClearGeofences();
  }, [storeClearGeofences]);


  // Detect city and area (real reverse geocoding)
  const detectCityAndArea = useCallback(async () => {
    if (!currentLocation) return;
    try {
      const Location = await import('expo-location');
      const results = await Location.reverseGeocodeAsync({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
      if (results.length > 0) {
        setCurrentCity(results[0].city || results[0].region || 'Unknown');
        setCurrentArea(results[0].district || results[0].subregion || results[0].street || '');
      }
    } catch (err) {
      console.error('City detection failed:', err);
    }
  }, [currentLocation, setCurrentCity, setCurrentArea]);

  // App state listener for background/foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && trackingMode === 'background') {
        // App came to foreground, ensure tracking continues
        startTracking('foreground');
      } else if (nextState === 'background' && trackingMode === 'foreground') {
        // App went to background, switch to background tracking if enabled
        // This would require background task setup
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [trackingMode, startTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        getGeolocation()?.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Auto-detect city when location changes
  useEffect(() => {
    if (currentLocation) {
      detectCityAndArea();
    }
  }, [currentLocation, detectCityAndArea]);

  // Auto-refresh nearby buddies when location changes significantly
  useEffect(() => {
    if (currentLocation && isTracking) {
      refreshNearbyBuddies();
    }
  }, [currentLocation, isTracking, refreshNearbyBuddies]);

  const value: LocationContextType = {
    currentLocation,
    lastKnownLocation,
    isTracking,
    trackingMode,
    permissionStatus,
    isLoading,
    error,
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentLocation,
    updateLocation,
    geofences,
    addGeofence,
    removeGeofence,
    clearGeofences,
    nearbyBuddies,
    refreshNearbyBuddies,
    currentCity,
    currentArea,
    detectCityAndArea,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

// Hook for geofence management
export function useGeofences() {
  const { geofences, addGeofence, removeGeofence, clearGeofences } = useLocation();
  return { geofences, addGeofence, removeGeofence, clearGeofences };
}

// Hook for nearby buddies
export function useNearbyBuddies() {
  const { nearbyBuddies, refreshNearbyBuddies } = useLocation();
  return { nearbyBuddies, refreshNearbyBuddies };
}

// Hook for city/area detection
export function useCityArea() {
  const { currentCity, currentArea, detectCityAndArea } = useLocation();
  return { currentCity, currentArea, detectCityAndArea };
}