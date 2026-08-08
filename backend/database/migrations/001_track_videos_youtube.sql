-- RetroPlayer — Migración FASE 2: Adaptar track_videos para videos de YouTube
-- IMPORTANTE: Ejecutar manualmente en TiDB/Render SOLO si la tabla ya existe.
-- Esta migración es segura (ADD COLUMN, no destructiva) y no elimina datos.

ALTER TABLE track_videos
  ADD COLUMN IF NOT EXISTS channel_title VARCHAR(255) DEFAULT NULL AFTER title,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMP NULL DEFAULT NULL AFTER thumbnail_url,
  ADD COLUMN IF NOT EXISTS embed_url VARCHAR(500) DEFAULT NULL AFTER video_id,
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active' AFTER is_verified;

-- Comentario sobre mapeo de campos para YouTube:
-- youtube_video_id  -> video_id
-- external_id       -> external_track_id
-- title             -> title
-- channel_title     -> channel_title
-- thumbnail_url     -> thumbnail_url
-- duration          -> duration
-- published_at      -> published_at
-- embed_url         -> embed_url
-- status            -> status
