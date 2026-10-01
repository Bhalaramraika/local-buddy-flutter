/**
 * Location & Sharing Routes
 * Nearby buddies, location update alias, location sharing sessions, geofences
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { collections, UserDocument, timestamp } from '../models';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

const haversineKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aa));
};

/**
 * GET /api/v1/location/nearby-buddies?lat=..&lng=..&radiusKm=..
 */
router.get(
  '/nearby-buddies',
  requireAuth,
  validateQuery(
    z.object({
      lat: z.coerce.number().min(-90).max(90),
      lng: z.coerce.number().min(-180).max(180),
      radiusKm: z.coerce.number().min(1).max(50).default(10),
    })
  ),
  async (req: Request, res: Response) => {
    const { lat, lng, radiusKm } = req.query as unknown as { lat: number; lng: number; radiusKm: number };
    const snap = await collections.users
      .where('role', '==', 'buddy')
      .where('status', '==', 'active')
      .limit(200)
      .get();
    const buddies = snap.docs
      .map((d) => d.data() as UserDocument)
      .filter((u) => u.coordinates)
      .map((u) => {
        const dist = haversineKm({ lat, lng }, { lat: u.coordinates!.latitude, lng: u.coordinates!.longitude });
        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          rating: u.rating?.average ?? 0,
          completedTasks: u.stats?.tasksCompleted ?? 0,
          distanceKm: Math.round(dist * 10) / 10,
        };
      })
      .filter((b) => b.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
    res.json({ success: true, buddies });
  }
);

/**
 * PUT /api/v1/location/update
 */
router.put(
  '/update',
  requireAuth,
  validateBody(
    z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      address: z.string().optional(),
    })
  ),
  async (req: Request, res: Response) => {
    await collections.users.doc(req.user!.uid).update({
      currentLocation: {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        updatedAt: timestamp(),
      },
      ...(req.body.address ? { city: String(req.body.address).split(',')[0] } : {}),
      updatedAt: timestamp(),
    });
    res.json({ success: true });
  }
);

/**
 * Location sharing sessions (subcollection users/{uid}/locationShares)
 */
const shareSchema = z.object({
  label: z.string().min(1).max(100),
  sharedWith: z.array(z.string().min(3).max(100)).min(1).max(10),
  expiresAt: z.string().datetime().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

router.get('/shares', requireAuth, async (req: Request, res: Response) => {
  const snap = await collections.users.doc(req.user!.uid).collection('locationShares').get();
  const now = new Date();
  const items = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s: any) => !s.expiresAt || new Date(s.expiresAt) > now);
  res.json({ success: true, shares: items });
});

router.post('/shares', requireAuth, validateBody(shareSchema), async (req: Request, res: Response) => {
  const ref = collections.users.doc(req.user!.uid).collection('locationShares').doc();
  const now = timestamp();
  await ref.set({
    id: ref.id,
    ...req.body,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  res.json({ success: true, share: (await ref.get()).data() });
});

router.delete(
  '/shares/:id',
  requireAuth,
  validateParams(z.object({ id: z.string() })),
  async (req: Request, res: Response) => {
    const ref = collections.users.doc(req.user!.uid).collection('locationShares').doc(req.params.id);
    if (!(await ref.get()).exists) throw new NotFoundError('Share not found');
    await ref.delete();
    res.json({ success: true });
  }
);

/**
 * Geofences (users/{uid}/geofences)
 */
const geofenceSchema = z.object({
  name: z.string().min(1).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(10).max(100000),
  notifyContacts: z.array(z.string()).optional(),
});

router.get('/geofences', requireAuth, async (req: Request, res: Response) => {
  const snap = await collections.users.doc(req.user!.uid).collection('geofences').get();
  res.json({ success: true, geofences: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

router.post('/geofences', requireAuth, validateBody(geofenceSchema), async (req: Request, res: Response) => {
  const ref = collections.users.doc(req.user!.uid).collection('geofences').doc();
  await ref.set({ id: ref.id, ...req.body, enabled: true, createdAt: timestamp() });
  res.json({ success: true, geofence: (await ref.get()).data() });
});

router.delete(
  '/geofences/:id',
  requireAuth,
  validateParams(z.object({ id: z.string() })),
  async (req: Request, res: Response) => {
    const ref = collections.users.doc(req.user!.uid).collection('geofences').doc(req.params.id);
    if (!(await ref.get()).exists) throw new NotFoundError('Geofence not found');
    await ref.delete();
    res.json({ success: true });
  }
);

export default router;
