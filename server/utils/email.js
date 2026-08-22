// utils/email.js
import { Resend } from 'resend';
import 'dotenv/config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || 'Servora <no-reply@servora.app>';

async function send({ to, subject, html }) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set — skipping send. Would have sent:', { to, subject });
    return { skipped: true };
  }
  return resend.emails.send({ from: FROM, to, subject, html });
}

export function sendVerificationEmail(user, token) {
  const link = `${process.env.CLIENT_ORIGIN}/verify-email?token=${token}`;
  return send({
    to: user.email,
    subject: 'Verify your Servora account',
    html: `
      <p>Hi ${user.name},</p>
      <p>Welcome to Servora. Confirm your email to start requesting services:</p>
      <p><a href="${link}">Verify my email</a></p>
      <p>If you didn't sign up, you can ignore this email.</p>
    `,
  });
}

export function sendPasswordResetEmail(user, token) {
  const link = `${process.env.CLIENT_ORIGIN}/reset-password?token=${token}`;
  return send({
    to: user.email,
    subject: 'Reset your Servora password',
    html: `
      <p>Hi ${user.name},</p>
      <p>Use the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${link}">Reset my password</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
    `,
  });
}

export function sendOrderStatusEmail(user, order) {
  return send({
    to: user.email,
    subject: `Servora order update — ${order.service_type}`,
    html: `
      <p>Hi ${user.name},</p>
      <p>Your ${order.service_type} request is now: <strong>${order.status.replace('_', ' ')}</strong>.</p>
    `,
  });
}
