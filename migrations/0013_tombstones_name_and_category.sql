-- Migration 0013: Add name, category, and redirect_url to app_tombstones for SEO alternatives hub
alter table app_tombstones add column if not exists name text;
alter table app_tombstones add column if not exists category text;
alter table app_tombstones add column if not exists redirect_url text;
