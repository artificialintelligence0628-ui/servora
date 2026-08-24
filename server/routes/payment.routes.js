import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { findOrderById, setOrderStatus } from '../store/orderStore.js';
import { initializeTransaction, verifyTransaction, refundTransaction } from '../utils/paystack.js';
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
      amountPesewas: Math.round(Number(order.price_amount) * 100),
      reference,
      metadata: { orderId: order.id },
      callbackUrl: `${process.env.CLIENT_ORIGIN}/payment/callback`,
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

// ---- Admin: list all payments, for the account/admin payments views ----
router.get('/', requireAuth, requireRole('admin'), async (req, res) => {
  const { rows } = await query(
    `SELECT pay.*, o.service_type, o.hostel, o.student_id
     FROM payments pay
     JOIN orders o ON o.id = pay.order_id
     ORDER BY pay.created_at DESC`
  );
  res.json({ payments: rows });
});

// ---- Admin: refund a payment (full or partial) ----
router.post('/:paymentId/refund', requireAuth, requireRole('admin'), async (req, res) => {
  const { amount } = req.body; // optional partial refund amount in GHS
  const { rows: paymentRows } = await query(`SELECT * FROM payments WHERE id = $1`, [req.params.paymentId]);
  const payment = paymentRows[0];
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'paid') {
    return res.status(400).json({ error: `Can't refund a payment that's ${payment.status}` });
  }

  const amountPesewas = amount ? Math.round(Number(amount) * 100) : undefined;
  await refundTransaction(payment.paystack_reference, amountPesewas);

  const { rows: updated } = await query(
    `UPDATE payments SET status = 'refunded' WHERE id = $1 RETURNING *`,
    [payment.id]
  );
  res.json({ payment: updated[0] });
});

export default router;
