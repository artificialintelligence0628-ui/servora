// db.js — thin wrapper around the pg Pool.
// All raw SQL execution lives here. Domain logic lives in server/store/*.js.
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL is not set. Set it in your .env file (see .env.example).');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});

/**
 * Run a parameterized query.
 * @param {string} text
 * @param {any[]} params
 */
export async function query(text, params = []) {
  const start = Date.now();
  const result = await pool.query(text, params);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[db]', text.replace(/\s+/g, ' ').trim(), `(${Date.now() - start}ms, ${result.rowCount} rows)`);
  }
  return result;
}

/** Run a callback inside a transaction. */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
