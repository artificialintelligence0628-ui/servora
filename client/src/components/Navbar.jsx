import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoWordmark from '../assets/logo-wordmark.jpeg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="bg-ink-900 border-b border-white/10">
      <div className="px-6 py-3 flex items-center justify-between">
        <Link to="/" className="shrink-0">
          <img src={logoWordmark} alt="Servora" className="h-8 w-auto rounded" />
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <span className="text-gray-400 hidden sm:inline">
                Hi, {user.name.split(' ')[0]} <span className="text-gray-500">({user.role})</span>
              </span>
              {user.role === 'student' && (
                <Link to="/account" className="text-gray-300 hover:text-white font-medium transition">
                  Account
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white font-medium transition"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white font-medium transition">
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-gold-500 hover:bg-gold-400 text-ink-900 font-semibold px-4 py-2 rounded-lg transition"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
