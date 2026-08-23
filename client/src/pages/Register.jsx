import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, GraduationCap, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { UNIVERSITIES } from '../universities';

const SERVICE_OPTIONS = ['water', 'laundry', 'gas', 'repairs'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [services, setServices] = useState([]);
  const [otherProfessions, setOtherProfessions] = useState('');
  const [university, setUniversity] = useState('');
  const [customUniversity, setCustomUniversity] = useState('');
  const [operatingArea, setOperatingArea] = useState('');
  const [references, setReferences] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function toggleService(service) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  function parsedOtherProfessions() {
    return otherProfessions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const allServices = [...services, ...parsedOtherProfessions()];
    if (role === 'provider' && allServices.length === 0) {
      setError('Pick or type at least one service you provide.');
      return;
    }

    setLoading(true);
    try {
      const payload = { name, email, phone, password, role };
      if (role === 'provider') {
        payload.services = allServices;
        payload.operatingArea = operatingArea;
        payload.university = university === 'Other' ? customUniversity : university;
        payload.references = references || undefined;
      }
      const user = await register(payload);
      if (user.role === 'provider') navigate('/provider');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Could not create your account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-1">Create your account</h1>
          <p className="text-gray-500 mb-6 text-sm">
            Request services as a student, or offer them as a provider.
          </p>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              type="button"
              onClick={() => setRole('student')}
              className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition ${
                role === 'student'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setRole('provider')}
              className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-sm font-medium transition ${
                role === 'provider'
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <Wrench className="w-5 h-5" />
              Provider
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ama Owusu"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="024 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="At least 8 characters"
              />
            </div>

            {role === 'provider' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services you offer
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <label
                        key={s}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm capitalize cursor-pointer transition ${
                          services.includes(s)
                            ? 'border-brand-600 bg-brand-50 text-brand-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-brand-600"
                          checked={services.includes(s)}
                          onChange={() => toggleService(s)}
                        />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other professions{' '}
                    <span className="text-gray-400 font-normal">(not on the list above)</span>
                  </label>
                  <input
                    value={otherProfessions}
                    onChange={(e) => setOtherProfessions(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. tutor, hairdresser, plumber (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University / campus
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                      placeholder="Enter your university/campus"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific area / hostel
                  </label>
                  <input
                    value={operatingArea}
                    onChange={(e) => setOperatingArea(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. KTU Hostel Area"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    References <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={references}
                    onChange={(e) => setReferences(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Names and contact info of people who can vouch for your work"
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
