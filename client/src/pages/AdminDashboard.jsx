import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { adminApi } from '../api';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    adminApi.overview().then(setOverview).catch(() => setOverview(null));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10 max-w-3xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">Admin overview</h1>

        {!overview ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat label="Orders" value={overview.orderCount} />
            <Stat label="Providers" value={overview.providerCount} />
            <Stat label="Students" value={overview.studentCount} />
            <Stat label="Commission (GH₵)" value={overview.revenue?.total_commission ?? 0} />
          </div>
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
