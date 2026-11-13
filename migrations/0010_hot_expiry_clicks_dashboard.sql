-- ============================================================
-- Migration 0010: Hot expiry, click tracking, dashboard token,
--                 upvote system
-- ============================================================

-- Feature 1: Hot tag auto-expiry (30 days)
alter table apps add column if not exists hot_marked_at timestamptz;

-- Feature 2: Click tracking
alter table apps add column if not exists click_count integer not null default 0;
alter table apps add column if not exists try_count   integer not null default 0;

-- Feature 4: Submitter mini-dashboard secret token
alter table apps add column if not exists dashboard_token text unique;

-- Feature 5: Upvote counts (cached on the app row for fast display)
alter table apps add column if not exists upvote_count integer not null default 0;

-- Feature 5: Per-visitor upvote dedup table
create table if not exists app_upvotes (
  id          bigserial   primary key,
  app_id      text        not null references apps(id) on delete cascade,
  fingerprint text        not null,
  created_at  timestamptz not null default now(),
  unique (app_id, fingerprint)
);

-- Feature 5: Upvote settings (defaults; on conflict = already set, leave as-is)
insert into settings (key, value) values
  ('upvotes_enabled',         'true'),
  ('upvote_auto_hot_enabled', 'true'),
  ('upvote_hot_threshold',    '15')
on conflict (key) do nothing;
