import React, { useEffect, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import { getFreeEnvironments, getEnvironmentById } from '../services/roomService';
import { getRecommended } from '../services/exploreService';
import Background from '../components/room/Background';
import Television from '../components/room/Television';
import Turntable from '../components/room/Turntable';
import Lamp from '../components/room/Lamp';
import Visualizer from '../components/room/Visualizer';
import BottomBar from '../components/room/BottomBar';
import PlaybackPanel from '../components/room/PlaybackPanel';
import '../components/room/RoomObjects.css';
import '../components/room/RoomEnhanced.css';

export default function Room() {
  const { current, playTrack } = usePlayer();
  const [environment, setEnvironment] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getFreeEnvironments()
      .then((r) => {
        const env = r?.environments?.[0];
        if (env) {
          return getEnvironmentById(env.id);
        }
        return null;
      })
      .then((r) => {
        if (r?.environment) setEnvironment(r.environment);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (current) return;
    getRecommended()
      .then((r) => {
        const list = r?.tracks || [];
        if (list[0]) playTrack(list[0], list);
      })
      .catch((err) => setError(err.message));
  }, [current, playTrack]);

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="room-page">
      <Background environment={environment} />
      <div className="room-scene">
        <Turntable />
        <Television />
        <Lamp />
        <Visualizer audio={null} />
      </div>
      <PlaybackPanel />
      <BottomBar />
    </div>
  );
}
