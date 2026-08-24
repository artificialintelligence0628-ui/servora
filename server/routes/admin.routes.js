import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listProviders, setProviderStatus, findProviderById } from '../store/providerStore.js';
import { listAllOrders, getRevenueSummary, getOrdersByUniversity } from '../store/orderStore.js';
import { listUsersByRole } from '../store/userStore.js';
import { listDocumentsForProvider } from '../store/documentStore.js';
import { query } from '../db.js';
import { notifyUser } from '../utils/push.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

router.get('/overview', async (req, res) => {
  const [revenue, orders, providers, students, ordersByUniversity] = await Promise.all([
    getRevenueSummary(),
    listAllOrders(),
    listProviders(),
    listUsersByRole('student'),
    getOrdersByUniversity(),
  ]);
  res.json({
    revenue,
    orderCount: orders.length,
    providerCount: providers.length,
    studentCount: students.length,
    ordersByUniversity,
  });
});

router.get('/orders', async (req, res) => {
  const orders = await listAllOrders({ status: req.query.status });
  res.json({ orders });
});

router.get('/providers', async (req, res) => {
  const providers = await listProviders({ status: req.query.status });
  res.json({ providers });
});

router.post('/providers/:providerId/status', async (req, res) => {
  const { status } = req.body; // pending | verified | suspended
  if (!['pending', 'verified', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const provider = await setProviderStatus(req.params.providerId, status);
  res.json({ provider });
});

// Full profile + every uploaded document, for review before approval.
router.get('/providers/:providerId/documents', async (req, res) => {
  const provider = await findProviderById(req.params.providerId);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  const documents = await listDocumentsForProvider(provider.id);
  res.json({ documents });
});

router.get('/students', async (req, res) => {
  const students = await listUsersByRole('student');
  res.json({ students });
});

router.get('/support-tickets', async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM support_tickets ORDER BY created_at DESC`
  );
  res.json({ tickets: rows });
});

router.post('/support-tickets/:ticketId/status', async (req, res) => {
  const { status } = req.body; // open | in_review | resolved
  if (!['open', 'in_review', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const { rows } = await query(
    `UPDATE support_tickets SET status = $2 WHERE id = $1 RETURNING *`,
    [req.params.ticketId, status]
  );
  const ticket = rows[0];
  if (ticket) {
    notifyUser(ticket.user_id, {
      title: 'Support ticket update',
      body: `Your support ticket is now: ${status.replace('_', ' ')}`,
      url: '/account',
    }).catch(() => {});
  }
  res.json({ ticket });
});

export default router;
