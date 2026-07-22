/**
 * Location Routes
 * Real-time location sharing, nearby tasks, geofencing
 */

import { Router } from 'express';
import { LocationController } from '../controllers/locationController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { locationValidation } from '../validations/locationValidation';

const router = Router();
const locationController = new LocationController();

// All routes require authentication
router.use(authMiddleware);

// Update current location
router.post('/update',
  validate(locationValidation.updateLocation),
  locationController.updateLocation
);

// Get current location
router.get('/current',
  locationController.getCurrentLocation
);

// Start location sharing for a task
router.post('/share/start',
  validate(locationValidation.startSharing),
  locationController.startLocationSharing
);

// Stop location sharing
router.post('/share/stop',
  validate(locationValidation.stopSharing),
  locationController.stopLocationSharing
);

// Get shared location for a task
router.get('/share/:taskId',
  validate(locationValidation.getSharedLocation),
  locationController.getSharedLocation
);

// Get nearby tasks
router.get('/nearby-tasks',
  validate(locationValidation.getNearbyTasks),
  locationController.getNearbyTasks
);

// Get nearby buddies (taskers)
router.get('/nearby-buddies',
  validate(locationValidation.getNearbyBuddies),
  locationController.getNearbyBuddies
);

// Update geofence settings
router.put('/geofence',
  validate(locationValidation.updateGeofence),
  locationController.updateGeofence
);

// Get geofence settings
router.get('/geofence',
  locationController.getGeofence
);

// Check if location is within service area
router.post('/check-service-area',
  validate(locationValidation.checkServiceArea),
  locationController.checkServiceArea
);

// Get location history (for task tracking)
router.get('/history/:taskId',
  validate(locationValidation.getLocationHistory),
  locationController.getLocationHistory
);

export default router;