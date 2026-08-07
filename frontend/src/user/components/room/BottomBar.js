import React from 'react';
import './RoomObjects.css';

export default function BottomBar({ track, isPlaying, onPlayPause, onPrev, onNext, currentTime, duration, onSeek, volume, onVolumeChange }) {
  return (
    <div className="bottom-bar">
      <div className="bottom-info">
        {track ? (
          <>
            <strong>{track.title}</strong>
            <span>{track.artist}</span>
          </>
        ) : (
          <span>Selecciona una canción</span>
        )}
      </div>
      <div className="bottom-controls">
        <button onClick={onPrev} disabled={!track}>&lt;&lt;</button>
        <button onClick={onPlayPause} disabled={!track}>{isPlaying ? 'Pausa' : 'Play'}</button>
        <button onClick={onNext} disabled={!track}>&gt;&gt;</button>
      </div>
      <div className="bottom-progress">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 1}
          value={currentTime || 0}
          onChange={(e) => onSeek(Number(e.target.value))}
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
          onChange={(e) => onVolumeChange(Number(e.target.value))}
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
