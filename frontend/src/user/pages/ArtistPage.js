import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { getArtist, getArtistTop, getArtistAlbums, getArtistTracks, search, searchTracks } from '../services/contentService';
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

function AlbumCard({ album, onClick }) {
  const [imgError, setImgError] = React.useState(false);
  const name = album.name || 'Sin titulo';
  const artist = album.artistName || '';
  const cover = album.image;
  const hasCover = cover && !imgError;

  return (
    <div className="card album-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="card-media">
        {hasCover ? (
          <img src={cover} alt={name} onError={() => setImgError(true)} />
        ) : (
          <div className="cover-placeholder">
            <span>{name[0]}</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <h3>{name}</h3>
        {artist && <p>{artist}</p>}
        {album.year && <p className="album-year">{album.year}</p>}
      </div>
    </div>
  );
}

function RelatedArtistCard({ artist, onClick }) {
  const [imgError, setImgError] = React.useState(false);
  const name = artist.name || 'Artista';
  const image = artist.image;

  return (
    <div className="card related-artist-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="card-media">
        {image && !imgError ? (
          <img src={image} alt={name} onError={() => setImgError(true)} />
        ) : (
          <div className="cover-placeholder">
            <span>{name[0]}</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <h3>{name}</h3>
      </div>
    </div>
  );
}

function TrackCard({ track, onPlay }) {
  const [imgError, setImgError] = React.useState(false);
  const title = track.title || 'Sin titulo';
  const artist = track.artist || 'Desconocido';
  const cover = getTrackImage(track);
  const hasCover = cover && !imgError;

  return (
    <div className="card track-card" onClick={onPlay} role="button" tabIndex={0}>
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

export default function ArtistPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playTrack } = usePlayer();

  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  const [videos, setVideos] = useState([]);
  const [relatedArtists, setRelatedArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const artistId = id;

    // Fetch all data in parallel
    Promise.all([
      getArtist(artistId).catch(() => null),
      getArtistTop(artistId, 5).catch(() => ({ tracks: [] })),
      getArtistAlbums(artistId, 10).catch(() => ({ albums: [] })),
      getArtistTracks(artistId, 10).catch(() => ({ tracks: [] })),
    ])
      .then(([artistData, topData, albumsData, tracksData]) => {
        if (artistData?.artist) {
          setArtist(artistData.artist);
        }
        setTopTracks(topData?.tracks || []);
        setAlbums(albumsData?.albums || []);
        setAllTracks(tracksData?.tracks || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!artist?.name) return;

    Promise.all([
      searchTracks(`${artist.name} music video`, 8).catch(() => ({ tracks: [] })),
      search(artist.name, 6).catch(() => ({ artists: [], tracks: [] })),
    ]).then(([videosData, searchData]) => {
      setVideos(videosData?.tracks || []);
      setRelatedArtists(
        (searchData?.artists || [])
          .filter((a) => a.id !== artist.id)
          .slice(0, 5)
      );
    });
  }, [artist]);

  const handlePlayTrack = (track, playlist) => {
    if (getExternalId(track)) {
      playTrack(track, playlist || []);
      navigate('/room');
    }
  };

  if (loading) {
    return (
      <div className="page artist-page">
        <div className="loading">Cargando artista...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page artist-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page artist-page">
      {/* Artist Header */}
      <div className="artist-header">
        {artist?.image && (
          <div className="artist-image">
            <img src={artist.image} alt={artist.name} />
          </div>
        )}
        <div className="artist-info">
          <h1 className="artist-name">{artist?.name || 'Artista'}</h1>
          {artist?.description && (
            <p className="artist-description">{artist.description.slice(0, 300)}{artist.description.length > 300 ? '...' : ''}</p>
          )}
          {artist?.genres && artist.genres.length > 0 && (
            <div className="artist-genres">
              {artist.genres.map((g) => (
                <span key={g} className="genre-chip">{g}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top 5 */}
      {topTracks.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Top 5</h2>
          </div>
          <div className="top-tracks-list">
            {topTracks.map((track, i) => (
              <TrackListItem
                key={getExternalId(track) || `top-${i}`}
                track={track}
                index={i}
                onPlay={() => handlePlayTrack(track, topTracks)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Albumes</h2>
          </div>
          <div className="grid">
            {albums.map((album, i) => (
              <AlbumCard
                key={album.id || `album-${i}`}
                album={album}
                onClick={() => navigate(`/album/${album.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Tracks */}
      {allTracks.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Canciones</h2>
          </div>
          <div className="grid">
            {allTracks.map((track, i) => (
              <TrackCard
                key={getExternalId(track) || `track-${i}`}
                track={track}
                onPlay={() => handlePlayTrack(track, allTracks)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Videoclips */}
      {videos.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Videoclips</h2>
          </div>
          <div className="grid">
            {videos.map((track, i) => (
              <TrackCard
                key={getExternalId(track) || `video-${i}`}
                track={track}
                onPlay={() => handlePlayTrack(track, videos)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Related Artists */}
      {relatedArtists.length > 0 && (
        <section className="section">
          <div className="section-header">
            <h2>Recomendaciones de artistas</h2>
          </div>
          <div className="grid">
            {relatedArtists.map((a, i) => (
              <RelatedArtistCard
                key={a.id || `rel-${i}`}
                artist={a}
                onClick={() => navigate(`/artist/${a.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {topTracks.length === 0 && albums.length === 0 && allTracks.length === 0 && videos.length === 0 && relatedArtists.length === 0 && (
        <p className="empty">No se encontro contenido para este artista</p>
      )}
    </div>
  );
}
