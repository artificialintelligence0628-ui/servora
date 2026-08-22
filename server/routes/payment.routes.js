import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { findOrderById, setOrderStatus } from '../store/orderStore.js';
import { initializeTransaction, verifyTransaction } from '../utils/paystack.js';
import { query } from '../db.js';

const router = Router();

// Student initializes payment for a priced order.
router.post('/initialize', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await findOrderById(orderId);
    if (!order || order.student_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
    if (!order.price_amount) return res.status(400).json({ error: 'Order has not been priced yet' });

    const reference = `servora_${order.id}_${Date.now()}`;
    const data = await initializeTransaction({
      email: req.user.email,
      amountKobo: Math.round(Number(order.price_amount) * 100),
      reference,
      metadata: { orderId: order.id },
    });

    await query(
      `INSERT INTO payments (order_id, paystack_reference, amount, status)
       VALUES ($1, $2, $3, 'pending')`,
      [order.id, reference, order.price_amount]
    );

    res.json({ authorizationUrl: data.authorization_url, reference });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not initialize payment' });
  }
});

// Called after the Paystack popup/redirect completes, to confirm server-side.
router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'reference is required' });

    const result = await verifyTransaction(reference);
    const status = result.status === 'success' ? 'paid' : 'failed';

    const { rows } = await query(
      `UPDATE payments SET status = $2, raw_response = $3 WHERE paystack_reference = $1 RETURNING *`,
      [reference, status, result]
    );
    const payment = rows[0];
    if (payment && status === 'paid') {
      await setOrderStatus(payment.order_id, 'in_progress');
    }

    res.json({ status, payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not verify payment' });
  }
});

// Paystack webhook (recommended alongside client-side verify for reliability).
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const expected = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (signature !== expected) return res.status(401).send('Invalid signature');

    const event = req.body;
    if (event.event === 'charge.success') {
      const reference = event.data.reference;
      const { rows } = await query(
        `UPDATE payments SET status = 'paid', raw_response = $2 WHERE paystack_reference = $1 RETURNING *`,
        [reference, event.data]
      );
      if (rows[0]) await setOrderStatus(rows[0].order_id, 'in_progress');
    }
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

export default router;
