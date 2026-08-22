-- ============================================================
-- DARK Promoter Management — Eventbrite session cookie store
-- Single-row table holding the live Eventbrite session cookie used
-- for discount-write calls (see lib/eventbrite/api.ts::ebFetchSession).
-- Service-role access only — RLS enabled, no policies.
-- ============================================================

CREATE TABLE eventbrite_session (
  id           INTEGER     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cookie       TEXT        NOT NULL,
  refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refreshed_by TEXT
);

ALTER TABLE eventbrite_session ENABLE ROW LEVEL SECURITY;
-- No policies — only the service-role key (which bypasses RLS) can read/write this table.
