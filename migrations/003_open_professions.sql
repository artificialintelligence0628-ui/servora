-- Migration: open up service_type from a fixed enum (water/laundry/gas/repairs)
-- to free text, so providers can offer ANY profession (tutor, hairdresser,
-- plumber, etc.) for general public use, not just the 4 University services.
-- Run once: npm run db:migrate:professions

ALTER TABLE providers ALTER COLUMN services TYPE TEXT[] USING services::TEXT[];
ALTER TABLE providers ALTER COLUMN services SET DEFAULT '{}';

ALTER TABLE orders ALTER COLUMN service_type TYPE TEXT USING service_type::TEXT;

DROP TYPE IF EXISTS service_type;
