import { Router } from 'express';
import {
  createOrder, findOrderById, listOrdersForStudent, assignProvider, setPricing,
} from '../store/orderStore.js';
import { findAvailableProviders, findProviderById, findProviderByUserId, recordRating } from '../store/providerStore.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadBuffer } from '../utils/cloudinary.js';
import { query } from '../db.js';

const router = Router();

// ---- Create a request (student). Photo upload is optional (used by Repairs). ----
router.post('/', requireAuth, requireRole('student'), upload.single('photo'), async (req, res) => {
  try {
    const { serviceType, details, university, hostel, block, room, preferredTime } = req.body;
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
    });

    // Attempt an immediate match against available providers in the area.
    // Match on the broader university/campus area first, since providers typically
    // register a wide operating area (e.g. a whole university) rather than a single
    // hostel — matching against the narrower hostel text would rarely find them.
    const candidates = await findAvailableProviders({ serviceType, operatingArea: university || hostel });
    if (candidates.length > 0) {
      await assignProvider(order.id, candidates[0].id);
    }

    const fresh = await findOrderById(order.id);
    res.status(201).json({ order: fresh, matched: candidates.length > 0 });
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

  const isOwner = order.student_id === req.user.id;
  const isAdmin = req.user.role === 'admin';
  const provider = order.provider_id ? await findProviderById(order.provider_id) : null;
  const isAssignedProvider = provider && provider.user_id === req.user.id;

  if (!isOwner && !isAdmin && !isAssignedProvider) return res.status(403).json({ error: 'Forbidden' });
  res.json({ order });
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

  await query(
    `INSERT INTO reviews (order_id, provider_id, student_id, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (order_id) DO NOTHING`,
    [order.id, order.provider_id, req.user.id, rating, comment ?? null]
  );
  const provider = await recordRating(order.provider_id, rating);
  res.status(201).json({ provider });
});

export default router;
