import { Router } from 'express';
import {
  findProviderByUserId, setAvailability, updateProviderProfile, findAvailableProviders,
} from '../store/providerStore.js';
import {
  listOrdersForProvider, setOrderStatus, findOrderById, assignProvider, unassignProvider,
} from '../store/orderStore.js';
import { addDocument, listDocumentsForProvider } from '../store/documentStore.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadBuffer } from '../utils/cloudinary.js';

const DOCUMENT_TYPES = ['id', 'cv', 'certificate', 'other'];

const router = Router();
router.use(requireAuth, requireRole('provider'));

async function currentProvider(req, res) {
  const provider = await findProviderByUserId(req.user.id);
  if (!provider) {
    res.status(404).json({ error: 'Provider profile not found' });
    return null;
  }
  return provider;
}

router.get('/me', async (req, res) => {
  const provider = await currentProvider(req, res);
  if (provider) res.json({ provider });
});

router.patch('/me', async (req, res) => {
  const provider = await currentProvider(req, res);
  if (!provider) return;
  const updated = await updateProviderProfile(provider.id, req.body);
  res.json({ provider: updated });
});

router.post('/me/availability', async (req, res) => {
  const provider = await currentProvider(req, res);
  if (!provider) return;
  const updated = await setAvailability(provider.id, Boolean(req.body.isAvailable));
  res.json({ provider: updated });
});

// Providers can upload several documents (ID, CV, certificates, etc.) rather
// than a single generic one — matches how real onboarding actually works.
router.post('/me/documents', upload.single('document'), async (req, res) => {
  const provider = await currentProvider(req, res);
  if (!provider) return;
  if (!req.file) return res.status(400).json({ error: 'document file is required' });

  const documentType = DOCUMENT_TYPES.includes(req.body.documentType) ? req.body.documentType : 'other';
  const { url } = await uploadBuffer(req.file.buffer, { folder: 'servora/documents' });
  const document = await addDocument(provider.id, documentType, url);
  res.status(201).json({ document });
});

router.get('/me/documents', async (req, res) => {
  const provider = await currentProvider(req, res);
  if (!provider) return;
  const documents = await listDocumentsForProvider(provider.id);
  res.json({ documents });
});

router.get('/me/orders', async (req, res) => {
  const provider = await currentProvider(req, res);
  if (!provider) return;
  const orders = await listOrdersForProvider(provider.id);
  res.json({ orders });
});

// Accept / decline / update the status of an assigned order.
router.post('/orders/:orderId/status', async (req, res) => {
  const provider = await currentProvider(req, res);
  if (!provider) return;

  const order = await findOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.provider_id !== provider.id) {
    return res.status(403).json({ error: 'You are not assigned to this order' });
  }

  const { status } = req.body; // accepted | declined | on_the_way | in_progress | completed
  const allowed = ['accepted', 'declined', 'on_the_way', 'in_progress', 'completed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  if (status === 'declined') {
    // Try to re-match to another available provider (excluding this one) rather
    // than leaving the student's request dead with no one working on it.
    const candidates = await findAvailableProviders({
      serviceType: order.service_type,
      operatingArea: order.university || order.hostel,
      excludeProviderId: provider.id,
    });
    const updated =
      candidates.length > 0
        ? await assignProvider(order.id, candidates[0].id)
        : await unassignProvider(order.id);
    return res.json({ order: updated, rematched: candidates.length > 0 });
  }

  const updated = await setOrderStatus(req.params.orderId, status);
  res.json({ order: updated });
});

export default router;
