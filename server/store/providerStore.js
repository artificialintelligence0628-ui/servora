// store/providerStore.js — all SQL related to the providers table.
import { query } from '../db.js';

export async function createProviderProfile(userId, { services = [], operatingArea } = {}) {
  const { rows } = await query(
    `INSERT INTO providers (user_id, services, operating_area)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, services, operatingArea ?? null]
  );
  return rows[0];
}

export async function findProviderByUserId(userId) {
  const { rows } = await query(`SELECT * FROM providers WHERE user_id = $1`, [userId]);
  return rows[0] ?? null;
}

export async function findProviderById(id) {
  const { rows } = await query(`SELECT * FROM providers WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

/** Find available, verified providers offering a given service in an area, for matching. */
export async function findAvailableProviders({ serviceType, operatingArea }) {
  const { rows } = await query(
    `SELECT * FROM providers
     WHERE status = 'verified'
       AND is_available = TRUE
       AND $1 = ANY(services)
       AND ($2::text IS NULL OR operating_area ILIKE '%' || $2 || '%')
     ORDER BY rating_avg DESC
     LIMIT 10`,
    [serviceType, operatingArea ?? null]
  );
  return rows;
}

export async function setProviderStatus(providerId, status) {
  const { rows } = await query(
    `UPDATE providers SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [providerId, status]
  );
  return rows[0];
}

export async function setAvailability(providerId, isAvailable) {
  const { rows } = await query(
    `UPDATE providers SET is_available = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [providerId, isAvailable]
  );
  return rows[0];
}

export async function updateProviderProfile(providerId, fields) {
  const allowed = ['services', 'operating_area', 'commission_rate', 'id_document_url'];
  const sets = [];
  const values = [providerId];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (sets.length === 0) return findProviderById(providerId);
  const { rows } = await query(
    `UPDATE providers SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING *`,
    values
  );
  return rows[0];
}

export async function recordRating(providerId, rating) {
  // Recompute running average atomically.
  const { rows } = await query(
    `UPDATE providers
     SET rating_count = rating_count + 1,
         rating_avg = ((rating_avg * rating_count) + $2) / (rating_count + 1),
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [providerId, rating]
  );
  return rows[0];
}

export async function listProviders({ status } = {}) {
  const { rows } = await query(
    `SELECT p.*, u.name, u.email, u.phone
     FROM providers p JOIN users u ON u.id = p.user_id
     WHERE ($1::provider_status IS NULL OR p.status = $1)
     ORDER BY p.created_at DESC`,
    [status ?? null]
  );
  return rows;
}
