import React, { useState } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import './RoomObjects.css';

export default function Lamp() {
  const [on, setOn] = useState(true);
  const { isPlaying } = usePlayer();
  const isOn = on && isPlaying;

  return (
    <div className="lamp" onClick={() => setOn(!on)}>
      <div className="lamp-shade" />
      <div className={`lamp-light ${isOn ? 'lamp-on' : ''}`} />
      <div className="lamp-base" />
    </div>
  );
}
