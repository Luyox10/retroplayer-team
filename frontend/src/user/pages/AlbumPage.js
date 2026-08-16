import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { getAlbum, getAlbumTracks } from '../services/contentService';
import { getExternalId } from '../../shared/utils/contentHelpers';
import '../styles/Pages.css';

function AlbumTrackItem({ track, index, onPlay }) {
  const title = track.title || 'Sin titulo';
  const artist = track.artist || 'Desconocido';
  const duration = track.duration || 0;
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60).toString().padStart(2, '0');
  const position = track.position != null ? track.position + 1 : index + 1;

  return (
    <div
      className="album-track-item"
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onPlay(); }}
    >
      <span className="album-track-number">{position}</span>
      <span className="album-track-play">▶</span>
      <div className="album-track-info">
        <strong className="album-track-title">{title}</strong>
        <span className="album-track-artist">{artist}</span>
      </div>
      {duration > 0 && (
        <span className="album-track-duration">{mins}:{secs}</span>
      )}
    </div>
  );
}

export default function AlbumPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playTrack } = usePlayer();

  const [album, setAlbum] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getAlbum(id).catch(() => null),
      getAlbumTracks(id).catch(() => ({ tracks: [], album: null })),
    ])
      .then(([albumData, tracksData]) => {
        if (albumData?.album) setAlbum(albumData.album);
        else if (tracksData?.album) setAlbum(tracksData.album);
        setTracks(tracksData?.tracks || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePlayTrack = (track, playlist) => {
    if (getExternalId(track)) {
      playTrack(track, playlist || []);
      navigate('/room');
    }
  };

  if (loading) {
    return (
      <div className="page album-page">
        <div className="loading">Cargando album...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page album-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page album-page">
      {album && (
        <div className="album-hero">
          {album?.image ? (
            <div className="album-cover">
              <img src={album.image} alt={album.name} />
            </div>
          ) : (
            <div className="album-cover album-cover-placeholder" />
          )}
          <div className="album-meta">
            <h1 className="album-title">{album?.name || 'Album'}</h1>
            {album?.artistName && <p className="album-artist">{album.artistName}</p>}
            {album?.year && <p className="album-year">{album.year}</p>}
          </div>
        </div>
      )}

      {tracks.length > 0 ? (
        <section className="album-tracks-section">
          <h2 className="album-tracks-heading">Canciones</h2>
          <div className="album-tracks-list">
            {tracks.map((track, i) => (
              <AlbumTrackItem
                key={getExternalId(track) || `album-track-${i}`}
                track={track}
                index={i}
                onPlay={() => handlePlayTrack(track, tracks)}
              />
            ))}
          </div>
        </section>
      ) : (
        <p className="empty">No se encontraron canciones en este album</p>
      )}

      {!album && !loading && <p className="empty">No se encontro el album</p>}
    </div>
  );
}
