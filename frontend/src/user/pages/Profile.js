import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile } from '../services/userService';
import '../styles/Pages.css';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    getProfile()
      .then((r) => {
        if (r?.user) {
          setDisplayName(r.user.display_name || '');
          setAvatarUrl(r.user.avatar_url || '');
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const r = await updateProfile(displayName.trim() || null, avatarUrl.trim() || null);
      if (r?.user) {
        setUser(r.user);
        setMessage('Perfil actualizado');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h2>Perfil</h2>
      {error && <div className="error">{error}</div>}
      {message && <div className="loading">{message}</div>}
      {user && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input className="input" type="text" value={user.username} disabled />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="text" value={user.email} disabled />
          </div>
          <div className="form-group">
            <label>Nombre visible</label>
            <input className="input" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>URL de avatar</label>
            <input className="input" type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>
          <button className="btn" type="submit" disabled={loading}>Guardar</button>
        </form>
      )}
    </div>
  );
}
