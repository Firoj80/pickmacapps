-- ============================================================
-- Migration 0019: Add macOS version & architecture compatibility fields
-- ============================================================

alter table apps add column if not exists macos_version text not null default '';
alter table apps add column if not exists apple_silicon boolean not null default true;
alter table apps add column if not exists intel_supported boolean not null default true;

alter table submissions add column if not exists macos_version text not null default '';
alter table submissions add column if not exists apple_silicon boolean not null default true;
alter table submissions add column if not exists intel_supported boolean not null default true;
