import React, { useEffect, useState } from 'react';
import { getRecommended } from '../services/exploreService';
import { getFeatured } from '../services/featuredService';
import '../styles/Pages.css';

function TrackCard({ track }) {
  return (
    <div className="card">
      <img src={track.cover_url || '/logo192.png'} alt={track.title} />
      <h3>{track.title}</h3>
      <p>{track.artist}</p>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([getFeatured(), getRecommended()])
      .then(([f, r]) => {
        setFeatured(f?.tracks || []);
        setRecommended(r?.tracks || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="page">
      <h2>Inicio</h2>
      <h3>Destacados</h3>
      <div className="grid">
        {featured.length > 0 ? featured.map((t) => <TrackCard key={`${t.source}-${t.external_track_id || t.id}`} track={t} />) : <p className="empty">Sin destacados</p>}
      </div>
      <h3>Recomendados</h3>
      <div className="grid">
        {recommended.length > 0 ? recommended.map((t) => <TrackCard key={`${t.source}-${t.id || t.track_id}`} track={t} />) : <p className="empty">Sin recomendaciones</p>}
      </div>
    </div>
  );
}
