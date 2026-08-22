import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { adminApi } from '../api';

const STATUS_STYLES = {
  verified: 'bg-brand-100 text-brand-700',
  pending: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

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

  useEffect(() => {
    loadOverview();
    loadProviders();
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
