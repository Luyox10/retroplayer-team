import React, { useEffect, useState } from 'react';
import { getFavorites, getHistory } from '../services/libraryService';
import '../styles/Pages.css';

function TrackCard({ track, extra }) {
  return (
    <div className="card">
      <img src={track.cover_url || '/logo192.png'} alt={track.title} />
      <h3>{track.title}</h3>
      <p>{track.artist}</p>
      {extra && <p>{extra}</p>}
    </div>
  );
}

export default function Library() {
  const [tab, setTab] = useState('favorites');
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    (tab === 'favorites' ? getFavorites() : getHistory())
      .then((r) => {
        if (tab === 'favorites') setFavorites(r?.favorites || []);
        else setHistory(r?.history || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab]);

  const data = tab === 'favorites' ? favorites : history;

  return (
    <div className="page">
      <h2>Biblioteca</h2>
      <div className="tabs">
        <button className={`tab ${tab === 'favorites' ? 'active' : ''}`} onClick={() => setTab('favorites')}>Favoritos</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Historial</button>
      </div>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Cargando...</div>}
      <div className="grid">
        {data.length > 0 ? data.map((item) => (
          <TrackCard
            key={item.id}
            track={item}
            extra={tab === 'history' ? `Escuchado: ${item.listened_seconds || 0}s` : null}
          />
        )) : <p className="empty">Sin {tab === 'favorites' ? 'favoritos' : 'historial'}</p>}
      </div>
    </div>
  );
}
