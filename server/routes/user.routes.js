import { Router } from 'express';
import { updateProfile } from '../store/userStore.js';
import { requireAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadBuffer } from '../utils/cloudinary.js';
import { query } from '../db.js';

const router = Router();

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const updated = await updateProfile(req.user.id, req.body);
    res.json({ user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update profile' });
  }
});

router.post('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'avatar file is required' });
    const { url } = await uploadBuffer(req.file.buffer, { folder: 'servora/avatars' });
    const updated = await updateProfile(req.user.id, { avatar_url: url });
    res.json({ user: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Avatar upload failed' });
  }
});

// Payment history for the account page — every payment tied to this user's orders.
router.get('/me/payments', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT pay.id, pay.amount, pay.status, pay.created_at,
            o.id AS order_id, o.service_type, o.hostel
     FROM payments pay
     JOIN orders o ON o.id = pay.order_id
     WHERE o.student_id = $1
     ORDER BY pay.created_at DESC`,
    [req.user.id]
  );
  res.json({ payments: rows });
});

export default router;
