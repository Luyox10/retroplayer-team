import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { getAlbum, getAlbumTracks } from '../services/contentService';
import { getTrackImage, getExternalId } from '../../shared/utils/contentHelpers';
import '../styles/Pages.css';

function TrackListItem({ track, index, onPlay }) {
  const title = track.title || 'Sin titulo';
  const artist = track.artist || 'Desconocido';
  const cover = getTrackImage(track);
  const duration = track.duration || 0;
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60).toString().padStart(2, '0');

  return (
    <div className="track-list-item" onClick={onPlay} role="button" tabIndex={0}>
      <span className="track-list-rank">{index + 1}</span>
      {cover && <img className="track-list-cover" src={cover} alt={title} />}
      <div className="track-list-info">
        <strong>{title}</strong>
        <span>{artist}</span>
      </div>
      {duration > 0 && (
        <span className="track-list-duration">{mins}:{secs}</span>
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
      getAlbumTracks(id).catch(() => ({ tracks: [] })),
    ])
      .then(([albumData, tracksData]) => {
        if (albumData?.album) setAlbum(albumData.album);
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
        <div className="artist-header">
          {album?.image && (
            <div className="artist-image">
              <img src={album.image} alt={album.name} />
            </div>
          )}
          <div className="artist-info">
            <h1 className="artist-name">{album?.name || 'Album'}</h1>
            {album?.artistName && <p className="artist-description">{album.artistName}</p>}
            {album?.year && <p className="album-year">{album.year}</p>}
          </div>
        </div>
      )}

      {tracks.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Canciones del album</h2>
          </div>
          <div className="top-tracks-list">
            {tracks.map((track, i) => (
              <TrackListItem
                key={getExternalId(track) || `album-track-${i}`}
                track={track}
                index={i}
                onPlay={() => handlePlayTrack(track, tracks)}
              />
            ))}
          </div>
        </section>
      )}

      {(!album && !loading) && <p className="empty">No se encontro el album</p>}
    </div>
  );
}
