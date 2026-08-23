// add-provider-university.js — applies migrations/004_provider_university.sql.
// Usage: npm run db:migrate:university
import { readFileSync } from 'node:fs';
import 'dotenv/config';
import { pool } from './server/db.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to your .env file first.');
    process.exit(1);
  }

  const sql = readFileSync(new URL('./migrations/004_provider_university.sql', import.meta.url), 'utf8');
  console.log('Applying migrations/004_provider_university.sql ...');

  try {
    await pool.query(sql);
    console.log('Migration applied successfully — providers now have a structured university field.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
