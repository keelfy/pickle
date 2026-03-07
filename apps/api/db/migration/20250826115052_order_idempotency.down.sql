DROP INDEX IF EXISTS idx_orders_source_idempotency_key;

ALTER TABLE orders DROP COLUMN idempotency_key;
