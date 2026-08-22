-- ============================================================
-- DARK Promoter Management — signup source + first-login welcome
-- source: distinguishes admin-created promoters from public self-serve
--         signups (/join), so admins can spot-check new public signups.
-- welcomed_at: null until a promoter's first dashboard view, then set —
--         gates the one-time first-login welcome block.
-- ============================================================

ALTER TABLE promoters
  ADD COLUMN source TEXT NOT NULL DEFAULT 'admin' CHECK (source IN ('admin', 'self_serve')),
  ADD COLUMN welcomed_at TIMESTAMPTZ;
