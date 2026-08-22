import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Truck, Wrench, PackageCheck, Upload, FileCheck, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import ChatThread from '../components/ChatThread';
import { useAuth } from '../context/AuthContext';
import { providerApi, orderApi } from '../api';

const STATUS_STYLES = {
  requested: 'bg-gray-100 text-gray-600',
  assigned: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  declined: 'bg-red-100 text-red-700',
  on_the_way: 'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-brand-100 text-brand-700',
  cancelled: 'bg-red-100 text-red-700',
};

// What action buttons make sense given the order's current status.
const NEXT_ACTIONS = {
  assigned: [
    { status: 'accepted', label: 'Accept', icon: CheckCircle2, style: 'brand' },
    { status: 'declined', label: 'Decline', icon: XCircle, style: 'red' },
  ],
  accepted: [{ status: 'on_the_way', label: 'Mark on the way', icon: Truck, style: 'brand' }],
  on_the_way: [{ status: 'in_progress', label: 'Mark in progress', icon: Wrench, style: 'brand' }],
  in_progress: [{ status: 'completed', label: 'Mark completed', icon: PackageCheck, style: 'brand' }],
};

const BUTTON_STYLES = {
  brand: 'text-brand-700 bg-brand-50 hover:bg-brand-100',
  red: 'text-red-700 bg-red-50 hover:bg-red-100',
};

export default function ProviderDashboard() {
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  function loadOrders() {
    providerApi.myOrders().then((o) => setOrders(o.orders));
  }

  useEffect(() => {
    Promise.all([providerApi.me(), providerApi.myOrders()])
      .then(([p, o]) => {
        setProvider(p.provider);
        setOrders(o.orders);
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleAvailability() {
    if (!provider) return;
    setToggling(true);
    try {
      const { provider: updated } = await providerApi.setAvailability(!provider.is_available);
      setProvider(updated);
    } finally {
      setToggling(false);
    }
  }

  async function handleOrderAction(orderId, status) {
    setUpdatingOrderId(orderId);
    try {
      await providerApi.setOrderStatus(orderId, status);
      loadOrders();
    } catch (err) {
      alert(err.message || 'Could not update this request');
    } finally {
      setUpdatingOrderId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-gray-400">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Hi, {user.name.split(' ')[0]} 👋</h1>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[provider.status] || 'bg-gray-100 text-gray-600'}`}
          >
            {provider.status}
          </span>
        </div>
        <p className="text-gray-500 mb-6 text-sm capitalize">
          Services: {provider.services?.join(', ') || 'none set'} · {provider.operating_area || 'no area set'}
        </p>

        {provider.status === 'pending' && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your account is awaiting verification. An admin will review your details before you
            start receiving requests.
          </div>
        )}

        <IdDocumentUpload provider={provider} onUploaded={setProvider} />

        <button
          onClick={toggleAvailability}
          disabled={toggling}
          className={`mb-8 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
            provider.is_available
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {provider.is_available ? 'Available for new requests' : 'Currently offline'}
        </button>

        <h2 className="text-lg font-semibold mb-3">Assigned requests</h2>
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">No requests assigned yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const actions = NEXT_ACTIONS[o.status] || [];
              return (
                <li key={o.id} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="capitalize font-medium text-sm">{o.service_type}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {o.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {o.hostel}
                    {o.block ? `, Block ${o.block}` : ''}
                    {o.room ? `, Room ${o.room}` : ''}
                  </p>
                  {o.details && Object.keys(o.details).length > 0 && (
                    <p className="text-xs text-gray-400 mb-2">
                      {Object.entries(o.details)
                        .filter(([k]) => k !== 'photoUrl')
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </p>
                  )}

                  {o.status === 'accepted' && !o.price_amount && (
                    <PriceQuoteForm
                      orderId={o.id}
                      commissionRate={provider.commission_rate}
                      onQuoted={loadOrders}
                    />
                  )}
                  {o.price_amount && (
                    <p className="text-xs text-gray-500 mb-2">
                      Quoted GH₵{Number(o.price_amount).toFixed(2)} · you'll receive GH₵
                      {Number(o.provider_payout).toFixed(2)} after commission
                    </p>
                  )}

                  {!['declined', 'cancelled'].includes(o.status) && <ChatThread orderId={o.id} />}

                  {actions.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {actions.map(({ status, label, icon: Icon, style }) => (
                        <button
                          key={status}
                          onClick={() => handleOrderAction(o.id, status)}
                          disabled={updatingOrderId === o.id}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg disabled:opacity-60 transition ${BUTTON_STYLES[style]}`}
                        >
                          <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

function PriceQuoteForm({ orderId, commissionRate, onQuoted }) {
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!price || Number(price) <= 0) return;
    setSubmitting(true);
    try {
      await orderApi.setPrice(orderId, Number(price));
      onQuoted();
    } catch (err) {
      alert(err.message || 'Could not submit your quote');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-2">
      <input
        type="number"
        min="1"
        step="0.01"
        required
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Your price (GH₵)"
        className="w-36 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <button
        type="submit"
        disabled={submitting}
        className="text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 disabled:opacity-60 px-3 py-1.5 rounded-lg transition"
      >
        Send quote
      </button>
      <span className="text-xs text-gray-400">{commissionRate}% commission applies</span>
    </form>
  );
}

function IdDocumentUpload({ provider, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { provider: updated } = await providerApi.uploadIdDocument(file);
      onUploaded(updated);
    } catch (err) {
      setError(err.message || 'Could not upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-700">Identity verification</p>
          {provider.id_document_url ? (
            <a
              href={provider.id_document_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-0.5"
            >
              <FileCheck className="w-3.5 h-3.5" /> View uploaded document
            </a>
          ) : (
            <p className="text-xs text-gray-500 mt-0.5">
              Upload an ID or business document so an admin can verify your account.
            </p>
          )}
        </div>

        <label className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg cursor-pointer transition">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {provider.id_document_url ? 'Replace' : 'Upload'}
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
