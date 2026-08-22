import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <Link to="/" className="font-bold text-lg text-brand-700">
        SERVORA
      </Link>

      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <span className="text-gray-500">
              Hi, {user.name.split(' ')[0]} <span className="text-gray-400">({user.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-lg transition"
            >
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
