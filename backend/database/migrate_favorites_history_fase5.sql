-- RetroPlayer — Migración play_history para FASE 5
-- Añade listened_seconds, completed y updated_at.
-- Si play_history ya existe con el esquema antiguo, ejecuta esto.

ALTER TABLE play_history
  ADD COLUMN IF NOT EXISTS listened_seconds INT UNSIGNED DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
