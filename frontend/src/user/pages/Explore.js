import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTracks, getRecommended } from '../services/exploreService';
import '../styles/Pages.css';

function TrackCard({ track }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = React.useState(false);
  const title = track.title || 'Sin título';
  const artist = track.artist || 'Desconocido';
  const cover = track.thumbnailUrl;
  const hasCover = cover && !imgError;

  const handlePlay = () => {
    if (track.audioUrl) {
      navigate('/room', { state: { track } });
    }
  };

  return (
    <div className="card track-card" onClick={handlePlay} role="button" tabIndex={0}>
      {hasCover ? (
        <img src={cover} alt={title} onError={() => setImgError(true)} />
      ) : (
        <div className="cover-placeholder">
          <span>{title[0]}</span>
          <p>{artist}</p>
        </div>
      )}
      <h3>{title}</h3>
      <p>{artist}</p>
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
