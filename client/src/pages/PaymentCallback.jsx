import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { paymentApi } from '../api';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [status, setStatus] = useState('verifying'); // verifying | paid | failed | error
  const [orderId, setOrderId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setError('No payment reference was returned.');
      return;
    }
    paymentApi
      .verify(reference)
      .then((d) => {
        setStatus(d.status); // 'paid' or 'failed'
        setOrderId(d.payment?.order_id ?? null);
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message || 'Could not verify this payment');
      });
  }, [reference]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
            <p className="text-gray-600">Confirming your payment…</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-brand-600 mb-4" />
            <h1 className="text-xl font-bold mb-1">Payment successful</h1>
            <p className="text-gray-500 mb-6 text-sm">Your provider has been notified.</p>
            {orderId && (
              <Link
                to={`/orders/${orderId}`}
                className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-lg transition"
              >
                View your request
              </Link>
            )}
          </>
        )}

        {(status === 'failed' || status === 'error') && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-xl font-bold mb-1">Payment not completed</h1>
            <p className="text-gray-500 mb-6 text-sm">
              {error || "We couldn't confirm this payment. No charge should have gone through."}
            </p>
            <Link to="/dashboard" className="text-brand-600 font-medium hover:underline text-sm">
              Back to dashboard
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
