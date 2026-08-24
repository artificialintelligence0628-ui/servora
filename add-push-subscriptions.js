// add-push-subscriptions.js — applies migrations/007_push_subscriptions.sql.
// Usage: npm run db:migrate:push
import { readFileSync } from 'node:fs';
import 'dotenv/config';
import { pool } from './server/db.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to your .env file first.');
    process.exit(1);
  }

  const sql = readFileSync(new URL('./migrations/007_push_subscriptions.sql', import.meta.url), 'utf8');
  console.log('Applying migrations/007_push_subscriptions.sql ...');

  try {
    await pool.query(sql);
    console.log('Migration applied successfully — push notifications are ready to use.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
