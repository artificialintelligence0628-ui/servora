import { Router } from 'express';
import {
  findProviderByUserId, setAvailability, updateProviderProfile,
} from '../store/providerStore.js';
import { listOrdersForProvider, setOrderStatus } from '../store/orderStore.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { uploadBuffer } from '../utils/cloudinary.js';

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

router.post('/me/id-document', upload.single('document'), async (req, res) => {
  const provider = await currentProvider(req, res);
  if (!provider) return;
  if (!req.file) return res.status(400).json({ error: 'document file is required' });
  const { url } = await uploadBuffer(req.file.buffer, { folder: 'servora/verification' });
  const updated = await updateProviderProfile(provider.id, { id_document_url: url });
  res.json({ provider: updated });
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
  const { status } = req.body; // accepted | declined | on_the_way | in_progress | completed
  const allowed = ['accepted', 'declined', 'on_the_way', 'in_progress', 'completed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const updated = await setOrderStatus(req.params.orderId, status);
  res.json({ order: updated });
});

export default router;
