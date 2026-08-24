import { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { getPushPermissionState, enablePushNotifications } from '../pushNotifications';

/** Shows an "Enable notifications" banner only when permission hasn't been decided yet. */
export default function NotificationPrompt() {
  const [state, setState] = useState('checking');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setState(getPushPermissionState());
  }, []);

  async function handleEnable() {
    setError('');
    setLoading(true);
    try {
      await enablePushNotifications();
      setState('granted');
    } catch (err) {
      setError(err.message || 'Could not enable notifications');
    } finally {
      setLoading(false);
    }
  }

  if (state !== 'default') return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-gray-600">
        <Bell className="w-4 h-4 shrink-0" /> Get notified about new requests and updates
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleEnable}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-60 px-3 py-1.5 rounded-lg transition"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Enable
        </button>
      </div>
    </div>
  );
}
