import React from 'react';
import './RoomObjects.css';

export default function Turntable({ isPlaying }) {
  return (
    <div className="turntable">
      <div className={`vinyl ${isPlaying ? 'spinning' : ''}`} />
      <div className="tonearm" />
    </div>
  );
}
