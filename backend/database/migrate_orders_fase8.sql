-- RetroPlayer — Migración órdenes para FASE 8

ALTER TABLE orders
  ADD COLUMN product_id INT UNSIGNED NOT NULL;

ALTER TABLE orders
  ADD FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE;

ALTER TABLE orders
  MODIFY COLUMN status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending';

INSERT IGNORE INTO products (name, type, description, price, currency, is_active, stock)
VALUES ('Premium Arcade', 'environment', 'Access to the premium arcade environment', 9.99, 'USD', TRUE, 100);
