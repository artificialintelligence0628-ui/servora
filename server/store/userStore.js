// store/userStore.js — all SQL related to the users table.
import { query } from '../db.js';

const PUBLIC_COLUMNS = `
  id, role, name, email, phone, email_verified, avatar_url,
  university, hostel, block, room, created_at
`;

export async function createUser({ name, email, phone, passwordHash, role = 'student' }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, phone ?? null, passwordHash, role]
  );
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await query(`SELECT * FROM users WHERE email = $1`, [email]);
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function setEmailVerified(userId) {
  await query(`UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = $1`, [userId]);
}

export async function setVerificationToken(userId, token) {
  await query(`UPDATE users SET verification_token = $2 WHERE id = $1`, [userId, token]);
}

export async function findUserByVerificationToken(token) {
  const { rows } = await query(`SELECT id, name, email FROM users WHERE verification_token = $1`, [token]);
  return rows[0] ?? null;
}

export async function setResetToken(userId, token, expiresAt) {
  await query(`UPDATE users SET reset_token = $2, reset_token_expires = $3 WHERE id = $1`, [userId, token, expiresAt]);
}

export async function findUserByResetToken(token) {
  const { rows } = await query(
    `SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > now()`,
    [token]
  );
  return rows[0] ?? null;
}

export async function updatePassword(userId, passwordHash) {
  await query(
    `UPDATE users SET password_hash = $2, reset_token = NULL, reset_token_expires = NULL, updated_at = now()
     WHERE id = $1`,
    [userId, passwordHash]
  );
}

export async function updateProfile(userId, fields) {
  const allowed = ['name', 'phone', 'avatar_url', 'university', 'hostel', 'block', 'room'];
  const sets = [];
  const values = [userId];
  for (const key of allowed) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (sets.length === 0) return findUserById(userId);
  const { rows } = await query(
    `UPDATE users SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING ${PUBLIC_COLUMNS}`,
    values
  );
  return rows[0];
}

export async function listUsersByRole(role) {
  const { rows } = await query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE role = $1 ORDER BY created_at DESC`, [role]);
  return rows;
}
