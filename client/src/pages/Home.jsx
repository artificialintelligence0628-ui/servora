import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { healthApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { SERVICE_CONFIG } from '../serviceConfig';

export default function Home() {
  const [apiStatus, setApiStatus] = useState('checking...');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    healthApi
      .check()
      .then((d) => setApiStatus(d.db === 'connected' ? 'connected' : 'db unreachable'))
      .catch(() => setApiStatus('unreachable'));
  }, []);

  function goRequestService(serviceKey) {
    if (!user) navigate('/register');
    else if (user.role === 'provider') navigate('/provider');
    else if (user.role === 'admin') navigate('/admin');
    else navigate(serviceKey ? `/request/${serviceKey}` : '/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="px-6 pt-2 text-right">
        <span className="text-xs text-gray-400">API: {apiStatus}</span>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="uppercase tracking-widest text-brand-600 text-xs font-semibold mb-2">
          Service Made Simple
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3 max-w-xl">
          Your everyday services, delivered to you.
        </h1>
        <p className="text-gray-500 max-w-md mb-10">
          Water, laundry, gas, and repairs — one request away.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl w-full">
          {Object.entries(SERVICE_CONFIG).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => goRequestService(key)}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-400 hover:shadow transition"
            >
              <Icon className="w-6 h-6 text-brand-600" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => goRequestService()}
          className="mt-10 bg-brand-600 hover:bg-brand-700 text-white font-medium px-6 py-3 rounded-lg transition"
        >
          Request a Service
        </button>
      </main>
    </div>
  );
}
