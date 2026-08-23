-- Migration: add a references field to providers, per the doc's provider
-- onboarding checklist ("References where appropriate"). Named references_info
-- rather than "references" to avoid any ambiguity with the SQL keyword.
-- Run once: npm run db:migrate:references

ALTER TABLE providers ADD COLUMN IF NOT EXISTS references_info TEXT;
