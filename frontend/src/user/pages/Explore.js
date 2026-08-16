import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { search } from '../services/exploreService';
import { getArtist, getArtistTop } from '../services/contentService';
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

function selectOriginalArtist(artists, query) {
  if (!artists || artists.length === 0) return null;
  const q = (query || '').toLowerCase().trim();
  const scored = artists
    .filter((a) => a.name)
    .map((a) => {
      const name = a.name.trim();
      const lower = name.toLowerCase();
      let score = 0;
      if (!lower.endsWith(' - topic')) score += 10;
      if (lower === q) score += 100;
      else if (lower.includes(q)) score += 50;
      score -= name.length / 100;
      return { artist: a, score };
    });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].artist;
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCompact(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000_000) return `${(n / 1_000_000).toFixed(0)} M`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
  return String(n);
}

function ArtistHero({ artist, topTracks }) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [imgError, setImgError] = useState(false);
  const name = artist.name || 'Artista';
  const image = artist.image;

  const handleClick = () => {
    if (artist.id) navigate(`/artist/${artist.id}`);
  };

  const handleRandom = (e) => {
    e.stopPropagation();
    if (!topTracks?.length) return;
    const random = topTracks[Math.floor(Math.random() * topTracks.length)];
    if (getExternalId(random)) {
      playTrack(random, topTracks);
      navigate('/room');
    }
  };

  const handleMix = (e) => {
    e.stopPropagation();
    if (!topTracks?.length) return;
    const first = topTracks[0];
    if (getExternalId(first)) {
      playTrack(first, topTracks);
      navigate('/room');
    }
  };

  return (
    <div className="artist-hero" onClick={handleClick} role="button" tabIndex={0}>
      <div className="artist-hero-image">
        {image && !imgError ? (
          <img src={image} alt={name} onError={() => setImgError(true)} />
        ) : (
          <div className="cover-placeholder">
            <span>{name[0]}</span>
          </div>
        )}
      </div>
      <div className="artist-hero-info">
        <h3>{name}</h3>
        <p>
          Artista
          {artist.subscriberCount ? ` • ${formatCompact(artist.subscriberCount)} usuarios mensuales` : ''}
        </p>
        <div className="artist-hero-actions">
          <button className="btn" onClick={handleRandom}>Aleatorio</button>
          <button className="btn btn-secondary" onClick={handleMix}>Mix</button>
        </div>
      </div>
    </div>
  );
}

function TopTrackRow({ track, onPlay }) {
  const title = track.title || 'Sin titulo';
  const cover = getTrackImage(track);
  const duration = formatDuration(track.duration);
  const views = track.viewCount ? `${formatCompact(track.viewCount)} reproducciones` : '';

  return (
    <div className="top-track-row" onClick={onPlay} role="button" tabIndex={0}>
      {cover && <img className="top-track-cover" src={cover} alt={title} />}
      <div className="top-track-info">
        <strong>{title}</strong>
        <span>{['Canción', duration, views].filter(Boolean).join(' • ')}</span>
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
  const [artistTop, setArtistTop] = useState([]);
  const [artistDetails, setArtistDetails] = useState(null);

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

  const originalArtist = useMemo(
    () => selectOriginalArtist(searchResults?.artists, query),
    [searchResults?.artists, query]
  );

  useEffect(() => {
    if (!originalArtist?.id) {
      setArtistTop([]);
      setArtistDetails(null);
      return;
    }
    Promise.all([
      getArtist(originalArtist.id).catch(() => null),
      getArtistTop(originalArtist.id, 5).catch(() => ({ tracks: [] })),
    ]).then(([details, top]) => {
      setArtistDetails(details?.artist || null);
      setArtistTop(top?.tracks || []);
    });
  }, [originalArtist]);

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
          {originalArtist && (
            <>
              <div className="section-header">
                <h3>Artista</h3>
              </div>
              <div className="search-artist-hero">
                <ArtistHero artist={artistDetails || originalArtist} topTracks={artistTop} />
                <div className="search-artist-top">
                  <div className="section-header">
                    <h4>Top 5 canciones</h4>
                  </div>
                  {artistTop.length > 0 ? (
                    <div className="top-tracks-list">
                      {artistTop.map((t, i) => (
                        <TopTrackRow
                          key={getExternalId(t) || `top5-${i}`}
                          track={t}
                          onPlay={() => handlePlayTrack(t, artistTop)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="empty">Cargando top 5...</p>
                  )}
                </div>
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
