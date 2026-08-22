import { useEffect, useState } from 'react';
import { Droplets, Shirt, Flame, Wrench } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../api';

const SERVICE_ICONS = { water: Droplets, laundry: Shirt, gas: Flame, repairs: Wrench };

export default function StudentDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .mine()
      .then((d) => setOrders(d.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-1">Hi, {user.name.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mb-8 text-sm">What do you need today?</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {Object.entries(SERVICE_ICONS).map(([key, Icon]) => (
            <button
              key={key}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition capitalize"
            >
              <Icon className="w-6 h-6 text-brand-600" />
              <span className="text-sm font-medium">{key}</span>
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-3">Your requests</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-400">
            You haven't made any requests yet — pick a service above to get started.
          </p>
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
