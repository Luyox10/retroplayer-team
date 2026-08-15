-- Migration: User Music Preferences
-- Phase: FASE 5 - Preferences, History & Personalization
-- Description: Creates table for tracking user music preferences (genre weights, favorite artists, etc.)

CREATE TABLE IF NOT EXISTS user_preferences (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  preference_type VARCHAR(50) NOT NULL COMMENT 'genre, artist, track',
  preference_key VARCHAR(100) NOT NULL COMMENT 'genre slug, artist ID, track ID',
  preference_value DECIMAL(5,2) DEFAULT 1.00 COMMENT 'Weight/score 0.00 - 10.00',
  play_count INT DEFAULT 0,
  last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY idx_user_pref (user_id, preference_type, preference_key),
  KEY idx_user_type (user_id, preference_type),
  KEY idx_value (preference_value),

  CONSTRAINT fk_user_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default genre preferences for existing users (rock-focused)
-- This is optional - new preferences will be built from user behavior
