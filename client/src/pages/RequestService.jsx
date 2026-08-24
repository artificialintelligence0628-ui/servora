import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, UserCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { orderApi } from '../api';
import { getServiceConfig } from '../serviceConfig';
import { UNIVERSITIES } from '../universities';
import { useAuth } from '../context/AuthContext';

export default function RequestService() {
  const { serviceType } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const preferredProviderId = searchParams.get('providerId') || undefined;
  const preferredProviderName = searchParams.get('providerName') || undefined;
  const config = getServiceConfig(serviceType);

  const [values, setValues] = useState({});
  const [photo, setPhoto] = useState(null);
  const [university, setUniversity] = useState(user.university || '');
  const [customUniversity, setCustomUniversity] = useState('');
  const [hostel, setHostel] = useState(user.hostel || '');
  const [block, setBlock] = useState(user.block || '');
  const [room, setRoom] = useState(user.room || '');
  const [preferredTime, setPreferredTime] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!serviceType) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <p className="text-gray-500 mb-4">We don't recognize that service.</p>
          <Link to="/dashboard" className="text-brand-600 font-medium hover:underline">
            Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const Icon = config.icon;

  function setField(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    for (const field of config.fields) {
      if (!field.optional && field.type !== 'file' && !values[field.name]) {
        setError(`Please fill in "${field.label}".`);
        return;
      }
    }
    if (!hostel) {
      setError('Please tell us your hostel/location.');
      return;
    }

    setLoading(true);
    try {
      const details = { ...values };
      delete details.photo;

      const { order } = await orderApi.create({
        serviceType,
        details,
        university: university === 'Other' ? customUniversity : university,
        hostel,
        block,
        room,
        preferredTime: preferredTime || undefined,
        photo: config.fields.some((f) => f.type === 'file') ? photo : undefined,
        preferredProviderId,
        durationDays: durationDays || undefined,
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.message || 'Could not submit your request');
    } finally {
      setLoading(false);
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
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
              <Icon className="w-5 h-5 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold">{config.label}</h1>
          </div>
          <p className="text-gray-500 mb-8 text-sm">{config.tagline}</p>

          {preferredProviderName && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              <UserCheck className="w-4 h-4 shrink-0" />
              Requesting directly from <strong>{preferredProviderName}</strong>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {config.fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(v) => setField(field.name, v)}
                onFile={setPhoto}
              />
            ))}

            <div className="border-t border-gray-200 pt-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Where should we send this?</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">University</label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="" disabled>
                      Select…
                    </option>
                    {UNIVERSITIES.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  {university === 'Other' && (
                    <input
                      value={customUniversity}
                      onChange={(e) => setCustomUniversity(e.target.value)}
                      placeholder="Enter your university"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hostel / accommodation <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    placeholder="e.g. Melcom Hostel"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Block</label>
                  <input
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="e.g. B"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Room</label>
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="e.g. 204"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred time <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="datetime-local"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How many days do you think this will take?{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="e.g. 1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Helps the provider quote accurately for bigger jobs.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Request Service
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

function FormField({ field, value, onChange, onFile }) {
  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label} {!field.optional && <span className="text-red-500">*</span>}
    </label>
  );

  if (field.type === 'select') {
    return (
      <div>
        {label}
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="" disabled>
            Select…
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        {label}
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    );
  }

  if (field.type === 'file') {
    return (
      <div>
        {label}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-medium hover:file:bg-brand-100"
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        type={field.type}
        min={field.min}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  );
}
