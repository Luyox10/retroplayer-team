import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import { getExternalId, isSameTrack } from '../../../shared/utils/contentHelpers';
import './RoomObjects.css';

export default function PlaybackPanel() {
  const { tracks, current, playTrack } = usePlayer();
  return (
    <div className="playback-panel">
      <h3>Lista</h3>
      <ul>
        {tracks.map((track, index) => (
          <li
            key={`${getExternalId(track) || index}`}
            className={isSameTrack(current, track) ? 'active-track' : ''}
            onClick={() => playTrack(track, tracks)}
          >
            {track.title} — {track.artist}
          </li>
        ))}
      </ul>
    </div>
  );
}
