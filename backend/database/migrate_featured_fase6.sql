-- RetroPlayer — Migración featured_tracks para FASE 6
-- Añade la columna category.

ALTER TABLE featured_tracks
  ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'recommended';

UPDATE featured_tracks SET category = 'recommended' WHERE category = '' OR category IS NULL;
