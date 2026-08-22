-- Servora schema (PostgreSQL / Neon)
-- Run once against your database: psql "$DATABASE_URL" -f schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('student', 'provider', 'admin');
CREATE TYPE provider_status AS ENUM ('pending', 'verified', 'suspended');
CREATE TYPE service_type AS ENUM ('water', 'laundry', 'gas', 'repairs');
CREATE TYPE order_status AS ENUM (
  'requested',      -- student submitted, awaiting match
  'assigned',        -- a provider has been matched
  'accepted',        -- provider accepted
  'declined',         -- provider declined, needs rematch
  'on_the_way',
  'in_progress',
  'completed',
  'cancelled'
);
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- ---------------------------------------------------------------------
-- Users (students, providers, admins share one auth table)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role              user_role NOT NULL DEFAULT 'student',
  name              TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT,
  password_hash     TEXT NOT NULL,
  email_verified    BOOLEAN NOT NULL DEFAULT FALSE,
  verification_token TEXT,
  reset_token       TEXT,
  reset_token_expires TIMESTAMPTZ,
  avatar_url        TEXT,
  -- university location fields, only relevant for students
  university        TEXT,
  hostel            TEXT,
  block             TEXT,
  room              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Providers: extra profile info for users with role = 'provider'
-- ---------------------------------------------------------------------
CREATE TABLE providers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  services          service_type[] NOT NULL DEFAULT '{}',
  operating_area    TEXT,
  status            provider_status NOT NULL DEFAULT 'pending',
  id_document_url   TEXT,
  commission_rate   NUMERIC(5,2) NOT NULL DEFAULT 10.00, -- percent, negotiated per provider
  is_available      BOOLEAN NOT NULL DEFAULT TRUE,
  rating_avg        NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Service requests / orders
-- ---------------------------------------------------------------------
CREATE TABLE orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id       UUID REFERENCES providers(id) ON DELETE SET NULL,
  service_type      service_type NOT NULL,
  details           JSONB NOT NULL DEFAULT '{}', -- e.g. {quantity, problem, photoUrl, notes}
  university        TEXT,
  hostel            TEXT,
  block             TEXT,
  room              TEXT,
  preferred_time    TIMESTAMPTZ,
  status            order_status NOT NULL DEFAULT 'requested',
  price_amount      NUMERIC(10,2),      -- total charged to student, in GHS
  commission_amount NUMERIC(10,2),      -- Servora's cut
  provider_payout   NUMERIC(10,2),      -- provider's share
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_student ON orders(student_id);
CREATE INDEX idx_orders_provider ON orders(provider_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ---------------------------------------------------------------------
-- Payments (Paystack)
-- ---------------------------------------------------------------------
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  paystack_reference TEXT NOT NULL UNIQUE,
  amount            NUMERIC(10,2) NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pending',
  raw_response      JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  provider_id       UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating            SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Support tickets ("Need Help?")
-- ---------------------------------------------------------------------
CREATE TYPE ticket_category AS ENUM (
  'provider_no_show', 'wrong_order', 'damaged_items',
  'poor_repair', 'payment_problem', 'refund_issue', 'other'
);
CREATE TYPE ticket_status AS ENUM ('open', 'in_review', 'resolved');

CREATE TABLE support_tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category          ticket_category NOT NULL,
  message           TEXT NOT NULL,
  status            ticket_status NOT NULL DEFAULT 'open',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- In-app messaging (per order thread)
-- ---------------------------------------------------------------------
CREATE TABLE messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content            TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_order ON messages(order_id);
