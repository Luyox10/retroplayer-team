-- RetroPlayer — Migración track_videos para FASE 4
-- IMPORTANTE: Esta migración reemplaza la tabla track_videos para soportar
-- asociaciones directas por provider (jamendo/youtube) + external_track_id.
-- Si track_videos contiene datos reales, haz un backup antes de ejecutar.

DROP TABLE IF EXISTS track_videos;

CREATE TABLE track_videos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  external_track_id VARCHAR(128) NOT NULL,
  video_id VARCHAR(128) NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  duration INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  verified_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_track_video (provider, external_track_id, video_id),
  INDEX idx_track_videos_track (provider, external_track_id)
) DEFAULT CHARSET=utf8mb4;
