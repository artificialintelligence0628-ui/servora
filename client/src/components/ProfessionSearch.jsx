import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

/**
 * Lets anyone request any profession, not just the 4 curated University
 * services — types a profession (e.g. "hairdresser", "tutor") and lands on
 * the generic request form for it (see serviceConfig.getServiceConfig).
 */
export default function ProfessionSearch({ onNeedsAuth }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (onNeedsAuth) {
      onNeedsAuth();
      return;
    }

    const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
    navigate(`/request/${slug}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Looking for something else? e.g. tutor, hairdresser…"
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <button
        type="submit"
        className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition shrink-0"
      >
        Find
      </button>
    </form>
  );
}
