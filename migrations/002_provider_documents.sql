-- Migration: add provider_documents table, supporting multiple documents per
-- provider (ID, CV, certificates, etc.) instead of a single id_document_url.
-- Run once: npm run db:migrate:documents

CREATE TYPE document_type AS ENUM ('id', 'cv', 'certificate', 'other');

CREATE TABLE provider_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  document_type document_type NOT NULL DEFAULT 'other',
  file_url      TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_provider_documents_provider ON provider_documents(provider_id);
