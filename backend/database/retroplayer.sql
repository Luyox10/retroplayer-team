-- RetroPlayer — Esquema completo para TiDB Cloud / MySQL 8
-- FASE 0: Base de datos para la beta
--
-- NOTAS IMPORTANTES:
--  * No ejecuta DROP TABLE; usa CREATE TABLE IF NOT EXISTS.
--  * No contiene contraseñas reales ni datos de usuarios.
--  * Contiene catálogos iniciales seguros (ambientes y objetos gratuitos).
--  * Está diseñado para ser ejecutado manualmente, no por la aplicación.
--
-- ORDEN DE CREACION:
--  1. Tablas base sin dependencias externas:
--     users, environments, room_objects, products, api_cache
--  2. Tablas que dependen de users:
--     sessions, favorite_tracks, play_history, featured_tracks, orders, reports, admin_logs
--  3. Tablas que dependen de featured_tracks:
--     track_videos
--  4. Tablas que dependen de environments + room_objects:
--     environment_objects
--  5. Tablas que dependen de users + products:
--     user_assets
--
-- COMO EJECUTAR MANUALMENTE EN TIDB:
--  Opcion A — Consola SQL de TiDB Cloud:
--    1. Ve al panel de TiDB Cloud > tu cluster > SQL Editor.
--    2. Selecciona la base de datos `retroplayer_dev` (o la que tengas).
--    3. Pega el contenido de este archivo y ejecútalo.
--
--  Opcion B — mysql CLI (requiere certificado TLS):
--    mysql -h <DB_HOST> -P 4000 -u <DB_USER> -p <DB_NAME> --ssl-mode=REQUIRED < backend/database/retroplayer.sql
--
--  Opcion C — MySQL Workbench / DBeaver:
--    Conecta con el host, puerto, usuario y contraseña de TiDB Cloud,
--    asegúrate de activar SSL, selecciona la base de datos y ejecuta el script.

SET NAMES utf8mb4;

-- ============================================================
-- 1. TABLAS BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(64) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
  status ENUM('active', 'suspended', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_username (username),
  UNIQUE KEY unique_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS environments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  description TEXT,
  type ENUM('room', 'studio', 'lounge', 'arcade') DEFAULT 'room',
  status ENUM('draft', 'published', 'hidden') DEFAULT 'draft',
  scene_data JSON,
  image_url VARCHAR(500) DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  price DECIMAL(10, 2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_environment_name (name),
  INDEX idx_environments_status (status, is_active),
  INDEX idx_environments_free (is_free)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS room_objects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  type ENUM('television', 'turntable', 'lamp', 'visualizer', 'speaker', 'furniture', 'decoration') NOT NULL,
  description TEXT,
  status ENUM('draft', 'published', 'hidden') DEFAULT 'draft',
  price DECIMAL(10, 2) DEFAULT 0.00,
  is_free BOOLEAN DEFAULT FALSE,
  model_url VARCHAR(500) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  config JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_room_objects_type (type),
  INDEX idx_room_objects_status (status, is_active)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  type ENUM('environment', 'object', 'subscription', 'bundle') NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency CHAR(3) DEFAULT 'USD',
  image_url VARCHAR(500) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  stock INT DEFAULT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_type (type),
  INDEX idx_products_active (is_active)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS api_cache (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL,
  cache_value JSON,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cache_key (cache_key),
  INDEX idx_api_cache_expires (expires_at)
) DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. TABLAS QUE DEPENDEN DE users
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY unique_session_token (token),
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_expires (expires_at)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS favorite_tracks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  external_track_id VARCHAR(128) NOT NULL,
  source ENUM('jamendo', 'youtube') NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  artist VARCHAR(255) DEFAULT NULL,
  cover_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_favorite (user_id, external_track_id, source),
  INDEX idx_favorite_tracks_user (user_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS play_history (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  external_track_id VARCHAR(128) NOT NULL,
  source ENUM('jamendo', 'youtube') NOT NULL,
  title VARCHAR(255) DEFAULT NULL,
  artist VARCHAR(255) DEFAULT NULL,
  cover_url VARCHAR(500) DEFAULT NULL,
  duration_seconds INT UNSIGNED DEFAULT NULL,
  listened_seconds INT UNSIGNED DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX idx_play_history_user (user_id),
  INDEX idx_play_history_played_at (played_at)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS featured_tracks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  external_track_id VARCHAR(128) NOT NULL,
  source ENUM('jamendo', 'youtube') NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'recommended',
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NOT NULL,
  cover_url VARCHAR(500) DEFAULT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_featured_tracks_active (active),
  INDEX idx_featured_tracks_category (category, active, position)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(64) DEFAULT NULL,
  payment_reference VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_user_id INT UNSIGNED DEFAULT NULL,
  target_type ENUM('user', 'track', 'environment', 'object', 'video') NOT NULL,
  target_id VARCHAR(128) NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('open', 'reviewed', 'resolved', 'dismissed') DEFAULT 'open',
  reviewed_by INT UNSIGNED DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_user_id) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_reports_status (status),
  INDEX idx_reports_reporter (reporter_user_id)
) DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_user_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) DEFAULT NULL,
  target_id VARCHAR(128) DEFAULT NULL,
  details JSON,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES users (id) ON DELETE SET NULL,
  INDEX idx_admin_logs_user (admin_user_id),
  INDEX idx_admin_logs_target (target_type, target_id),
  INDEX idx_admin_logs_created (created_at)
) DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 3. TABLAS DE ASOCIACION DE VIDEOS A PISTAS EXTERNAS
-- ============================================================

CREATE TABLE IF NOT EXISTS track_videos (
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

-- ============================================================
-- 4. TABLAS QUE DEPENDEN DE environments + room_objects
-- ============================================================

CREATE TABLE IF NOT EXISTS environment_objects (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  environment_id INT UNSIGNED NOT NULL,
  object_id INT UNSIGNED NOT NULL,
  position_x DECIMAL(10, 3) DEFAULT 0,
  position_y DECIMAL(10, 3) DEFAULT 0,
  position_z DECIMAL(10, 3) DEFAULT 0,
  rotation_x DECIMAL(10, 3) DEFAULT 0,
  rotation_y DECIMAL(10, 3) DEFAULT 0,
  rotation_z DECIMAL(10, 3) DEFAULT 0,
  scale_x DECIMAL(10, 3) DEFAULT 1,
  scale_y DECIMAL(10, 3) DEFAULT 1,
  scale_z DECIMAL(10, 3) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (environment_id) REFERENCES environments (id) ON DELETE CASCADE,
  FOREIGN KEY (object_id) REFERENCES room_objects (id) ON DELETE CASCADE,
  UNIQUE KEY unique_env_object (environment_id, object_id),
  INDEX idx_environment_objects_env (environment_id)
) DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 5. TABLAS QUE DEPENDEN DE users + products
-- ============================================================

CREATE TABLE IF NOT EXISTS user_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED DEFAULT 1,
  acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_product (user_id, product_id),
  INDEX idx_user_assets_user (user_id)
) DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- CATÁLOGOS INICIALES SEGUROS
-- ============================================================

-- Ambientes gratuitos de inicio
INSERT INTO environments (name, description, type, scene_data, price, is_free, is_active)
VALUES
  ('Retro Room', 'Sala de estar con estética retro, colores cálidos y una radio vintage.', 'room', '{"theme":"retro","wallColor":"#E07A5F","floorColor":"#3D405B"}', 0.00, TRUE, TRUE),
  ('Lo-Fi Studio', 'Espacio íntimo para escuchar lo-fi con luces tenues y vinilos.', 'studio', '{"theme":"lofi","wallColor":"#81B29A","floorColor":"#F4F1DE"}', 0.00, TRUE, TRUE);

-- Televisores
INSERT INTO room_objects (name, type, description, price, is_free, model_url, image_url, is_active)
VALUES
  ('CRT TV', 'television', 'Televisor antiguo de tubo con buen sabor vintage.', 0.00, TRUE, NULL, NULL, TRUE),
  ('Vintage TV', 'television', 'Televisor clásico de los 70.', 0.00, TRUE, NULL, NULL, TRUE),
  ('Plasma TV', 'television', 'Pantalla plana de los 2000, detalle modernista.', 0.00, TRUE, NULL, NULL, TRUE);

-- Tocadiscos
INSERT INTO room_objects (name, type, description, price, is_free, model_url, image_url, is_active)
VALUES
  ('Classic Turntable', 'turntable', 'Tocadiscos clásico de madera y latón.', 0.00, TRUE, NULL, NULL, TRUE),
  ('Portable Record Player', 'turntable', 'Tocadiscos portátil para escuchar en cualquier lugar.', 0.00, TRUE, NULL, NULL, TRUE),
  ('DJ Deck', 'turntable', 'Bandeja de DJ profesional con control de pitch.', 0.00, TRUE, NULL, NULL, TRUE);

-- Lámparas
INSERT INTO room_objects (name, type, description, price, is_free, model_url, image_url, is_active)
VALUES
  ('Neon Lamp', 'lamp', 'Lámpara de neón con tonos rosa y azul.', 0.00, TRUE, NULL, NULL, TRUE),
  ('Desk Lamp', 'lamp', 'Lámpara de escritorio ajustable.', 0.00, TRUE, NULL, NULL, TRUE),
  ('Floor Lamp', 'lamp', 'Lámpara de pie para iluminar rincones.', 0.00, TRUE, NULL, NULL, TRUE),
  ('Pixel Lamp', 'lamp', 'Lámpara decorativa con estética pixel art.', 0.00, TRUE, NULL, NULL, TRUE);
