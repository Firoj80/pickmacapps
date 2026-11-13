-- ============================================================
-- Migration 0011: Add dashboard_token to submissions table
-- ============================================================

alter table submissions add column if not exists dashboard_token text unique;
