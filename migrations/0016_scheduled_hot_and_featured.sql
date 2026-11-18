-- Migration 0016: Scheduled Hot & Featured slots for upcoming cycles
alter table apps add column if not exists hot_scheduled_for timestamptz;
alter table apps add column if not exists featured_scheduled_for timestamptz;
alter table submissions add column if not exists scheduled_for timestamptz;
