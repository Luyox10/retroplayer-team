import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { addHistory } from '../services/libraryService';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const { user } = useAuth();
  const [current, setCurrent] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const playerRef = useRef(null);

  const playTrack = useCallback((track, playlist = []) => {
    setError(null);
    setCurrent(track);
    const deduped = playlist.filter((t) => t.externalId !== track.externalId);
    setTracks([track, ...deduped]);
    setCurrentTime(0);
    setDuration(track.duration || 0);
    setIsPlaying(true);
  }, []);

  const setPlayer = useCallback((player) => {
    playerRef.current = player;
    setReady(true);
  }, []);

  const play = useCallback(() => {
    setError(null);
    setIsPlaying(true);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
  }, []);

  const setVolume = useCallback((value) => {
    setVolumeState(value);
  }, []);

  const updateTime = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const seek = useCallback((value) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value, true);
    }
    setCurrentTime(value);
  }, []);

  const handleNext = useCallback(() => {
    if (!current || !tracks.length) return;
    const index = tracks.findIndex((t) => t.externalId === current.externalId);
    const nextIndex = (index + 1) % tracks.length;
    const next = tracks[nextIndex];
    if (next) {
      setCurrent(next);
      setCurrentTime(0);
      setDuration(next.duration || 0);
      setIsPlaying(true);
    }
  }, [current, tracks]);

  const handlePrev = useCallback(() => {
    if (!current || !tracks.length) return;
    const index = tracks.findIndex((t) => t.externalId === current.externalId);
    const prevIndex = (index - 1 + tracks.length) % tracks.length;
    const prev = tracks[prevIndex];
    if (prev) {
      setCurrent(prev);
      setCurrentTime(0);
      setDuration(prev.duration || 0);
      setIsPlaying(true);
    }
  }, [current, tracks]);

  const onPlay = useCallback(() => {
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
  }, [user, current]);

  const onPause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const onEnded = useCallback(() => {
    setIsPlaying(false);
    handleNext();
  }, [handleNext]);

  const onError = useCallback((err) => {
    setError(`YouTube player error: ${err}`);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (current) {
      setDuration(current.duration || 0);
      setCurrentTime(0);
      setReady(false);
    }
  }, [current]);

  useEffect(() => {
    if (!current || !isPlaying || !ready) return;
    const id = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const t = playerRef.current.getCurrentTime();
        if (typeof t === 'number') setCurrentTime(t);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [current, isPlaying, ready, playerRef, setCurrentTime]);

  const value = {
    current,
    tracks,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    playerRef,
    playTrack,
    play,
    pause,
    togglePlay,
    next: handleNext,
    prev: handlePrev,
    seek,
    setVolume,
    setPlayer,
    onPlay,
    onPause,
    onEnded,
    onError,
    updateTime,
    setTracks,
    setCurrent,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used inside PlayerProvider');
  }
  return ctx;
}
