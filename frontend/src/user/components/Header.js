import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

export default function Header() {
  const { user, clearSession } = useAuth();

  const handleLogout = () => {
    clearSession();
    window.location.href = '/';
  };

  return (
    <header className="header">
      <div className="header-brand">
        <h1>RetroPlayer</h1>
      </div>
      <div className="header-user">
        {user ? (
          <>
            <span>{user.display_name || user.username}</span>
            <button onClick={handleLogout}>Salir</button>
          </>
        ) : (
          <a href="#/login" className="header-link">Iniciar sesión</a>
        )}
      </div>
    </header>
  );
}
