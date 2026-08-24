// utils/push.js — sends web push notifications via VAPID (no third-party
// push service needed — this is the browser-native standard).
import webpush from 'web-push';
import 'dotenv/config';
import { listSubscriptionsForUser, removeSubscription } from '../store/pushStore.js';

const configured = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;

if (configured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@servora.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[push] VAPID keys not set — push notifications are disabled. Run: node generate-vapid-keys.js');
}

/**
 * Send a push notification to every device a user has subscribed on.
 * Silently does nothing if VAPID isn't configured, so this is always safe to call.
 */
export async function notifyUser(userId, { title, body, url }) {
  if (!configured) return;

  const subscriptions = await listSubscriptionsForUser(userId);
  const payload = JSON.stringify({ title, body, url: url || '/' });

  await Promise.all(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err) {
        // 404/410 means the browser unsubscribed or the subscription expired — clean it up.
        if (err.statusCode === 404 || err.statusCode === 410) {
          await removeSubscription(sub.endpoint);
        } else {
          console.error('[push] send failed:', err.message);
        }
      }
    })
  );
}
