import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { getRecommended, getTrack } from '../services/exploreService';
import { getFeatured } from '../services/featuredService';
import '../styles/Pages.css';

function TrackCard({ track }) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [imgError, setImgError] = React.useState(false);
  const title = track.title || 'Sin título';
  const artist = track.artist || 'Desconocido';
  const cover = track.thumbnail || track.cover_url;
  const hasCover = cover && !imgError;

  const handlePlay = async () => {
    if (track.embedUrl || track.videoId) {
      playTrack(track);
      navigate('/room');
      return;
    }
    if (track.source === 'youtube' && track.external_track_id) {
      const r = await getTrack(track.external_track_id);
      if (r?.track?.embedUrl) {
        playTrack(r.track);
        navigate('/room');
      }
    }
  };

  return (
    <div className="card track-card" onClick={handlePlay} role="button" tabIndex={0}>
      <div className="card-media">
        {hasCover ? (
          <img src={cover} alt={title} onError={() => setImgError(true)} />
        ) : (
          <div className="cover-placeholder">
            <span>{title[0]}</span>
            <p>{artist}</p>
          </div>
        )}
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        <p>{artist}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="section">
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero" aria-label="Bienvenida">
      <div className="hero-glow hero-glow-1" aria-hidden="true" />
      <div className="hero-glow hero-glow-2" aria-hidden="true" />
      <div className="hero-content">
        <h1>Descubre tu sonido retro</h1>
        <p className="hero-subtitle">Explora canciones, crea tu espacio y vive la música con estilo.</p>
        <button className="btn btn-hero" onClick={() => navigate('/explore')} type="button">
          Explorar música
        </button>
      </div>
    </section>
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

  if (loading) {
    return (
      <div className="page home-page">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page home-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page home-page">
      <Hero />
      <Section title="Destacados">
        <div className="grid">
          {featured.length > 0 ? featured.map((t) => <TrackCard key={`${t.source}-${t.external_track_id || t.id}`} track={t} />) : <p className="empty">Sin destacados</p>}
        </div>
      </Section>
      <Section title="Recomendados">
        <div className="grid">
          {recommended.length > 0 ? recommended.map((t) => <TrackCard key={`${t.source}-${t.externalId || t.id}`} track={t} />) : <p className="empty">Sin recomendaciones</p>}
        </div>
      </Section>
    </div>
  );
}
