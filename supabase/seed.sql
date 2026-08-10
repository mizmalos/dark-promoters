-- ============================================================
-- DARK Promoter Management — Seed Data (Dev / MVP)
-- ============================================================

-- Promoters
INSERT INTO promoters (id, name, email, phone, instagram, city, state, slug, promo_code, notes) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Claire Martin',  'claire@example.com', '0411 000 001', '@clairemdark',  'Melbourne', 'VIC', 'claire', 'CLAIRE', 'Top performer, brings large groups.'),
  ('11111111-0000-0000-0000-000000000002', 'Jake Torres',    'jake@example.com',   '0411 000 002', '@jaketdark',    'Sydney',    'NSW', 'jake',   'JAKE',   'Strong social media presence.'),
  ('11111111-0000-0000-0000-000000000003', 'Maya Singh',     'maya@example.com',   '0411 000 003', '@mayadark',     'Brisbane',  'QLD', 'maya',   'MAYA',   'Great reach in QLD market.');

-- Events
INSERT INTO events (id, name, description, venue, city, state, event_date, eventbrite_event_id, eventbrite_url) VALUES
  (
    '22222222-0000-0000-0000-000000000001',
    '240KMH F2F Melbourne — September 2026',
    'The biggest DARK event of the year hits Melbourne.',
    'Festival Hall',
    'Melbourne', 'VIC',
    '2026-09-20 20:00:00+10',
    '1988138282121',
    'https://www.eventbrite.com.au/e/240kmh-f2f-melbourne-september-2026-tickets-1988138282121'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    '240KMH F2F Sydney — October 2026',
    'DARK comes to Sydney for one night only.',
    'Hordern Pavilion',
    'Sydney', 'NSW',
    '2026-10-18 20:00:00+11',
    '9999999999999',
    'https://www.eventbrite.com.au/e/240kmh-f2f-sydney-october-2026-tickets-9999999999999'
  );

-- Assignments (promoter_events)
-- Claire: both events
INSERT INTO promoter_events (id, promoter_id, event_id, link_slug) VALUES
  ('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'claire-240kmh'),
  ('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002', 'claire-f2f-syd');

-- Jake: Melbourne only
INSERT INTO promoter_events (id, promoter_id, event_id, link_slug) VALUES
  ('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'jake-240kmh');

-- Maya: both events
INSERT INTO promoter_events (id, promoter_id, event_id, link_slug) VALUES
  ('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'maya-240kmh'),
  ('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'maya-f2f-syd');

-- ============================================================
-- Mock ticket sales
-- Demonstrates: multi-ticket orders, invalid statuses, dedup
-- ============================================================

-- Claire / Melbourne (valid: 14 tickets across 6 orders)
INSERT INTO ticket_sales (promoter_event_id, eventbrite_order_id, eventbrite_attendee_id, quantity, status, order_date) VALUES
  ('33333333-0000-0000-0000-000000000001', 'ORD-001', 'ATT-001-1', 3, 'valid',     '2026-07-01 10:00:00+10'),
  ('33333333-0000-0000-0000-000000000001', 'ORD-001', 'ATT-001-2', 3, 'valid',     '2026-07-01 10:00:00+10'), -- same order, multi-ticket
  ('33333333-0000-0000-0000-000000000001', 'ORD-002', 'ATT-002-1', 2, 'valid',     '2026-07-05 14:00:00+10'),
  ('33333333-0000-0000-0000-000000000001', 'ORD-003', 'ATT-003-1', 1, 'valid',     '2026-07-10 09:00:00+10'),
  ('33333333-0000-0000-0000-000000000001', 'ORD-004', 'ATT-004-1', 2, 'valid',     '2026-07-15 11:00:00+10'),
  ('33333333-0000-0000-0000-000000000001', 'ORD-005', 'ATT-005-1', 3, 'valid',     '2026-07-20 16:00:00+10'),
  ('33333333-0000-0000-0000-000000000001', 'ORD-006', 'ATT-006-1', 2, 'refunded',  '2026-07-22 08:00:00+10'), -- refund — does not count
  ('33333333-0000-0000-0000-000000000001', 'ORD-007', 'ATT-007-1', 1, 'comp',      '2026-07-25 12:00:00+10'), -- comp — does not count
  ('33333333-0000-0000-0000-000000000001', 'ORD-008', 'ATT-008-1', 1, 'test',      '2026-07-26 09:00:00+10'); -- test — does not count

-- Claire / Sydney (valid: 7 tickets)
INSERT INTO ticket_sales (promoter_event_id, eventbrite_order_id, eventbrite_attendee_id, quantity, status, order_date) VALUES
  ('33333333-0000-0000-0000-000000000002', 'ORD-101', 'ATT-101-1', 4, 'valid',    '2026-07-08 13:00:00+10'),
  ('33333333-0000-0000-0000-000000000002', 'ORD-102', 'ATT-102-1', 2, 'valid',    '2026-07-12 15:00:00+10'),
  ('33333333-0000-0000-0000-000000000002', 'ORD-103', 'ATT-103-1', 1, 'valid',    '2026-07-18 10:00:00+10'),
  ('33333333-0000-0000-0000-000000000002', 'ORD-104', 'ATT-104-1', 1, 'cancelled','2026-07-19 11:00:00+10'); -- cancelled — does not count

-- Jake / Melbourne (valid: 5 tickets)
INSERT INTO ticket_sales (promoter_event_id, eventbrite_order_id, eventbrite_attendee_id, quantity, status, order_date) VALUES
  ('33333333-0000-0000-0000-000000000003', 'ORD-201', 'ATT-201-1', 2, 'valid',    '2026-07-03 11:00:00+10'),
  ('33333333-0000-0000-0000-000000000003', 'ORD-202', 'ATT-202-1', 3, 'valid',    '2026-07-14 14:00:00+10');

-- Maya / Melbourne (valid: 22 tickets — crosses 2 milestones)
INSERT INTO ticket_sales (promoter_event_id, eventbrite_order_id, eventbrite_attendee_id, quantity, status, order_date) VALUES
  ('33333333-0000-0000-0000-000000000004', 'ORD-301', 'ATT-301-1', 5, 'valid',    '2026-07-02 10:00:00+10'),
  ('33333333-0000-0000-0000-000000000004', 'ORD-302', 'ATT-302-1', 5, 'valid',    '2026-07-06 12:00:00+10'),
  ('33333333-0000-0000-0000-000000000004', 'ORD-303', 'ATT-303-1', 4, 'valid',    '2026-07-11 09:00:00+10'),
  ('33333333-0000-0000-0000-000000000004', 'ORD-304', 'ATT-304-1', 4, 'valid',    '2026-07-16 15:00:00+10'),
  ('33333333-0000-0000-0000-000000000004', 'ORD-305', 'ATT-305-1', 4, 'valid',    '2026-07-21 11:00:00+10');

-- Maya / Sydney (valid: 3 tickets)
INSERT INTO ticket_sales (promoter_event_id, eventbrite_order_id, eventbrite_attendee_id, quantity, status, order_date) VALUES
  ('33333333-0000-0000-0000-000000000005', 'ORD-401', 'ATT-401-1', 3, 'valid',    '2026-07-09 14:00:00+10');

-- ============================================================
-- Update cached tickets_sold counts
-- ============================================================
UPDATE promoter_events SET tickets_sold = 14 WHERE id = '33333333-0000-0000-0000-000000000001'; -- Claire / Melbourne
UPDATE promoter_events SET tickets_sold = 7  WHERE id = '33333333-0000-0000-0000-000000000002'; -- Claire / Sydney
UPDATE promoter_events SET tickets_sold = 5  WHERE id = '33333333-0000-0000-0000-000000000003'; -- Jake / Melbourne
UPDATE promoter_events SET tickets_sold = 22 WHERE id = '33333333-0000-0000-0000-000000000004'; -- Maya / Melbourne
UPDATE promoter_events SET tickets_sold = 3  WHERE id = '33333333-0000-0000-0000-000000000005'; -- Maya / Sydney

-- Sync log entry for mock data load
INSERT INTO sync_logs (event_id, sync_type, status, records_processed) VALUES
  ('22222222-0000-0000-0000-000000000001', 'manual', 'success', 9),
  ('22222222-0000-0000-0000-000000000002', 'manual', 'success', 4);
