import React, { useEffect, useRef } from 'react';
import './RoomObjects.css';

const onPlayRef = { current: null };
const onPauseRef = { current: null };
const onEndedRef = { current: null };
const onErrorRef = { current: null };
const onReadyRef = { current: null };
const volumeRef = { current: 1 };

export default function YouTubePlayer({
  videoId,
  isPlaying,
  volume,
  onReady,
  onPlay,
  onPause,
  onEnded,
  onError,
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const uniqueId = useRef(`yt-player-${Math.random().toString(36).substr(2, 9)}`);

  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;
  onEndedRef.current = onEnded;
  onErrorRef.current = onError;
  onReadyRef.current = onReady;
  volumeRef.current = volume;

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    } else if (window.YT.Player) {
      createPlayer();
    } else {
      const original = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
        if (typeof original === 'function') original();
      };
    }

    function createPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volumeRef.current * 100);
            if (onReadyRef.current) onReadyRef.current(event.target);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING && onPlayRef.current) onPlayRef.current();
            if (event.data === window.YT.PlayerState.PAUSED && onPauseRef.current) onPauseRef.current();
            if (event.data === window.YT.PlayerState.ENDED && onEndedRef.current) onEndedRef.current();
          },
          onError: (event) => {
            if (onErrorRef.current) onErrorRef.current(event.data);
          },
        },
      });
    }

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;
    playerRef.current.setVolume(volume * 100);
  }, [volume]);

  return <div ref={containerRef} id={uniqueId.current} className="youtube-player" />;
}
