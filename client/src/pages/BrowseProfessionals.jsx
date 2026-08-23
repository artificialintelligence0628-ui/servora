import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import { publicApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function BrowseProfessionals() {
  const { user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  function load(service) {
    setLoading(true);
    publicApi
      .listProfessionals({ service: service || undefined })
      .then((d) => setProviders(d.providers))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    load(query.trim());
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Browse professionals</h1>
          <p className="text-gray-500 mb-6 text-sm">
            See who's on Servora. Contact stays in-app — pick someone and request them directly.
          </p>

          <form onSubmit={handleSearch} className="flex items-center gap-2 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by profession…"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shrink-0"
            >
              Search
            </button>
          </form>

          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : providers.length === 0 ? (
            <p className="text-sm text-gray-400">No professionals found for that search.</p>
          ) : (
            <ul className="space-y-3">
              {providers.map((p) => (
                <li key={p.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{p.name}</span>
                    {p.rating_count > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        {Number(p.rating_avg).toFixed(1)} ({p.rating_count})
                      </span>
                    )}
                  </div>
                  {(p.university || p.operating_area) && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <MapPin className="w-3 h-3" />
                      {[p.university, p.operating_area].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {p.services?.map((service) => (
                      <Link
                        key={service}
                        to={
                          user
                            ? `/request/${encodeURIComponent(service)}?providerId=${p.id}&providerName=${encodeURIComponent(p.name)}`
                            : '/register'
                        }
                        className="text-xs font-medium capitalize text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-full transition"
                      >
                        Request {service}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
