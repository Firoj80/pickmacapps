-- ============================================================
-- Migration 0018: Add featured_at timestamp for strict FIFO placement order
-- ============================================================

alter table apps add column if not exists featured_at timestamptz;

-- Backfill featured_at for existing featured apps based on featured_until or created_at
update apps
set featured_at = coalesce(featured_until - interval '7 days', created_at)
where editor_choice = true and featured_at is null;
