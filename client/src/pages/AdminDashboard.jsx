import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Eye, CircleCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { adminApi, orderApi } from '../api';

const STATUS_STYLES = {
  verified: 'bg-brand-100 text-brand-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

const TICKET_STATUS_STYLES = {
  open: 'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  resolved: 'bg-brand-100 text-brand-700',
};

const TICKET_CATEGORY_LABELS = {
  provider_no_show: 'Provider didn\u2019t arrive',
  wrong_order: 'Wrong order',
  damaged_items: 'Damaged clothes/items',
  poor_repair: 'Poor repair quality',
  payment_problem: 'Payment problem',
  refund_issue: 'Refund issue',
  other: 'Something else',
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [unpricedOrders, setUnpricedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);

  function loadOverview() {
    adminApi.overview().then(setOverview).catch(() => setOverview(null));
  }

  function loadProviders() {
    setLoadingProviders(true);
    adminApi
      .providers()
      .then((d) => setProviders(d.providers))
      .catch(() => setProviders([]))
      .finally(() => setLoadingProviders(false));
  }

  function loadOrders() {
    setLoadingOrders(true);
    adminApi
      .orders()
      .then((d) =>
        setUnpricedOrders(
          d.orders.filter(
            (o) => !o.price_amount && !['declined', 'cancelled'].includes(o.status)
          )
        )
      )
      .catch(() => setUnpricedOrders([]))
      .finally(() => setLoadingOrders(false));
  }

  function loadTickets() {
    setLoadingTickets(true);
    adminApi
      .supportTickets()
      .then((d) => setTickets(d.tickets))
      .catch(() => setTickets([]))
      .finally(() => setLoadingTickets(false));
  }

  useEffect(() => {
    loadOverview();
    loadProviders();
    loadOrders();
    loadTickets();
  }, []);

  async function handleStatusChange(providerId, status) {
    setUpdatingId(providerId);
    try {
      await adminApi.setProviderStatus(providerId, status);
      loadProviders();
      loadOverview();
    } catch (err) {
      alert(err.message || 'Could not update provider status');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleTicketStatusChange(ticketId, status) {
    setUpdatingTicketId(ticketId);
    try {
      await adminApi.setTicketStatus(ticketId, status);
      loadTickets();
    } catch (err) {
      alert(err.message || 'Could not update ticket status');
    } finally {
      setUpdatingTicketId(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Admin overview</h1>

        {!overview ? (
          <p className="text-sm text-gray-400 mb-10">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            <Stat label="Orders" value={overview.orderCount} />
            <Stat label="Providers" value={overview.providerCount} />
            <Stat label="Students" value={overview.studentCount} />
            <Stat label="Commission (GH₵)" value={overview.revenue?.total_commission ?? 0} />
          </div>
        )}

        <h2 className="text-lg font-semibold mb-3">Orders needing a price</h2>
        {loadingOrders ? (
          <p className="text-sm text-gray-400 mb-10">Loading…</p>
        ) : unpricedOrders.length === 0 ? (
          <p className="text-sm text-gray-400 mb-10">Nothing waiting on a price right now.</p>
        ) : (
          <ul className="space-y-2 mb-10">
            {unpricedOrders.map((o) => (
              <PricingRow key={o.id} order={o} onPriced={loadOrders} />
            ))}
          </ul>
        )}

        <h2 className="text-lg font-semibold mb-3">Providers</h2>
        {loadingProviders ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : providers.length === 0 ? (
          <p className="text-sm text-gray-400">No providers have registered yet.</p>
        ) : (
          <ul className="space-y-2">
            {providers.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{p.name}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLES[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {p.email} · {p.services?.join(', ') || 'no services set'} ·{' '}
                    {p.operating_area || 'no area set'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {p.status !== 'verified' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'verified')}
                      disabled={updatingId === p.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                    </button>
                  )}
                  {p.status !== 'suspended' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'suspended')}
                      disabled={updatingId === p.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Suspend
                    </button>
                  )}
                  {p.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange(p.id, 'pending')}
                      disabled={updatingId === p.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <Clock className="w-3.5 h-3.5" /> Set pending
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <h2 className="text-lg font-semibold mb-3 mt-10">Support tickets</h2>
        {loadingTickets ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-gray-400">No support tickets have been filed.</p>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">
                    {TICKET_CATEGORY_LABELS[t.category] || t.category}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TICKET_STATUS_STYLES[t.status]}`}
                  >
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{t.message}</p>
                <div className="flex items-center gap-2">
                  {t.status !== 'in_review' && (
                    <button
                      onClick={() => handleTicketStatusChange(t.id, 'in_review')}
                      disabled={updatingTicketId === t.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <Eye className="w-3.5 h-3.5" /> Mark in review
                    </button>
                  )}
                  {t.status !== 'resolved' && (
                    <button
                      onClick={() => handleTicketStatusChange(t.id, 'resolved')}
                      disabled={updatingTicketId === t.id}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg disabled:opacity-60"
                    >
                      <CircleCheck className="w-3.5 h-3.5" /> Mark resolved
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function PricingRow({ order, onPriced }) {
  const [price, setPrice] = useState('');
  const [commission, setCommission] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  async function handleSetPrice(e) {
    e.preventDefault();
    if (!price || Number(price) <= 0) return;
    setSubmitting(true);
    try {
      await orderApi.setPrice(order.id, Number(price), Number(commission));
      onPriced();
    } catch (err) {
      alert(err.message || 'Could not set price');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <li className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="capitalize font-medium text-sm">{order.service_type}</span>
        <span className="text-xs text-gray-500 capitalize">{order.status.replace('_', ' ')}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        {order.hostel}
        {order.block ? `, Block ${order.block}` : ''}
        {order.room ? `, Room ${order.room}` : ''}
      </p>
      <form onSubmit={handleSetPrice} className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          step="0.01"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price (GH₵)"
          className="w-32 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <input
          type="number"
          min="0"
          max="100"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          placeholder="Commission %"
          className="w-28 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-60 px-3 py-1.5 rounded-lg transition"
        >
          Set price
        </button>
      </form>
    </li>
  );
}
