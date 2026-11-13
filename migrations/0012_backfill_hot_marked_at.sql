-- ============================================================
-- Migration 0012: Ensure is_hot column and hot_marked_at exist,
--                 and backfill hot_marked_at for currently hot apps
-- ============================================================

alter table apps add column if not exists is_hot boolean not null default false;
alter table apps add column if not exists hot_marked_at timestamptz;

update apps
   set hot_marked_at = coalesce(hot_marked_at, now())
 where is_hot = true;
