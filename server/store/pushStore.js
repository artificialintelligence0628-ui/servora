// store/pushStore.js — all SQL related to push_subscriptions.
import { query } from '../db.js';

export async function saveSubscription(userId, { endpoint, p256dh, auth }) {
  // Upsert: same browser re-subscribing just refreshes the row.
  const { rows } = await query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET user_id = $1, p256dh = $3, auth = $4
     RETURNING *`,
    [userId, endpoint, p256dh, auth]
  );
  return rows[0];
}

export async function removeSubscription(endpoint) {
  await query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [endpoint]);
}

export async function listSubscriptionsForUser(userId) {
  const { rows } = await query(`SELECT * FROM push_subscriptions WHERE user_id = $1`, [userId]);
  return rows;
}
