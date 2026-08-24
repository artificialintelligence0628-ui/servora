import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { saveSubscription, removeSubscription } from '../store/pushStore.js';

const router = Router();

router.post('/subscribe', requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'Invalid push subscription' });
  }
  const subscription = await saveSubscription(req.user.id, { endpoint, p256dh: keys.p256dh, auth: keys.auth });
  res.status(201).json({ subscription });
});

router.post('/unsubscribe', requireAuth, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'endpoint is required' });
  await removeSubscription(endpoint);
  res.json({ message: 'Unsubscribed' });
});

export default router;
