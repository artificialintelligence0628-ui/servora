import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db.js';

const router = Router();

const CATEGORIES = [
  'provider_no_show', 'wrong_order', 'damaged_items',
  'poor_repair', 'payment_problem', 'refund_issue', 'other',
];

router.post('/', requireAuth, async (req, res) => {
  const { orderId, category, message } = req.body;
  if (!category || !message) return res.status(400).json({ error: 'category and message are required' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  const { rows } = await query(
    `INSERT INTO support_tickets (order_id, user_id, category, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [orderId ?? null, req.user.id, category, message]
  );
  res.status(201).json({ ticket: rows[0] });
});

router.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json({ tickets: rows });
});

export default router;
