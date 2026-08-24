import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { userApi, orderApi } from '../api';
import { UNIVERSITIES } from '../universities';

export default function Account() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [university, setUniversity] = useState(user.university || '');
  const [hostel, setHostel] = useState(user.hostel || '');
  const [block, setBlock] = useState(user.block || '');
  const [room, setRoom] = useState(user.room || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    Promise.all([orderApi.mine(), userApi.myPayments()])
      .then(([o, p]) => {
        setOrders(o.orders);
        setPayments(p.payments);
      })
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await userApi.updateProfile({ name, phone, university, hostel, block, room });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  }

  const currentOrders = orders.filter((o) => !['completed', 'cancelled', 'declined'].includes(o.status));
  const pastOrders = orders.filter((o) => ['completed', 'cancelled', 'declined'].includes(o.status));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>

          <h1 className="text-2xl font-bold mb-6">Account</h1>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Profile</h2>
            <form onSubmit={handleSave} className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">
                  Saved location — prefills your next request
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">University</label>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="">Not set</option>
                      {UNIVERSITIES.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hostel</label>
                    <input
                      value={hostel}
                      onChange={(e) => setHostel(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Block</label>
                    <input
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
                    <input
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {saved && <p className="text-sm text-brand-600">Saved.</p>}

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
            </form>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Current requests</h2>
            {loadingHistory ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : currentOrders.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing in progress right now.</p>
            ) : (
              <ul className="space-y-2">
                {currentOrders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </ul>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Previous requests</h2>
            {loadingHistory ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : pastOrders.length === 0 ? (
              <p className="text-sm text-gray-400">No past requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {pastOrders.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">Payments</h2>
            {loadingHistory ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-gray-400">No payments yet.</p>
            ) : (
              <ul className="space-y-2">
                {payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
                  >
                    <div>
                      <span className="capitalize font-medium">{p.service_type}</span>
                      <span className="text-gray-400"> · {p.hostel}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">GH₵{Number(p.amount).toFixed(2)}</p>
                      <p className="text-xs text-gray-400 capitalize">{p.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function OrderRow({ order }) {
  return (
    <li>
      <Link
        to={`/orders/${order.id}`}
        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm hover:border-brand-400 transition"
      >
        <span className="capitalize font-medium">{order.service_type}</span>
        <span className="text-gray-500 capitalize">{order.status.replace('_', ' ')}</span>
      </Link>
    </li>
  );
}
