import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  createUser, findUserByEmail, findUserById, setEmailVerified, setVerificationToken,
  findUserByVerificationToken, setResetToken, findUserByResetToken, updatePassword,
} from '../store/userStore.js';
import { createProviderProfile } from '../store/providerStore.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role = 'student', services, operatingArea, university, references } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    if (!['student', 'provider'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role for self-registration' });
    }

    const existing = await findUserByEmail(email.toLowerCase());
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email: email.toLowerCase(), phone, passwordHash, role });

    if (role === 'provider') {
      // Services is now free text (not an enum), since providers can offer any
      // profession — normalize so matching stays consistent (trim, lowercase, dedupe).
      const normalizedServices = Array.isArray(services)
        ? [...new Set(services.map((s) => String(s).trim().toLowerCase()).filter(Boolean))]
        : [];
      await createProviderProfile(user.id, { services: normalizedServices, operatingArea, university, references });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await setVerificationToken(user.id, token);
    await sendVerificationEmail(user, token);

    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await findUserByEmail(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { password_hash, verification_token, reset_token, reset_token_expires, ...publicUser } = user;
    res.json({ user: publicUser, token: signToken(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });

  const user = await findUserByVerificationToken(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired verification token' });

  await setEmailVerified(user.id);
  res.json({ message: 'Email verified' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await findUserByEmail((email || '').toLowerCase());
  // Always respond 200 to avoid leaking which emails are registered.
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await setResetToken(user.id, token, expires);
    await sendPasswordResetEmail(user, token);
  }
  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password are required' });

  const user = await findUserByResetToken(token);
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

  const passwordHash = await bcrypt.hash(password, 10);
  await updatePassword(user.id, passwordHash);
  res.json({ message: 'Password updated. You can now log in.' });
});

export default router;
