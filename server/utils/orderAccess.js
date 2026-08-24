// utils/orderAccess.js — shared ownership check: the student who placed an
// order, the provider assigned to it, or any admin. Used by order routes,
// messaging, and voice-call socket auth, so the rule is defined once.
import { findProviderById } from '../store/providerStore.js';

export async function canAccessOrder(user, order) {
  if (order.student_id === user.id) return true;
  if (user.role === 'admin') return true;
  if (order.provider_id) {
    const provider = await findProviderById(order.provider_id);
    if (provider && provider.user_id === user.id) return true;
  }
  return false;
}
