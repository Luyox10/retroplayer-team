import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { getTrackImage, getExternalId } from '../../shared/utils/contentHelpers';
import '../styles/Pages.css';

function TrackCard({ track }) {
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
      </div>
      <div className="card-body">
        <h3>{title}</h3>
        <p>{artist}</p>
      </div>
    </div>
  );
}

function ArtistCard({ artist }) {
  const [imgError, setImgError] = React.useState(false);
  const name = artist.name || 'Desconocido';
  const cover = artist.image;
  const hasCover = cover && !imgError;

  return (
    <div className="card artist-card" role="button" tabIndex={0}>
      <div className="card-media">
        {hasCover ? (
          <img src={cover} alt={name} onError={() => setImgError(true)} style={{ borderRadius: '50%' }} />
        ) : (
          <div className="cover-placeholder" style={{ borderRadius: '50%' }}>
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

/**
 * HomeSection - Reusable section component for the Home page.
 * 
 * Renders a section with a title and a grid of items.
 * Handles different item types (tracks, artists) via the section type.
 * 
 * Usage:
 *   <HomeSection section={{ type: 'genre', title: 'Rock', items: [...] }} />
 */
export default function HomeSection({ section }) {
  if (!section || !section.items || section.items.length === 0) {
    return null;
  }

  const renderItem = (item, index) => {
    if (section.type === 'artists') {
      return <ArtistCard key={item.id || `artist-${index}`} artist={item} />;
    }
    return <TrackCard key={getExternalId(item) || `item-${index}`} track={item} />;
  };

  return (
    <section className="section home-section">
      <div className="section-header">
        <h2>{section.title}</h2>
        {section.genre && (
          <span className="section-genre-badge">{section.genre}</span>
        )}
      </div>
      <div className="grid">
        {section.items.map(renderItem)}
      </div>
    </section>
  );
}
