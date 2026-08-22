// store/orderStore.js — all SQL related to orders (service requests).
import { query } from '../db.js';

export async function createOrder({
  studentId, serviceType, details, university, hostel, block, room, preferredTime,
}) {
  const { rows } = await query(
    `INSERT INTO orders (student_id, service_type, details, university, hostel, block, room, preferred_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [studentId, serviceType, details ?? {}, university ?? null, hostel ?? null, block ?? null, room ?? null, preferredTime ?? null]
  );
  return rows[0];
}

export async function assignProvider(orderId, providerId) {
  const { rows } = await query(
    `UPDATE orders SET provider_id = $2, status = 'assigned', updated_at = now() WHERE id = $1 RETURNING *`,
    [orderId, providerId]
  );
  return rows[0];
}

export async function setOrderStatus(orderId, status) {
  const { rows } = await query(
    `UPDATE orders SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
    [orderId, status]
  );
  return rows[0];
}

export async function setPricing(orderId, { priceAmount, commissionAmount, providerPayout }) {
  const { rows } = await query(
    `UPDATE orders
     SET price_amount = $2, commission_amount = $3, provider_payout = $4, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [orderId, priceAmount, commissionAmount, providerPayout]
  );
  return rows[0];
}

export async function findOrderById(orderId) {
  const { rows } = await query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  return rows[0] ?? null;
}

export async function listOrdersForStudent(studentId) {
  const { rows } = await query(
    `SELECT * FROM orders WHERE student_id = $1 ORDER BY created_at DESC`,
    [studentId]
  );
  return rows;
}

export async function listOrdersForProvider(providerId) {
  const { rows } = await query(
    `SELECT * FROM orders WHERE provider_id = $1 ORDER BY created_at DESC`,
    [providerId]
  );
  return rows;
}

export async function listAllOrders({ status } = {}) {
  const { rows } = await query(
    `SELECT * FROM orders WHERE ($1::order_status IS NULL OR status = $1) ORDER BY created_at DESC`,
    [status ?? null]
  );
  return rows;
}

export async function getRevenueSummary() {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
       COALESCE(SUM(price_amount) FILTER (WHERE status = 'completed'), 0) AS total_order_value,
       COALESCE(SUM(commission_amount) FILTER (WHERE status = 'completed'), 0) AS total_commission,
       COALESCE(SUM(provider_payout) FILTER (WHERE status = 'completed'), 0) AS total_provider_earnings
     FROM orders`
  );
  return rows[0];
}
