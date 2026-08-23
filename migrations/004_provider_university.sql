-- Migration: add a structured university/campus column to providers, so
-- matching and admin reporting can work per-campus rather than only via
-- free-text operating_area. Nullable and additive — existing providers keep
-- working exactly as before (matching still falls back to operating_area).
-- Run once: npm run db:migrate:university

ALTER TABLE providers ADD COLUMN IF NOT EXISTS university TEXT;
