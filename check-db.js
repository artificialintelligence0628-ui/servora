// check-db.js — lists tables currently in the database, for diagnosing schema issues.
// Usage: npm run db:check
import 'dotenv/config';
import { pool } from './server/db.js';

async function main() {
  try {
    const { rows } = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`Found ${rows.length} table(s) in the public schema:`);
    rows.forEach((r) => console.log(' -', r.table_name));

    const expected = ['users', 'providers', 'orders', 'payments', 'reviews', 'support_tickets', 'messages'];
    const found = rows.map((r) => r.table_name);
    const missing = expected.filter((t) => !found.includes(t));
    if (missing.length > 0) {
      console.log('\nMISSING tables:', missing.join(', '));
      console.log('Run: npm run db:push');
    } else {
      console.log('\nAll expected tables are present.');
    }
  } catch (err) {
    console.error('Could not check database:', err.message);
  } finally {
    await pool.end();
  }
}

main();
