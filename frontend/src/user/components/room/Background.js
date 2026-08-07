import React from 'react';
import './RoomObjects.css';

export default function Background({ environment }) {
  const typeClass = environment?.type || 'default';
  return (
    <div className={`room-background room-background-${typeClass}`}>
      {environment?.name && <div className="room-name">{environment.name}</div>}
    </div>
  );
}
