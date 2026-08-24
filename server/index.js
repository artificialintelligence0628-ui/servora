import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
// Patches Express so errors thrown inside async route handlers are caught and
// turned into a normal JSON error response, instead of crashing the whole
// server process (Express 4 doesn't catch async errors on its own).
import 'express-async-errors';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import providerRoutes from './routes/provider.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import supportRoutes from './routes/support.routes.js';
import publicRoutes from './routes/public.routes.js';
import pushRoutes from './routes/push.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ---- API routes ----
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/push', pushRoutes);

// ---- Serve the built React client (single Render web service) ----
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servora API listening on port ${PORT}`);
});

// Last-resort safety net: log anything that somehow still slips through
// (e.g. errors outside a request, like a bad startup query) instead of the
// process dying with no explanation.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandled rejection]', reason);
});
