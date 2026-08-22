// add-provider-documents.js — applies migrations/002_provider_documents.sql.
// Usage: npm run db:migrate:documents
import { readFileSync } from 'node:fs';
import 'dotenv/config';
import { pool } from './server/db.js';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Add it to your .env file first.');
    process.exit(1);
  }

  const sql = readFileSync(new URL('./migrations/002_provider_documents.sql', import.meta.url), 'utf8');
  console.log('Applying migrations/002_provider_documents.sql ...');

  try {
    await pool.query(sql);
    console.log('Migration applied successfully — providers can now upload multiple documents.');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Looks like this migration was already applied — nothing to do.');
    } else {
      console.error('Migration failed:', err.message);
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main();
