import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sw_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sw_token');
    if (token) {
      api.get('/auth/me').then(r => { setUser(r.data); localStorage.setItem('sw_user', JSON.stringify(r.data)); })
        .catch(() => { localStorage.removeItem('sw_token'); localStorage.removeItem('sw_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('sw_token', data.token);
    localStorage.setItem('sw_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('sw_token', data.token);
    localStorage.setItem('sw_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('sw_token');
    localStorage.removeItem('sw_user');
    setUser(null);
  };

  const updateUser = (u) => { setUser(u); localStorage.setItem('sw_user', JSON.stringify(u)); };

  return <AuthCtx.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
