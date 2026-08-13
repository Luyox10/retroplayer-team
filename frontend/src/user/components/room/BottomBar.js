import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { addFavorite } from '../../services/libraryService';
import { getExternalId, getTrackImage } from '../../../shared/utils/contentHelpers';
import './RoomObjects.css';

export default function BottomBar() {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    prev,
    next,
    seek,
    setVolume,
  } = usePlayer();

  const handleFavorite = async () => {
    if (!current) return;
    try {
      await addFavorite({
        external_track_id: String(getExternalId(current)),
        source: current.source?.provider || 'youtube',
        title: current.title,
        artist: current.artist,
        cover_url: getTrackImage(current),
      });
    } catch (e) {
      // no-op
    }
  };

  return (
    <div className="bottom-bar">
      <div className="bottom-info">
        {current ? (
          <>
            <strong>{current.title}</strong>
            <span>{current.artist}</span>
          </>
        ) : (
          <span>Selecciona una canción</span>
        )}
      </div>
      <div className="bottom-controls">
        <button onClick={prev} disabled={!current}>&lt;&lt;</button>
        <button onClick={togglePlay} disabled={!current}>{isPlaying ? 'Pausa' : 'Play'}</button>
        <button onClick={next} disabled={!current}>&gt;&gt;</button>
        <button onClick={handleFavorite} disabled={!current}>♥</button>
      </div>
      <div className="bottom-progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime || 0}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span>{formatTime(duration)}</span>
      </div>
      <div className="bottom-volume">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
