import React from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import './AdminLayout.css';

export default function AdminHeader() {
  const { user, clearSession } = useAdminAuth();

  const handleLogout = () => {
    clearSession();
    window.location.href = '#/login';
  };

  return (
    <header className="admin-header">
      <div className="admin-brand">
        <h1>RetroPlayer Admin</h1>
      </div>
      <div className="admin-user">
        {user && <span>{user.display_name || user.username}</span>}
        <button onClick={handleLogout}>Salir</button>
      </div>
    </header>
  );
}
