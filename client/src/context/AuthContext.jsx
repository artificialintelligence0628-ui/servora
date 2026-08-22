import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const stored = localStorage.getItem('servora_token');
      if (!stored) {
        setUser(null);
        return;
      }
      const { user } = await authApi.me();
      setUser(user);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    // Every tab shares the same localStorage token. If the person logs in/out
    // as a different account in another tab, sync this tab's session too,
    // instead of silently going stale and failing role checks on the next request.
    function handleStorageChange(e) {
      if (e.key === 'servora_token') {
        loadUser();
      }
    }
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUser]);

  async function login(email, password) {
    const { user, token } = await authApi.login({ email, password });
    setToken(token);
    setUser(user);
    return user;
  }

  async function register(payload) {
    const { user, token } = await authApi.register(payload);
    setToken(token);
    setUser(user);
    return user;
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
