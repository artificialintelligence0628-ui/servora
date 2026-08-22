// utils/paystack.js
// Server-side only. The public key lives on the client (VITE_PAYSTACK_PUBLIC_KEY);
// the secret key never leaves this file.
import 'dotenv/config';

const PAYSTACK_BASE = 'https://api.paystack.co';

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
}

/** Initialize a transaction server-side (optional alternative to inline popup). */
export async function initializeTransaction({ email, amountKobo, reference, metadata }) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, amount: amountKobo, reference, metadata }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Paystack initialize failed');
  return data.data;
}

/** Verify a transaction reference after the client-side popup completes. */
export async function verifyTransaction(reference) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Paystack verify failed');
  return data.data; // { status: 'success' | 'failed' | ..., amount, reference, ... }
}
