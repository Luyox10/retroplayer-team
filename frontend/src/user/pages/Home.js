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
        {recommended.length > 0 ? recommended.map((t) => <TrackCard key={`${t.source}-${t.externalId || t.id}`} track={t} />) : <p className="empty">Sin recomendaciones</p>}
      </div>
    </div>
  );
}
