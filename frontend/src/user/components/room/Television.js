import React from 'react';
import './RoomObjects.css';

export default function Television({ track }) {
  return (
    <div className="television">
      <div className="tv-screen">
        {track ? (
          <>
            <div className="tv-track-title">{track.title}</div>
            <div className="tv-track-artist">{track.artist}</div>
          </>
        ) : (
          <div className="tv-placeholder">TV</div>
        )}
      </div>
      <div className="tv-stand" />
    </div>
  );
}
