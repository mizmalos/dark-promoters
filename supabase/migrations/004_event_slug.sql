-- ============================================================
-- DARK Promoter Management — event slug for readable admin URLs
-- slug: lowercase alphanumeric-only version of the event name (no
--       separators, e.g. "DARK TEST" -> "darktest"), used to route
--       /admin/events/[slug] instead of the raw event id. Backfilled
--       from existing event names below, with a numeric suffix
--       appended on collision (darktest, darktest2, ...).
-- ============================================================

ALTER TABLE events ADD COLUMN slug TEXT UNIQUE;

DO $$
DECLARE
  r RECORD;
  base_slug TEXT;
  candidate TEXT;
  suffix INT;
BEGIN
  FOR r IN SELECT id, name FROM events ORDER BY created_at LOOP
    base_slug := lower(regexp_replace(r.name, '[^a-zA-Z0-9]', '', 'g'));
    candidate := base_slug;
    suffix := 2;
    WHILE EXISTS (SELECT 1 FROM events WHERE slug = candidate) LOOP
      candidate := base_slug || suffix::text;
      suffix := suffix + 1;
    END LOOP;
    UPDATE events SET slug = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE events ALTER COLUMN slug SET NOT NULL;
