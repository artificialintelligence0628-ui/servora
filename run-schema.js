// run-schema.js — pushes schema.sql to the database in DATABASE_URL.
// Usage: npm run db:push
import { readFileSync } from 'node:fs';
import 'dotenv/config';
import { pool } from './server/db.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to your .env file first.');
    process.exit(1);
  }

  const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
  console.log('Running schema.sql against the database...');

  try {
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Failed to apply schema:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
