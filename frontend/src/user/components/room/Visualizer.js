import React, { useEffect, useRef } from 'react';
import './RoomObjects.css';

export default function Visualizer({ audio }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audio) return;

    const ctx = canvas.getContext('2d');
    const barCount = 32;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const isPlaying = !audio.paused;
      for (let i = 0; i < barCount; i++) {
        const h = isPlaying
          ? Math.random() * height * 0.8 + height * 0.1
          : height * 0.05;
        const x = i * barWidth;
        const y = height - h;
        ctx.fillStyle = '#e94560';
        ctx.fillRect(x, y, barWidth - 2, h);
      }
      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [audio]);

  return (
    <canvas
      ref={canvasRef}
      className="visualizer"
      width={400}
      height={120}
    />
  );
}
