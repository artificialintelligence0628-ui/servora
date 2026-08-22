// seed.js — creates the initial admin user. Run with: npm run seed
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { pool, query } from './server/db.js';

async function seed() {
  const name = process.env.SEED_ADMIN_NAME || 'Servora Admin';
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@servora.app').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'change-me-immediately';

  const { rows: existing } = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.length > 0) {
    console.log(`Admin user already exists: ${email}`);
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (name, email, password_hash, role, email_verified)
     VALUES ($1, $2, $3, 'admin', TRUE)`,
    [name, email, passwordHash]
  );

  console.log(`Seeded admin user: ${email}`);
  console.log('Log in with the password from SEED_ADMIN_PASSWORD in your .env, then change it.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
