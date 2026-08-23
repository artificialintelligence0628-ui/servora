import { Router } from 'express';
import { listPublicProviders } from '../store/providerStore.js';

const router = Router();

// Public browse — deliberately no auth, no contact info returned.
// Requesting a specific provider still requires logging in (see order.routes.js).
router.get('/professionals', async (req, res) => {
  const { service, university } = req.query;
  const providers = await listPublicProviders({ service, university });
  res.json({ providers });
});

export default router;
