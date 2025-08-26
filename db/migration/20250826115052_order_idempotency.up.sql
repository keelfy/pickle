ALTER TABLE orders ADD COLUMN idempotency_key text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_orders_source_idempotency_key ON orders (source, idempotency_key);