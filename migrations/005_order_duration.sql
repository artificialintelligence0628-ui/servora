-- Migration: capture estimated job duration (in days), per the doc's
-- "magnitude of work... number of working days" billing description.
-- Nullable/additive — doesn't affect existing orders or pricing logic.
-- Run once: npm run db:migrate:duration

ALTER TABLE orders ADD COLUMN IF NOT EXISTS duration_days INTEGER;
