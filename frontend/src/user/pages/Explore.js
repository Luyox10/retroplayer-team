import React, { useEffect, useState } from 'react';
import { searchTracks, getRecommended } from '../services/exploreService';
import '../styles/Pages.css';

function TrackCard({ track }) {
  return (
    <div className="card">
      <img src={track.cover_url || track.image || '/logo192.png'} alt={track.name || track.title} />
      <h3>{track.name || track.title}</h3>
      <p>{track.artist_name || track.artist}</p>
    </div>
  );
}

export default function Explore() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getRecommended()
      .then((r) => setTracks(r?.tracks || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    searchTracks(query)
      .then((r) => setTracks(r?.tracks || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="page">
      <h2>Explorar</h2>
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="input"
          type="text"
          placeholder="Buscar canciones..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" type="submit">Buscar</button>
      </form>
      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Cargando...</div>}
      <div className="grid">
        {tracks.length > 0 ? tracks.map((t) => <TrackCard key={t.id || t.track_id || t.audio} track={t} />) : <p className="empty">Sin resultados</p>}
      </div>
    </div>
  );
}
