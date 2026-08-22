import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { orderApi, paymentApi } from '../api';
import { SERVICE_CONFIG } from '../serviceConfig';

const STEPS = ['requested', 'assigned', 'accepted', 'on_the_way', 'in_progress', 'completed'];
const STEP_LABELS = {
  requested: 'Request received',
  assigned: 'Provider assigned',
  accepted: 'Provider accepted',
  on_the_way: 'On the way',
  in_progress: 'In progress',
  completed: 'Completed',
};

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function load() {
      orderApi
        .get(orderId)
        .then((d) => {
          if (!cancelled) setOrder(d.order);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || 'Could not load this order');
        });
    }

    load();
    const interval = setInterval(load, 8000); // simple polling until we build push notifications
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/dashboard" className="text-brand-600 font-medium hover:underline">
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-gray-400">Loading…</main>
      </div>
    );
  }

  const isDeclinedOrCancelled = order.status === 'declined' || order.status === 'cancelled';
  const currentIndex = STEPS.indexOf(order.status);
  const config = SERVICE_CONFIG[order.service_type];
  const Icon = config?.icon;
  const needsPayment =
    order.price_amount &&
    !['in_progress', 'completed', 'declined', 'cancelled'].includes(order.status);

  async function handlePay() {
    setPaying(true);
    try {
      const { authorizationUrl } = await paymentApi.initialize(order.id);
      window.location.href = authorizationUrl;
    } catch (err) {
      alert(err.message || 'Could not start payment');
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10">
        <div className="max-w-lg mx-auto">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>

          <div className="flex items-center gap-3 mb-1">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-brand-600" />
              </div>
            )}
            <h1 className="text-2xl font-bold capitalize">{order.service_type} request</h1>
          </div>
          <p className="text-gray-500 mb-8 text-sm">
            {order.hostel}
            {order.block ? `, Block ${order.block}` : ''}
            {order.room ? `, Room ${order.room}` : ''}
          </p>

          {isDeclinedOrCancelled ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-8">
              This request was {order.status}. Please submit a new request or contact support.
            </div>
          ) : (
            <ol className="space-y-4 mb-8">
              {STEPS.map((step, i) => {
                const done = i <= currentIndex;
                return (
                  <li key={step} className="flex items-center gap-3">
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                    <span className={done ? 'text-gray-900 font-medium text-sm' : 'text-gray-400 text-sm'}>
                      {STEP_LABELS[step]}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {order.price_amount && (
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm mb-8">
              <div className="flex justify-between mb-3">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold">GH₵{Number(order.price_amount).toFixed(2)}</span>
              </div>
              {needsPayment && (
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition text-sm"
                >
                  {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Pay now
                </button>
              )}
            </div>
          )}

          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer font-medium text-gray-700">Request details</summary>
            <ul className="mt-2 space-y-1">
              {Object.entries(order.details || {}).map(([key, val]) => (
                <li key={key}>
                  <span className="capitalize text-gray-400">{key}:</span> {String(val)}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </main>
    </div>
  );
}
