-- ============================================================
-- Migration 0020: Add gallery_images (max 6) and youtube_url
-- ============================================================

alter table apps add column if not exists gallery_images jsonb not null default '[]'::jsonb;
alter table apps add column if not exists youtube_url text not null default '';

alter table submissions add column if not exists gallery_images jsonb not null default '[]'::jsonb;
alter table submissions add column if not exists youtube_url text not null default '';
