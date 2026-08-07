import React, { createContext, useContext, useEffect, useState } from 'react';
import { me } from '../services/adminAuthService';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      me()
        .then((data) => {
          if (data && data.user) setUser(data.user);
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setSession = (token, userData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, setUser, setSession, clearSession, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
