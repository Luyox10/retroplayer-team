import React from 'react';
import './RoomObjects.css';

export default function PlaybackPanel({ tracks, current, onSelect }) {
  return (
    <div className="playback-panel">
      <h3>Lista</h3>
      <ul>
        {tracks.map((track, index) => (
          <li
            key={`${track.source}-${track.externalId || index}`}
            className={current?.externalId === track.externalId ? 'active-track' : ''}
            onClick={() => onSelect(track)}
          >
            {track.title} — {track.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}
