-- ============================================================
-- DARK Promoter Management — Initial Schema
-- Australia/Melbourne timezone
-- ============================================================

-- Promoters
CREATE TABLE promoters (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        UNIQUE,
  phone       TEXT,
  instagram   TEXT,
  city        TEXT,
  state       TEXT        CHECK (state IN ('NSW', 'VIC', 'QLD', 'ACT')),
  notes       TEXT,
  slug        TEXT        UNIQUE NOT NULL,
  promo_code  TEXT        UNIQUE NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events
CREATE TABLE events (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  description          TEXT,
  venue                TEXT,
  city                 TEXT,
  state                TEXT        CHECK (state IN ('NSW', 'VIC', 'QLD', 'ACT')),
  event_date           TIMESTAMPTZ,
  eventbrite_event_id  TEXT        UNIQUE,
  eventbrite_url       TEXT        NOT NULL,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Promoter ↔ Event assignments
CREATE TABLE promoter_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_id   UUID        NOT NULL REFERENCES promoters(id)  ON DELETE CASCADE,
  event_id      UUID        NOT NULL REFERENCES events(id)     ON DELETE CASCADE,
  link_slug     TEXT        UNIQUE NOT NULL,
  tickets_sold  INTEGER     NOT NULL DEFAULT 0,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promoter_id, event_id)
);

-- Raw ticket sales from Eventbrite sync
CREATE TABLE ticket_sales (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  promoter_event_id       UUID        NOT NULL REFERENCES promoter_events(id) ON DELETE CASCADE,
  eventbrite_order_id     TEXT        NOT NULL,
  eventbrite_attendee_id  TEXT        NOT NULL,
  quantity                INTEGER     NOT NULL DEFAULT 1,
  status                  TEXT        NOT NULL CHECK (status IN ('valid', 'refunded', 'cancelled', 'comp', 'test')),
  order_date              TIMESTAMPTZ,
  synced_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(eventbrite_order_id, eventbrite_attendee_id)
);

-- User profiles (linked to Supabase Auth)
CREATE TABLE profiles (
  id           UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT  NOT NULL DEFAULT 'promoter' CHECK (role IN ('admin', 'promoter')),
  promoter_id  UUID  REFERENCES promoters(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sync audit logs
CREATE TABLE sync_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID        REFERENCES events(id) ON DELETE SET NULL,
  sync_type         TEXT        NOT NULL CHECK (sync_type IN ('manual', 'scheduled')),
  status            TEXT        NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_processed INTEGER,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE promoters      ENABLE ROW LEVEL SECURITY;
ALTER TABLE events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE promoter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_sales   ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs      ENABLE ROW LEVEL SECURITY;

-- Admins can read/write everything
CREATE POLICY "admins_all_promoters"       ON promoters       FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admins_all_events"          ON events          FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admins_all_promoter_events" ON promoter_events FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admins_all_ticket_sales"    ON ticket_sales    FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admins_all_sync_logs"       ON sync_logs       FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admins_all_profiles"        ON profiles        FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Promoters can read their own data
CREATE POLICY "promoters_own_profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "promoters_own_promoter"
  ON promoters FOR SELECT
  USING (id = (SELECT promoter_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "promoters_own_events"
  ON promoter_events FOR SELECT
  USING (promoter_id = (SELECT promoter_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "promoters_own_sales"
  ON ticket_sales FOR SELECT
  USING (promoter_event_id IN (
    SELECT id FROM promoter_events
    WHERE promoter_id = (SELECT promoter_id FROM profiles WHERE id = auth.uid())
  ));

-- Public can read active events (for short-link redirect)
CREATE POLICY "public_read_active_events"
  ON events FOR SELECT
  USING (is_active = true);

CREATE POLICY "public_read_active_assignments"
  ON promoter_events FOR SELECT
  USING (is_active = true);

CREATE POLICY "public_read_active_promoters"
  ON promoters FOR SELECT
  USING (is_active = true);

-- ============================================================
-- Helpers
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_promoters_updated_at      BEFORE UPDATE ON promoters       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at         BEFORE UPDATE ON events          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_promoter_events_updated_at BEFORE UPDATE ON promoter_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
