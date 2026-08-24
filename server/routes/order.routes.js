import { Router } from 'express';
import {
  createOrder, findOrderById, listOrdersForStudent, assignProvider, setPricing,
} from '../store/orderStore.js';
import { findAvailableProviders, findProviderById, findProviderByUserId, recordRating } from '../store/providerStore.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadBuffer } from '../utils/cloudinary.js';
import { query } from '../db.js';
import { notifyUser } from '../utils/push.js';
import { canAccessOrder } from '../utils/orderAccess.js';

const router = Router();

// ---- Create a request (student). Photo upload is optional (used by Repairs). ----
router.post('/', requireAuth, requireRole('student'), upload.single('photo'), async (req, res) => {
  try {
    const {
      serviceType, details, university, hostel, block, room, preferredTime, preferredProviderId, durationDays,
    } = req.body;
    if (!serviceType) return res.status(400).json({ error: 'serviceType is required' });

    let parsedDetails = {};
    try {
      parsedDetails = details ? JSON.parse(details) : {};
    } catch {
      parsedDetails = {};
    }

    if (req.file) {
      try {
        const { url } = await uploadBuffer(req.file.buffer, { folder: 'servora/orders' });
        parsedDetails.photoUrl = url;
      } catch (uploadErr) {
        // Don't let a missing/misconfigured Cloudinary block the whole request —
        // the photo is optional, so log it and continue without one.
        console.warn('[orders] Photo upload failed, continuing without photo:', uploadErr.message);
      }
    }

    const order = await createOrder({
      studentId: req.user.id,
      serviceType,
      details: parsedDetails,
      university, hostel, block, room,
      preferredTime: preferredTime || null,
      durationDays: durationDays ? Number(durationDays) : null,
    });

    // If the student picked a specific provider off the Browse page, honor that
    // instead of auto-matching — but only if that provider is actually valid
    // for this request (verified, available, offers this service).
    let matchedProvider = null;
    if (preferredProviderId) {
      const preferred = await findProviderById(preferredProviderId);
      const offersService =
        preferred?.services?.some((s) => s.toLowerCase() === serviceType.toLowerCase()) ?? false;
      if (preferred && preferred.status === 'verified' && preferred.is_available && offersService) {
        matchedProvider = preferred;
      }
    }

    if (!matchedProvider) {
      // Attempt an immediate match against available providers in the area.
      // Match on the broader university/campus area first, since providers typically
      // register a wide operating area (e.g. a whole university) rather than a single
      // hostel — matching against the narrower hostel text would rarely find them.
      const candidates = await findAvailableProviders({ serviceType, operatingArea: university || hostel });
      if (candidates.length > 0) matchedProvider = candidates[0];
    }

    if (matchedProvider) {
      await assignProvider(order.id, matchedProvider.id);
      notifyUser(matchedProvider.user_id, {
        title: 'New Servora request',
        body: `${serviceType} at ${hostel || university || 'your area'}`,
        url: '/provider',
      }).catch(() => {}); // never let a push failure break order creation
    }

    const fresh = await findOrderById(order.id);
    res.status(201).json({ order: fresh, matched: Boolean(matchedProvider) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create request' });
  }
});

// ---- Track / list own requests (student) ----
router.get('/mine', requireAuth, requireRole('student'), async (req, res) => {
  const orders = await listOrdersForStudent(req.user.id);
  res.json({ orders });
});

router.get('/:orderId', requireAuth, async (req, res) => {
  const order = await findOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const allowed = await canAccessOrder(req.user, order);
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });
  res.json({ order });
});

// ---- Student cancels their own request, while it's still early enough to cancel ----
router.post('/:orderId/cancel', requireAuth, requireRole('student'), async (req, res) => {
  const order = await findOrderById(req.params.orderId);
  if (!order || order.student_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });

  const cancellable = ['requested', 'assigned', 'accepted', 'on_the_way'];
  if (!cancellable.includes(order.status)) {
    return res.status(400).json({ error: `Can't cancel a request that's already ${order.status}` });
  }

  const updated = await setOrderStatus(order.id, 'cancelled');
  res.json({ order: updated });
});

// ---- In-app messaging, scoped to the student/provider/admin on this order ----
router.get('/:orderId/messages', requireAuth, async (req, res) => {
  const order = await findOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const allowed = await canAccessOrder(req.user, order);
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });

  const { rows } = await query(
    `SELECT m.*, u.name AS sender_name, u.role AS sender_role
     FROM messages m JOIN users u ON u.id = m.sender_id
     WHERE m.order_id = $1
     ORDER BY m.created_at ASC`,
    [order.id]
  );
  res.json({ messages: rows });
});

router.post('/:orderId/messages', requireAuth, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' });

  const order = await findOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const allowed = await canAccessOrder(req.user, order);
  if (!allowed) return res.status(403).json({ error: 'Forbidden' });

  const { rows } = await query(
    `INSERT INTO messages (order_id, sender_id, content) VALUES ($1, $2, $3)
     RETURNING id, order_id, sender_id, content, created_at`,
    [order.id, req.user.id, content.trim()]
  );
  res.status(201).json({
    message: { ...rows[0], sender_name: req.user.name, sender_role: req.user.role },
  });

  // Notify whoever didn't send this message — student or the assigned provider.
  let recipientUserId = null;
  if (req.user.id === order.student_id && order.provider_id) {
    const provider = await findProviderById(order.provider_id);
    recipientUserId = provider?.user_id;
  } else if (req.user.id !== order.student_id) {
    recipientUserId = order.student_id;
  }
  if (recipientUserId) {
    notifyUser(recipientUserId, {
      title: `New message from ${req.user.name}`,
      body: content.trim().slice(0, 100),
      url: `/orders/${order.id}`,
    }).catch(() => {});
  }
});

// ---- Set pricing. Providers quote their own job using their own commission
// rate (can't be overridden client-side); admins can set/override any price. ----
router.post('/:orderId/price', requireAuth, requireRole('admin', 'provider'), async (req, res) => {
  const { priceAmount } = req.body;
  if (!priceAmount || priceAmount <= 0) return res.status(400).json({ error: 'priceAmount is required' });

  const order = await findOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  let commissionRatePercent;

  if (req.user.role === 'provider') {
    const provider = await findProviderByUserId(req.user.id);
    if (!provider || order.provider_id !== provider.id) {
      return res.status(403).json({ error: 'You are not assigned to this order' });
    }
    // Providers use their own agreed commission rate — not client-supplied, to prevent tampering.
    commissionRatePercent = Number(provider.commission_rate);
  } else {
    // Admin can specify a rate, defaulting to 10% if not given.
    commissionRatePercent = req.body.commissionRatePercent ?? 10;
  }

  const commissionAmount = Number((priceAmount * (commissionRatePercent / 100)).toFixed(2));
  const providerPayout = Number((priceAmount - commissionAmount).toFixed(2));

  const updated = await setPricing(req.params.orderId, { priceAmount, commissionAmount, providerPayout });
  res.json({ order: updated });
});

// ---- Review a completed order (student) ----
router.post('/:orderId/review', requireAuth, requireRole('student'), async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'rating must be 1-5' });

  const order = await findOrderById(req.params.orderId);
  if (!order || order.student_id !== req.user.id) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'completed') return res.status(400).json({ error: 'Order is not completed yet' });
  if (!order.provider_id) return res.status(400).json({ error: 'Order has no provider to review' });

  const { rows } = await query(
    `INSERT INTO reviews (order_id, provider_id, student_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (order_id) DO NOTHING
     RETURNING id`,
    [order.id, order.provider_id, req.user.id, rating, comment ?? null]
  );

  // ON CONFLICT means this order was already reviewed — don't double-count the rating.
  if (rows.length === 0) {
    return res.status(409).json({ error: 'This order has already been reviewed' });
  }

  const provider = await recordRating(order.provider_id, rating);
  res.status(201).json({ provider });
});

export default router;
