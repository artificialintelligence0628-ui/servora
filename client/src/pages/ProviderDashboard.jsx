import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { providerApi } from '../api';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    Promise.all([providerApi.me(), providerApi.myOrders()])
      .then(([p, o]) => {
        setProvider(p.provider);
        setOrders(o.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleAvailability() {
    if (!provider) return;
    setToggling(true);
    try {
      const { provider: updated } = await providerApi.setAvailability(!provider.is_available);
      setProvider(updated);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-gray-400">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hi, {user.name.split(' ')[0]} 👋</h1>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
              provider.status === 'verified'
                ? 'bg-brand-100 text-brand-700'
                : provider.status === 'pending'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {provider.status}
          </span>
        </div>
        <p className="text-gray-500 mb-6 text-sm capitalize">
          Services: {provider.services?.join(', ') || 'none set'} · {provider.operating_area || 'no area set'}
        </p>

        {provider.status === 'pending' && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your account is awaiting verification. An admin will review your details before you
            start receiving requests.
          </div>
        )}

        <button
          onClick={toggleAvailability}
          disabled={toggling}
          className={`mb-8 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
            provider.is_available
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {provider.is_available ? 'Available for new requests' : 'Currently offline'}
        </button>

        <h2 className="text-lg font-semibold mb-3">Assigned requests</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">No requests assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <span className="capitalize font-medium">{o.service_type}</span>
                <span className="text-gray-500 capitalize">{o.status.replace('_', ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
