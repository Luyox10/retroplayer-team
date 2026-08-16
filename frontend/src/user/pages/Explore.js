import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { search } from '../services/exploreService';
import { getTrackImage, getExternalId } from '../../shared/utils/contentHelpers';
import { request } from '../../shared/utils/api';
import '../styles/Pages.css';

function TrackCard({ track, index }) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [imgError, setImgError] = React.useState(false);
  const title = track.title || 'Sin titulo';
  const artist = track.artist || 'Desconocido';
  const cover = getTrackImage(track);
  const hasCover = cover && !imgError;

  const handlePlay = () => {
    if (getExternalId(track)) {
      playTrack(track);
      navigate('/room');
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
        {typeof index === 'number' && (
          <div className="track-rank">{index + 1}</div>
        )}
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        <p>{artist}</p>
      </div>
    </div>
  );
}

function TrackListItem({ track, index, onPlay }) {
  const title = track.title || 'Sin titulo';
  const artist = track.artist || 'Desconocido';
  const cover = getTrackImage(track);

  return (
    <div className="track-list-item" onClick={onPlay} role="button" tabIndex={0}>
      <span className="track-list-rank">{index + 1}</span>
      {cover && <img className="track-list-cover" src={cover} alt={title} />}
      <div className="track-list-info">
        <strong>{title}</strong>
        <span>{artist}</span>
      </div>
    </div>
  );
}

function ArtistCard({ artist }) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const name = artist.name || 'Artista';
  const image = artist.image;

  const handleClick = () => {
    if (artist.id) {
      navigate(`/artist/${encodeURIComponent(artist.id)}`);
    }
  };

  return (
    <div className="card artist-card" onClick={handleClick} role="button" tabIndex={0}>
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

export default function Explore() {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [exploreData, setExploreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    request('/api/explore/page')
      .then((data) => setExploreData(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchLoading(true);
    setError(null);
    setSearchResults(null);
    search(query)
      .then((r) => setSearchResults(r))
      .catch((err) => setError(err.message))
      .finally(() => setSearchLoading(false));
  }, [query]);

  const clearSearch = () => {
    setSearchResults(null);
    setQuery('');
  };

  const handlePlayTrack = (track, playlist) => {
    if (getExternalId(track)) {
      playTrack(track, playlist || []);
      navigate('/room');
    }
  };

  const sections = exploreData?.sections || [];
  const featured = exploreData?.featured || [];

  return (
    <div className="page explore-page">
      <h2>Explorar</h2>

      {/* Search */}
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="input"
          type="text"
          placeholder="Buscar artistas, canciones o albumes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" type="submit" disabled={searchLoading}>
          {searchLoading ? 'Buscando...' : 'Buscar'}
        </button>
        {searchResults && (
          <button className="btn btn-secondary" type="button" onClick={clearSearch}>
            Limpiar
          </button>
        )}
      </form>

      {error && <div className="error">{error}</div>}

      {/* Search Results */}
      {searchResults && (
        <section className="section">
          <div className="section-header">
            <h2>Resultados para "{query}"</h2>
          </div>

          {/* Artists */}
          {searchResults.artists?.length > 0 && (
            <>
              <div className="section-header">
                <h3>Artistas</h3>
              </div>
              <div className="grid">
                {searchResults.artists.map((artist, i) => (
                  <ArtistCard key={artist.id || `artist-${i}`} artist={artist} />
                ))}
              </div>
            </>
          )}

          {/* Tracks */}
          {searchResults.tracks?.length > 0 && (
            <>
              <div className="section-header">
                <h3>Canciones</h3>
              </div>
              <div className="grid">
                {searchResults.tracks.map((t, i) => (
                  <TrackCard key={getExternalId(t) || `sr-${i}`} track={t} />
                ))}
              </div>
            </>
          )}

          {!searchResults.tracks?.length && !searchResults.artists?.length && (
            <p className="empty">Sin resultados</p>
          )}
        </section>
      )}

      {/* If showing search results, don't show explore content */}
      {!searchResults && (
        <>
          {loading && <div className="loading">Cargando...</div>}

          {/* (géneros eliminados) */}

          {/* Top 10 and Trending sections */}
          {sections.map((section, idx) => (
            <section key={`${section.type}-${idx}`} className="section">
              <div className="section-header">
                <h2>{section.title}</h2>
              </div>
              {section.type === 'top' ? (
                <div className="top-tracks-list">
                  {section.items.map((t, i) => (
                    <TrackListItem
                      key={getExternalId(t) || `top-${i}`}
                      track={t}
                      index={i}
                      onPlay={() => handlePlayTrack(t, section.items)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid">
                  {section.items.map((t, i) => (
                    <TrackCard key={getExternalId(t) || `sec-${i}`} track={t} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Featured */}
          {featured.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2>Contenido Destacado</h2>
              </div>
              <div className="grid">
                {featured.map((t, i) => (
                  <TrackCard key={getExternalId(t) || `feat-${i}`} track={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
