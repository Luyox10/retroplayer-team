import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { login, me } from '../services/adminAuthService';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await login(email, password);
      if (r?.token) {
        localStorage.setItem('token', r.token);
        const m = await me();
        if (m?.user?.role !== 'admin') {
          setError('Acceso denegado: no eres administrador');
          localStorage.removeItem('token');
          setLoading(false);
          return;
        }
        setSession(r.token, m.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '100px auto' }}>
      <h2>Admin Login</h2>
      {error && <div className="admin-error">{error}</div>}
      <form onSubmit={handleSubmit} className="admin-form">
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="admin-btn" type="submit" disabled={loading}>Entrar</button>
      </form>
    </div>
  );
}
