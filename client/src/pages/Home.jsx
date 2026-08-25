import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { healthApi } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ProfessionSearch from '../components/ProfessionSearch';
import { SERVICE_CONFIG } from '../serviceConfig';
import logoWordmark from '../assets/logo-wordmark.jpeg';

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

      {/* Hero — dark canvas matching the logo's native palette */}
      <section className="relative bg-ink-900 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[36rem] h-[36rem] brand-glow rounded-full" />
        </div>

        <div className="absolute top-4 right-6 text-xs text-gray-500">API: {apiStatus}</div>

        <div className="relative px-6 pt-16 pb-14 flex flex-col items-center text-center animate-fade-up">
          <img src={logoWordmark} alt="Servora — Service Made Simple" className="h-16 sm:h-20 w-auto mb-8 rounded-lg" />

          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 max-w-2xl leading-tight">
            Water. Laundry. Repairs.
            <br />
            Or anyone else you need.
          </h1>
          <p className="text-gray-400 max-w-lg mb-10 text-base md:text-lg">
            Tell Servora what you need — we match you with a trusted local provider, handle the
            coordination, and keep it all in one place.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full mb-8">
            {Object.entries(SERVICE_CONFIG).map(([key, { label, icon: Icon }]) => (
              <button
                key={key}
                onClick={() => goRequestService(key)}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 hover:border-gold-500/50 hover:bg-white/10 transition"
              >
                <span className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 text-white" />
                </span>
                <span className="text-sm font-medium text-gray-200">{label}</span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-xl p-2 w-full max-w-md mb-4">
            <ProfessionSearch onNeedsAuth={!user ? () => navigate('/register') : undefined} />
          </div>

          <Link to="/browse" className="text-sm text-gray-400 hover:text-white underline underline-offset-4 transition">
            Or browse professionals already on Servora
          </Link>
        </div>
      </section>

      {/* Below the fold — plain, light, functional */}
      <main className="flex-1 flex items-center justify-center px-6 py-14 bg-gray-50">
        <button
          onClick={() => goRequestService()}
          className="bg-brand-gradient text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg shadow-brand-900/20 hover:shadow-xl hover:-translate-y-0.5 transition"
        >
          Request a Service
        </button>
      </main>
    </div>
  );
}
