import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import './RoomObjects.css';

export default function PlaybackPanel() {
  const { tracks, current, playTrack } = usePlayer();
  return (
    <div className="playback-panel">
      <h3>Lista</h3>
      <ul>
        {tracks.map((track, index) => (
          <li
            key={`${track.source}-${track.externalId || index}`}
            className={current?.externalId === track.externalId ? 'active-track' : ''}
            onClick={() => playTrack(track, tracks)}
          >
            {track.title} — {track.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}
