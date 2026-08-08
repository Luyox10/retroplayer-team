import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import './RoomObjects.css';

export default function Turntable() {
  const { isPlaying } = usePlayer();
  return (
    <div className="turntable">
      <div className={`vinyl ${isPlaying ? 'spinning' : ''}`} />
      <div className="tonearm" />
    </div>
  );
}
