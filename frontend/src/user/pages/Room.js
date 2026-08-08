import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFreeEnvironments, getEnvironmentById } from '../services/roomService';
import { getRecommended } from '../services/exploreService';
import { addHistory } from '../services/libraryService';
import Background from '../components/room/Background';
import Television from '../components/room/Television';
import Turntable from '../components/room/Turntable';
import Lamp from '../components/room/Lamp';
import Visualizer from '../components/room/Visualizer';
import BottomBar from '../components/room/BottomBar';
import PlaybackPanel from '../components/room/PlaybackPanel';
import YouTubePlayer from '../components/room/YouTubePlayer';
import '../components/room/RoomObjects.css';
import '../components/room/RoomEnhanced.css';

export default function Room() {
  const { user } = useAuth();
  const location = useLocation();
  const passedTrack = location.state?.track;
  const [environment, setEnvironment] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [current, setCurrent] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);
  const ytPlayerRef = useRef(null);

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

    getRecommended()
      .then((r) => {
        const list = r?.tracks || [];
        if (passedTrack) {
          const deduped = list.filter((t) => t.externalId !== passedTrack.externalId);
          setTracks([passedTrack, ...deduped]);
          setCurrent(passedTrack);
          setIsPlaying(true);
        } else {
          setTracks(list);
          if (list[0]) setCurrent(list[0]);
        }
      })
      .catch((err) => setError(err.message));
  }, [passedTrack]);

  useEffect(() => {
    if (!current) return;
    setDuration(current.duration || 0);
    setCurrentTime(0);
  }, [current]);

  useEffect(() => {
    if (!ytPlayerRef.current || !current || !isPlaying) return;
    const id = setInterval(() => {
      const t = ytPlayerRef.current.getCurrentTime();
      if (typeof t === 'number') setCurrentTime(t);
    }, 1000);
    return () => clearInterval(id);
  }, [current, isPlaying]);

  const onReady = (player) => {
    ytPlayerRef.current = player;
    if (isPlaying) {
      player.playVideo();
    }
  };

  const onPlay = () => {
    setIsPlaying(true);
    if (user && current) {
      try {
        addHistory({
          external_track_id: String(current.externalId),
          source: current.source,
          title: current.title,
          artist: current.artist,
          cover_url: current.thumbnail,
          duration_seconds: current.duration,
        });
      } catch (e) {
        // no-op
      }
    }
  };

  const onPause = () => {
    setIsPlaying(false);
  };

  const onEnded = () => {
    setIsPlaying(false);
    handleNext();
  };

  const onError = (err) => {
    setError(`YouTube player error: ${err}`);
  };

  const togglePlay = () => {
    setIsPlaying((p) => !p);
  };

  const handleSelect = (track) => {
    setCurrent(track);
    setIsPlaying(true);
  };

  const handleNext = () => {
    const index = tracks.findIndex((t) => t.externalId === current?.externalId);
    const next = tracks[(index + 1) % tracks.length];
    if (next) setCurrent(next);
  };

  const handlePrev = () => {
    const index = tracks.findIndex((t) => t.externalId === current?.externalId);
    const prev = tracks[(index - 1 + tracks.length) % tracks.length];
    if (prev) setCurrent(prev);
  };

  const handleSeek = (value) => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(value, true);
    }
    setCurrentTime(value);
  };

  const handleVolume = (value) => {
    setVolume(value);
  };

  if (error) return <div className="error">{error}</div>;

  return (
    <div className="room-page">
      <Background environment={environment} />
      <YouTubePlayer
        videoId={current?.videoId}
        isPlaying={isPlaying}
        volume={volume}
        onReady={onReady}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onError={onError}
      />
      <div className="room-scene">
        <Turntable isPlaying={isPlaying} />
        <Television track={current} />
        <Lamp />
        <Visualizer audio={null} />
      </div>
      <PlaybackPanel tracks={tracks} current={current} onSelect={handleSelect} />
      <BottomBar
        track={current}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolume}
      />
    </div>
  );
}
