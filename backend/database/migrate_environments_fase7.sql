-- RetroPlayer — Migración ambientes y objetos para FASE 7

ALTER TABLE environments
  ADD COLUMN status ENUM('draft','published','hidden') DEFAULT 'draft',
  ADD COLUMN image_url VARCHAR(500) DEFAULT NULL,
  ADD COLUMN thumbnail_url VARCHAR(500) DEFAULT NULL,
  ADD COLUMN created_by INT UNSIGNED DEFAULT NULL;

ALTER TABLE room_objects
  ADD COLUMN status ENUM('draft','published','hidden') DEFAULT 'draft',
  ADD COLUMN config JSON,
  ADD COLUMN created_by INT UNSIGNED DEFAULT NULL,
  MODIFY COLUMN type ENUM('television', 'turntable', 'lamp', 'visualizer', 'speaker', 'furniture', 'decoration') NOT NULL;

-- Dos ambientes gratuitos iniciales
INSERT IGNORE INTO environments (name, description, type, status, image_url, thumbnail_url, is_free, is_active)
VALUES
  ('Retro Living Room', 'A cozy retro living room for listening sessions.', 'room', 'published', 'https://example.com/living.jpg', 'https://example.com/living-thumb.jpg', TRUE, TRUE),
  ('Neon Arcade', 'An arcade room with neon lights and classic vibes.', 'arcade', 'published', 'https://example.com/arcade.jpg', 'https://example.com/arcade-thumb.jpg', TRUE, TRUE);

-- Objetos iniciales gratuitos
INSERT IGNORE INTO room_objects (name, type, status, image_url, config, is_free, is_active)
VALUES
  ('Television', 'television', 'published', 'https://example.com/tv.jpg', '{"width":100,"height":60}', TRUE, TRUE),
  ('Turntable', 'turntable', 'published', 'https://example.com/turntable.jpg', '{"rpm":33}', TRUE, TRUE),
  ('Lamp', 'lamp', 'published', 'https://example.com/lamp.jpg', '{"color":"#ffcc00"}', TRUE, TRUE),
  ('Visualizer', 'visualizer', 'published', 'https://example.com/visualizer.jpg', '{"style":"bars"}', TRUE, TRUE);
