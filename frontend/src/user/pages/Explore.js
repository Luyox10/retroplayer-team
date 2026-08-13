import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { searchTracks } from '../services/exploreService';
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

function GenreChip({ genre, active, onClick }) {
  return (
    <button
      className={`genre-chip ${active ? 'genre-chip-active' : ''}`}
      onClick={onClick}
      type="button"
    >
      {genre.name}
    </button>
  );
}

export default function Explore() {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [exploreData, setExploreData] = useState(null);
  const [genreTracks, setGenreTracks] = useState(null);
  const [activeGenre, setActiveGenre] = useState(null);
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
    searchTracks(query)
      .then((r) => setSearchResults(r?.tracks || []))
      .catch((err) => setError(err.message))
      .finally(() => setSearchLoading(false));
  }, [query]);

  const clearSearch = () => {
    setSearchResults(null);
    setQuery('');
  };

  const handleGenreClick = (genre) => {
    if (activeGenre === genre.id) {
      setActiveGenre(null);
      setGenreTracks(null);
      return;
    }
    setActiveGenre(genre.id);
    setGenreTracks(null);
    request(`/api/genres/${encodeURIComponent(genre.id)}/tracks?limit=10`)
      .then((r) => setGenreTracks(r?.tracks || []))
      .catch(() => setGenreTracks([]));
  };

  const handlePlayTrack = (track, playlist) => {
    if (getExternalId(track)) {
      playTrack(track, playlist || []);
      navigate('/room');
    }
  };

  const genres = exploreData?.genres || [];
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
          <div className="grid">
            {searchResults.length > 0
              ? searchResults.map((t, i) => (
                  <TrackCard key={getExternalId(t) || `sr-${i}`} track={t} />
                ))
              : <p className="empty">Sin resultados</p>
            }
          </div>
        </section>
      )}

      {/* If showing search results, don't show explore content */}
      {!searchResults && (
        <>
          {loading && <div className="loading">Cargando...</div>}

          {/* Genres */}
          {genres.length > 0 && (
            <section className="section">
              <div className="section-header">
                <h2>Generos</h2>
              </div>
              <div className="genre-chips">
                {genres.map((g) => (
                  <GenreChip
                    key={g.id}
                    genre={g}
                    active={activeGenre === g.id}
                    onClick={() => handleGenreClick(g)}
                  />
                ))}
              </div>

              {/* Genre tracks */}
              {activeGenre && genreTracks && (
                <div className="genre-tracks-list">
                  {genreTracks.length > 0
                    ? genreTracks.map((t, i) => (
                        <TrackListItem
                          key={getExternalId(t) || `gt-${i}`}
                          track={t}
                          index={i}
                          onPlay={() => handlePlayTrack(t, genreTracks)}
                        />
                      ))
                    : <p className="empty">Sin canciones para este genero</p>
                  }
                </div>
              )}
              {activeGenre && !genreTracks && (
                <div className="loading">Cargando canciones...</div>
              )}
            </section>
          )}

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
