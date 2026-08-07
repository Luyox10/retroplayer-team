import React, { useState } from 'react';
import './RoomObjects.css';

export default function Lamp() {
  const [on, setOn] = useState(true);
  return (
    <div className="lamp" onClick={() => setOn(!on)}>
      <div className="lamp-shade" />
      <div className={`lamp-light ${on ? 'lamp-on' : ''}`} />
      <div className="lamp-base" />
    </div>
  );
}
