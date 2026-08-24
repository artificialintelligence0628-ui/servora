// socket.js — WebRTC signaling relay for voice calls, scoped per order.
// This server never touches audio itself — it only relays the small
// handshake messages (offer/answer/ICE candidates) so two browsers can
// establish a direct peer-to-peer audio connection.
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { findUserById } from './store/userStore.js';
import { findOrderById } from './store/orderStore.js';
import { canAccessOrder } from './utils/orderAccess.js';

export function attachSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, {
    cors: { origin: corsOrigin || true, credentials: true },
  });

  // Auth on connection, same JWT used everywhere else in the app.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing auth token'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await findUserById(payload.sub);
      if (!user) return next(new Error('User no longer exists'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Join the room for a specific order — only if this user actually has
    // access to it (same rule as the HTTP order routes).
    socket.on('call:join', async (orderId, ack) => {
      try {
        const order = await findOrderById(orderId);
        if (!order) return ack?.({ error: 'Order not found' });
        const allowed = await canAccessOrder(socket.user, order);
        if (!allowed) return ack?.({ error: 'Forbidden' });
        socket.join(`order:${orderId}`);
        ack?.({ ok: true });
      } catch {
        ack?.({ error: 'Could not join call' });
      }
    });

    // Relay signaling messages to the other participant in the room.
    socket.on('call:offer', ({ orderId, offer }) => {
      socket.to(`order:${orderId}`).emit('call:offer', { offer, fromName: socket.user.name });
    });

    socket.on('call:answer', ({ orderId, answer }) => {
      socket.to(`order:${orderId}`).emit('call:answer', { answer });
    });

    socket.on('call:ice-candidate', ({ orderId, candidate }) => {
      socket.to(`order:${orderId}`).emit('call:ice-candidate', { candidate });
    });

    socket.on('call:end', ({ orderId }) => {
      socket.to(`order:${orderId}`).emit('call:end');
    });
  });

  return io;
}
