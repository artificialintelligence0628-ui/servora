// store/providerStore.js — all SQL related to the providers table.
import { query } from '../db.js';

// Postgres returns array-of-enum columns as a raw literal string (e.g. "{repairs,water}")
// rather than a JS array — pg only auto-parses built-in array types, not custom enum arrays.
// Normalize it here so every caller gets a real array.
function normalizeProvider(row) {
  if (!row) return row;
  if (typeof row.services === 'string') {
    const inner = row.services.replace(/^{|}$/g, '');
    row.services = inner.length ? inner.split(',').map((s) => s.replace(/^"|"$/g, '')) : [];
  }
  return row;
}

function normalizeProviders(rows) {
  return rows.map(normalizeProvider);
}

export async function createProviderProfile(userId, { services = [], operatingArea, university } = {}) {
  const { rows } = await query(
    `INSERT INTO providers (user_id, services, operating_area, university)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, services, operatingArea ?? null, university ?? null]
  );
  return normalizeProvider(rows[0]);
}

export async function findProviderByUserId(userId) {
  const { rows } = await query(`SELECT * FROM providers WHERE user_id = $1`, [userId]);
  return normalizeProvider(rows[0]) ?? null;
}

export async function findProviderById(id) {
  const { rows } = await query(`SELECT * FROM providers WHERE id = $1`, [id]);
  return normalizeProvider(rows[0]) ?? null;
}

/** Find available, verified providers offering a given service in an area, for matching. */
export async function findAvailableProviders({ serviceType, operatingArea, excludeProviderId }) {
  const { rows } = await query(
    `SELECT * FROM providers
     WHERE status = 'verified'
       AND is_available = TRUE
       AND EXISTS (SELECT 1 FROM unnest(services) s WHERE LOWER(s) = LOWER($1))
       AND (
         $2::text IS NULL
         OR operating_area ILIKE '%' || $2 || '%'
         OR university ILIKE '%' || $2 || '%'
       )
       AND ($3::uuid IS NULL OR id <> $3)
     ORDER BY rating_avg DESC
     LIMIT 10`,
    [serviceType, operatingArea ?? null, excludeProviderId ?? null]
  );
  return normalizeProviders(rows);
}

export async function setProviderStatus(providerId, status) {
  const { rows } = await query(
    `UPDATE providers SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [providerId, status]
  );
  return normalizeProvider(rows[0]);
}

export async function setAvailability(providerId, isAvailable) {
  const { rows } = await query(
    `UPDATE providers SET is_available = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [providerId, isAvailable]
  );
  return normalizeProvider(rows[0]);
}

export async function updateProviderProfile(providerId, fields) {
  const allowed = ['services', 'operating_area', 'university', 'commission_rate', 'id_document_url'];
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
  return normalizeProvider(rows[0]);
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
  return normalizeProvider(rows[0]);
}

export async function listProviders({ status } = {}) {
  const { rows } = await query(
    `SELECT p.*, u.name, u.email, u.phone
     FROM providers p JOIN users u ON u.id = p.user_id
     WHERE ($1::provider_status IS NULL OR p.status = $1)
     ORDER BY p.created_at DESC`,
    [status ?? null]
  );
  return normalizeProviders(rows);
}

/**
 * Public-safe provider listing for browsing — verified & available only,
 * and deliberately excludes contact info (email/phone/documents). Anyone can
 * see who's on the platform and pick one, but contact stays in-app via chat.
 */
export async function listPublicProviders({ service, university } = {}) {
  const { rows } = await query(
    `SELECT p.id, p.services, p.operating_area, p.university, p.rating_avg, p.rating_count,
            u.name
     FROM providers p JOIN users u ON u.id = p.user_id
     WHERE p.status = 'verified'
       AND p.is_available = TRUE
       AND ($1::text IS NULL OR EXISTS (SELECT 1 FROM unnest(p.services) s WHERE LOWER(s) = LOWER($1)))
       AND ($2::text IS NULL OR p.university ILIKE '%' || $2 || '%' OR p.operating_area ILIKE '%' || $2 || '%')
     ORDER BY p.rating_avg DESC
     LIMIT 50`,
    [service ?? null, university ?? null]
  );
  return normalizeProviders(rows);
}
