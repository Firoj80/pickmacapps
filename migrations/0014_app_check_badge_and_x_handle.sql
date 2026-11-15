-- ============================================================
-- Migration 0014: Add check_badge and x_handle to apps table
-- ============================================================

-- Feature 1: Admin can mark any app for automated badge checking
alter table apps add column if not exists check_badge boolean not null default false;

-- Feature 2: X (Twitter) handle associated with the app / creator
alter table apps add column if not exists x_handle text not null default '';

-- Feature 3: Backfill x_handle from submitter_x where available
update apps
set x_handle = coalesce(submitter_x, '')
where (x_handle is null or x_handle = '')
  and submitter_x is not null
  and submitter_x <> '';
