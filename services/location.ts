/**
 * Location Service
 * Based on Architecture.md - expo-location with background tracking
 * Handles permissions, foreground/background location, geofencing
 */

import * as Location from 'expo-location';
import { Platform, PermissionsAndroid } from 'react-native';
import { CITIES } from '@/constants/app';
import { preferencesStorage } from './storage';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

export interface GeofenceRegion {
  identifier: string;
  latitude: number;
  longitude: number;
  radius: number;
  notifyOnEnter: boolean;
  notifyOnExit: boolean;
}

export interface NearbyBuddy {
  id: string;
  name: string;
  avatar?: string;
  distance: number; // in meters
  location: LocationCoords;
  isAvailable: boolean;
  rating: number;
  skills: string[];
}

// Location permission handling
export const requestLocationPermission = async (): Promise<LocationPermissionStatus> => {
  try {
    // Check current permission status
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    
    if (foregroundStatus === 'granted') {
      // Also request background permission for live tracking
      const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
      if (backgroundStatus === 'granted') {
        return { granted: true, canAskAgain: false, status: 'granted' };
      }
      
      // Request background permission
      const { status: newBackgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      return {
        granted: newBackgroundStatus === 'granted',
        canAskAgain: newBackgroundStatus !== 'denied',
        status: newBackgroundStatus,
      };
    }

    // Request foreground permission first
    const { status: newForegroundStatus, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    
    if (newForegroundStatus !== 'granted') {
      return { granted: false, canAskAgain, status: newForegroundStatus };
    }

    // Request background permission
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    return {
      granted: backgroundStatus === 'granted',
      canAskAgain: backgroundStatus !== 'denied',
      status: backgroundStatus,
    };
  } catch (error) {
    console.error('[Location] Permission request error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
};

export const checkLocationPermission = async (): Promise<LocationPermissionStatus> => {
  try {
    const { status: foregroundStatus } = await Location.getForegroundPermissionsAsync();
    const { status: backgroundStatus } = await Location.getBackgroundPermissionsAsync();
    
    const granted = foregroundStatus === 'granted' && backgroundStatus === 'granted';
    const canAskAgain = foregroundStatus !== 'denied' || backgroundStatus !== 'denied';
    
    return {
      granted,
      canAskAgain,
      status: granted ? 'granted' : foregroundStatus,
    };
  } catch (error) {
    console.error('[Location] Permission check error:', error);
    return { granted: false, canAskAgain: false, status: 'denied' };
  }
};

// Location fetching
export const getCurrentLocation = async (options?: Location.LocationOptions): Promise<LocationCoords | null> => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission.granted) {
      const requested = await requestLocationPermission();
      if (!requested.granted) {
        console.warn('[Location] Permission denied');
        return null;
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      maximumAge: 10000,
      timeout: 15000,
      ...options,
    });

    const coords: LocationCoords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
      altitude: location.coords.altitude ?? undefined,
      heading: location.coords.heading ?? undefined,
      speed: location.coords.speed ?? undefined,
      timestamp: location.timestamp,
    };

    // Cache last known location
    await preferencesStorage.setLastKnownLocation(coords);
    
    return coords;
  } catch (error) {
    console.error('[Location] Get current location error:', error);
    
    // Return cached location as fallback
    const cached = await preferencesStorage.getLastKnownLocation();
    return cached || null;
  }
};

export const getLastKnownLocation = async (): Promise<LocationCoords | null> => {
  return preferencesStorage.getLastKnownLocation();
};

// Reverse geocoding
export const reverseGeocode = async (latitude: number, longitude: number): Promise<Location.LocationGeocodedAddress | null> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    return results[0] || null;
  } catch (error) {
    console.error('[Location] Reverse geocode error:', error);
    return null;
  }
};

export const geocodeAddress = async (address: string): Promise<Location.LocationGeocodedLocation | null> => {
  try {
    const results = await Location.geocodeAsync(address);
    return results[0] || null;
  } catch (error) {
    console.error('[Location] Geocode error:', error);
    return null;
  }
};

// City detection
export const detectCity = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const address = await reverseGeocode(latitude, longitude);
    if (!address) return null;

    const city = address.city || address.subregion || address.region || '';
    
    // Match with known cities
    const matchedCity = CITIES.find(c => 
      c.name.toLowerCase() === city.toLowerCase() ||
      c.district.toLowerCase() === address.subregion?.toLowerCase() ||
      c.state.toLowerCase() === address.region?.toLowerCase()
    );
    
    return matchedCity?.name || city || null;
  } catch (error) {
    console.error('[Location] City detection error:', error);
    return null;
  }
};

export const getCityByCoordinates = (latitude: number, longitude: number): typeof CITIES[0] | null => {
  // Simple bounding box check for known cities
  for (const city of CITIES) {
    // Approximate bounding boxes (in production, use proper geofencing)
    const latDiff = Math.abs(city.latitude - latitude);
    const lngDiff = Math.abs(city.longitude - longitude);
    
    // ~50km radius approximation
    if (latDiff < 0.5 && lngDiff < 0.5) {
      return city;
    }
  }
  return null;
};

// Distance calculation (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// Background location tracking
let backgroundLocationSubscription: Location.LocationSubscription | null = null;
let foregroundLocationSubscription: Location.LocationSubscription | null = null;

export const startBackgroundLocationUpdates = async (
  onLocation: (location: LocationCoords) => void,
  options?: Location.TaskOptions
): Promise<boolean> => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission.granted) {
      console.warn('[Location] Background permission not granted');
      return false;
    }

    // Stop existing subscription
    if (backgroundLocationSubscription) {
      backgroundLocationSubscription.remove();
    }

    // Configure background task
    await Location.startLocationUpdatesAsync('background-location-tracking', {
      accuracy: Location.Accuracy.High,
      timeInterval: 30000, // 30 seconds
      distanceInterval: 100, // 100 meters
      deferredUpdatesInterval: 60000,
      deferredUpdatesDistance: 500,
      pausesUpdatesAutomatically: true,
      foregroundService: {
        notificationTitle: 'Local Buddy - Location Tracking',
        notificationBody: 'Sharing your location for nearby tasks',
        notificationColor: '#4F46E5', // Indigo-600
      },
      ...options,
    });

    // Subscribe to updates
    backgroundLocationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000,
        distanceInterval: 100,
      },
      (location) => {
        const coords: LocationCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
          altitude: location.coords.altitude ?? undefined,
          heading: location.coords.heading ?? undefined,
          speed: location.coords.speed ?? undefined,
          timestamp: location.timestamp,
        };
        onLocation(coords);
      }
    );

    return true;
  } catch (error) {
    console.error('[Location] Start background tracking error:', error);
    return false;
  }
};

export const stopBackgroundLocationUpdates = async (): Promise<void> => {
  try {
    if (backgroundLocationSubscription) {
      backgroundLocationSubscription.remove();
      backgroundLocationSubscription = null;
    }
    await Location.stopLocationUpdatesAsync('background-location-tracking');
  } catch (error) {
    console.error('[Location] Stop background tracking error:', error);
  }
};

export const startForegroundLocationUpdates = async (
  onLocation: (location: LocationCoords) => void,
  options?: Location.LocationOptions
): Promise<boolean> => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission.granted) {
      return false;
    }

    if (foregroundLocationSubscription) {
      foregroundLocationSubscription.remove();
    }

    foregroundLocationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
        ...options,
      },
      (location) => {
        const coords: LocationCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
          altitude: location.coords.altitude ?? undefined,
          heading: location.coords.heading ?? undefined,
          speed: location.coords.speed ?? undefined,
          timestamp: location.timestamp,
        };
        onLocation(coords);
      }
    );

    return true;
  } catch (error) {
    console.error('[Location] Start foreground tracking error:', error);
    return false;
  }
};

export const stopForegroundLocationUpdates = async (): Promise<void> => {
  try {
    if (foregroundLocationSubscription) {
      foregroundLocationSubscription.remove();
      foregroundLocationSubscription = null;
    }
  } catch (error) {
    console.error('[Location] Stop foreground tracking error:', error);
  }
};

// Geofencing
export const startGeofencing = async (
  regions: GeofenceRegion[],
  onEnter: (region: GeofenceRegion) => void,
  onExit: (region: GeofenceRegion) => void
): Promise<boolean> => {
  try {
    const hasPermission = await checkLocationPermission();
    if (!hasPermission.granted) return false;

    // Note: expo-location geofencing requires background permissions
    // and is limited to 20 regions on iOS
    for (const region of regions) {
      await Location.startGeofencingAsync(region.identifier, [
        {
          latitude: region.latitude,
          longitude: region.longitude,
          radius: region.radius,
          notifyOnEnter: region.notifyOnEnter,
          notifyOnExit: region.notifyOnExit,
        },
      ]);
    }

    // Listen for geofencing events
    // Note: This requires a background task handler in app.config.js
    return true;
  } catch (error) {
    console.error('[Location] Start geofencing error:', error);
    return false;
  }
};

export const stopGeofencing = async (identifiers: string[]): Promise<void> => {
  try {
    for (const id of identifiers) {
      await Location.stopGeofencingAsync(id);
    }
  } catch (error) {
    console.error('[Location] Stop geofencing error:', error);
  }
};

// Nearby buddies (mock - would integrate with Supabase realtime)
export const getNearbyBuddies = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<NearbyBuddy[]> => {
  // This would typically query Supabase/Firestore for nearby buddies
  // For now, return mock data
  return [];
};

// Utility: Open maps app
export const openMapsApp = async (latitude: number, longitude: number, label?: string): Promise<void> => {
  const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
  const url = `${scheme}${latitude},${longitude}${label ? `?q=${encodeURIComponent(label)}` : ''}`;
  
  try {
    await Location.openMapsAsync({ latitude, longitude, name: label });
  } catch (error) {
    console.error('[Location] Open maps error:', error);
  }
};

// Utility: Get directions
export const getDirections = async (
  from: LocationCoords,
  to: LocationCoords
): Promise<string> => {
  const url = `https://www.google.com/maps/dir/${from.latitude},${from.longitude}/${to.latitude},${to.longitude}`;
  return url;
};

export default {
  requestLocationPermission,
  checkLocationPermission,
  getCurrentLocation,
  getLastKnownLocation,
  reverseGeocode,
  geocodeAddress,
  detectCity,
  getCityByCoordinates,
  calculateDistance,
  formatDistance,
  startBackgroundLocationUpdates,
  stopBackgroundLocationUpdates,
  startForegroundLocationUpdates,
  stopForegroundLocationUpdates,
  startGeofencing,
  stopGeofencing,
  getNearbyBuddies,
  openMapsApp,
  getDirections,
};