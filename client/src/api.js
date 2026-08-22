// api.js — every frontend → backend call lives here.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  return localStorage.getItem('servora_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('servora_token', token);
  else localStorage.removeItem('servora_token');
}

/**
 * Core request helper. Pass a plain object as `body` for JSON, or a
 * FormData instance for file uploads (Content-Type is left for the browser to set).
 */
async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
export const authApi = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),
  verifyEmail: (token) => request('/auth/verify-email', { method: 'POST', body: { token } }),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) =>
    request('/auth/reset-password', { method: 'POST', body: { token, password } }),
};

// ---------------------------------------------------------------------
// Users / profile
// ---------------------------------------------------------------------
export const userApi = {
  updateProfile: (fields) => request('/users/me', { method: 'PATCH', body: fields }),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return request('/users/me/avatar', { method: 'POST', body: form, isFormData: true });
  },
};

// ---------------------------------------------------------------------
// Providers (provider dashboard)
// ---------------------------------------------------------------------
export const providerApi = {
  me: () => request('/providers/me'),
  updateProfile: (fields) => request('/providers/me', { method: 'PATCH', body: fields }),
  setAvailability: (isAvailable) =>
    request('/providers/me/availability', { method: 'POST', body: { isAvailable } }),
  uploadDocument: (documentType, file) => {
    const form = new FormData();
    form.append('documentType', documentType);
    form.append('document', file);
    return request('/providers/me/documents', { method: 'POST', body: form, isFormData: true });
  },
  myDocuments: () => request('/providers/me/documents'),
  myOrders: () => request('/providers/me/orders'),
  setOrderStatus: (orderId, status) =>
    request(`/providers/orders/${orderId}/status`, { method: 'POST', body: { status } }),
};

// ---------------------------------------------------------------------
// Orders (service requests)
// ---------------------------------------------------------------------
export const orderApi = {
  create: ({ serviceType, details, university, hostel, block, room, preferredTime, photo }) => {
    const form = new FormData();
    form.append('serviceType', serviceType);
    form.append('details', JSON.stringify(details || {}));
    if (university) form.append('university', university);
    if (hostel) form.append('hostel', hostel);
    if (block) form.append('block', block);
    if (room) form.append('room', room);
    if (preferredTime) form.append('preferredTime', preferredTime);
    if (photo) form.append('photo', photo);
    return request('/orders', { method: 'POST', body: form, isFormData: true });
  },
  mine: () => request('/orders/mine'),
  get: (orderId) => request(`/orders/${orderId}`),
  setPrice: (orderId, priceAmount, commissionRatePercent) =>
    request(`/orders/${orderId}/price`, { method: 'POST', body: { priceAmount, commissionRatePercent } }),
  review: (orderId, rating, comment) =>
    request(`/orders/${orderId}/review`, { method: 'POST', body: { rating, comment } }),
};

// ---------------------------------------------------------------------
// In-app messaging (per order thread)
// ---------------------------------------------------------------------
export const messageApi = {
  list: (orderId) => request(`/orders/${orderId}/messages`),
  send: (orderId, content) =>
    request(`/orders/${orderId}/messages`, { method: 'POST', body: { content } }),
};

// ---------------------------------------------------------------------
// Payments (Paystack)
// ---------------------------------------------------------------------
export const paymentApi = {
  initialize: (orderId) => request('/payments/initialize', { method: 'POST', body: { orderId } }),
  verify: (reference) => request('/payments/verify', { method: 'POST', body: { reference } }),
};

// ---------------------------------------------------------------------
// Support tickets
// ---------------------------------------------------------------------
export const supportApi = {
  create: ({ orderId, category, message }) =>
    request('/support', { method: 'POST', body: { orderId, category, message } }),
  mine: () => request('/support/mine'),
};

// ---------------------------------------------------------------------
// Admin dashboard
// ---------------------------------------------------------------------
export const adminApi = {
  overview: () => request('/admin/overview'),
  orders: (status) => request(`/admin/orders${status ? `?status=${status}` : ''}`),
  providers: (status) => request(`/admin/providers${status ? `?status=${status}` : ''}`),
  setProviderStatus: (providerId, status) =>
    request(`/admin/providers/${providerId}/status`, { method: 'POST', body: { status } }),
  providerDocuments: (providerId) => request(`/admin/providers/${providerId}/documents`),
  students: () => request('/admin/students'),
  supportTickets: () => request('/admin/support-tickets'),
  setTicketStatus: (ticketId, status) =>
    request(`/admin/support-tickets/${ticketId}/status`, { method: 'POST', body: { status } }),
};

export const healthApi = {
  check: () => request('/health'),
};
