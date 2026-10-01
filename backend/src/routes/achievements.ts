/**
 * Achievements Routes
 * Computed from user stats + reviews — nothing stored client-side.
 */

import { Router, Request, Response } from 'express';
import { collections, UserDocument } from '../models';
import { requireAuth } from '../middleware/auth';

const router = Router();

const ACHIEVEMENTS = [
  { id: 'early_adopter', name: 'Early Adopter', description: 'Join LocalBuddy', icon: 'sparkles', xp: 100 },
  { id: 'first_task', name: 'Task Taker', description: 'Create your first task', icon: 'checkmark-circle', xp: 100 },
  { id: 'five_tasks', name: 'Busy Bee', description: 'Complete 5 tasks', icon: 'flash', xp: 200 },
  { id: 'ten_tasks', name: 'Power User', description: 'Complete 10 tasks', icon: 'trophy', xp: 400 },
  { id: 'top_rated', name: 'Top Rated', description: 'Avg rating above 4.5 with 3+ ratings', icon: 'star', xp: 500 },
  { id: 'earning_club', name: 'Earning Club', description: 'Earn over ₹1,000 on the platform', icon: 'cash', xp: 300 },
  { id: 'five_stars_day', name: 'All Stars', description: 'Receive a five-star rating from a task', icon: 'heart', xp: 150 },
  { id: 'referral_starter', name: 'Influencer', description: 'Refer 1 friend', icon: 'megaphone', xp: 200 },
];

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const userDoc = await collections.users.doc(req.user!.uid).get();
  const u = (userDoc.data() as UserDocument) || ({} as any);
  const stats = u.stats || ({} as any);
  const rating = u.rating || { average: 0, count: 0 };

  const peerReviewsSnap = await collections.reviews.where('revieweeId', '==', req.user!.uid).limit(200).get();
  const reviews = peerReviewsSnap.docs.map((d) => d.data());
  const hasFiveStar = reviews.some((r: any) => r.rating === 5);
  const referralCountSnap = await collections.referrals.where('userId', '==', req.user!.uid).limit(200).get();

  const values = {
    early_adopter: !!u.createdAt,
    first_task: (stats.tasksPosted || 0) >= 1,
    five_tasks: (stats.tasksCompleted || 0) >= 5,
    ten_tasks: (stats.tasksCompleted || 0) >= 10,
    top_rated: rating.average >= 4.5 && rating.count >= 3,
    earning_club: (stats.totalEarnings || 0) >= 1000,
    five_stars_day: hasFiveStar,
    referral_starter: referralCountSnap.size >= 1,
  };

  const items = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: !!values[a.id as keyof typeof values],
    unlockedAt: values[a.id as keyof typeof values] ? new Date().toISOString() : null,
  }));

  res.json({ success: true, achievements: items });
});

export default router;
