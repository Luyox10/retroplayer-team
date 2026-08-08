import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import YouTubePlayer from './YouTubePlayer';
import './RoomObjects.css';

export default function Television() {
  const { current, isPlaying, volume, onReady, onPlay, onPause, onEnded, onError } = usePlayer();

  return (
    <div className="television">
      <div className="tv-screen">
        {current ? (
          <>
            <YouTubePlayer
              videoId={current.videoId}
              isPlaying={isPlaying}
              volume={volume}
              onReady={onReady}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onEnded}
              onError={onError}
            />
            <div className="tv-track-title">{current.title}</div>
            <div className="tv-track-artist">{current.artist}</div>
          </>
        ) : (
          <div className="tv-placeholder">TV</div>
        )}
      </div>
      <div className="tv-stand" />
    </div>
  );
}
