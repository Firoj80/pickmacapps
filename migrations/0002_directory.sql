create table if not exists settings (
  key text primary key,
  value text not null
);

create table if not exists apps (
  id text primary key,
  name text not null,
  slug text not null unique,
  tagline text not null,
  description text not null,
  icon text not null default '',
  website text not null,
  pricing text not null check (pricing in ('free', 'paid', 'freemium')),
  category text not null,
  category_name text not null default '',
  category_icon text not null default '',
  editor_choice boolean not null default false,
  created_at timestamptz not null default now(),
  demo text not null default '',
  related jsonb not null default '[]'::jsonb,
  status text not null check (status in ('pending', 'published', 'unpublished', 'rejected')),
  badge_status text not null default 'unknown',
  badge_misses integer not null default 0,
  badge_checked_at timestamptz,
  badge_detail text not null default '',
  submitter_email text,
  updated_at timestamptz not null default now()
);

create table if not exists guides (
  slug text primary key,
  title text not null,
  excerpt text not null,
  date text not null,
  date_label text not null,
  minutes integer not null default 5,
  tags jsonb not null default '[]'::jsonb,
  toc jsonb not null default '[]'::jsonb,
  html text not null,
  more jsonb not null default '[]'::jsonb,
  status text not null check (status in ('draft', 'published', 'unpublished')),
  updated_at timestamptz not null default now()
);

create table if not exists submissions (
  id text primary key,
  app_name text not null,
  website text not null,
  tagline text not null,
  email text not null,
  plan text not null check (plan in ('free', 'choice')),
  badge_ok boolean not null default false,
  status text not null,
  app_id text,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key,
  submission_id text,
  provider text not null default 'dodo',
  provider_payment_id text,
  amount_cents integer not null,
  currency text not null default 'USD',
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id text primary key,
  received_at timestamptz not null default now()
);

create table if not exists badge_checks (
  id text primary key,
  app_id text not null,
  result text not null,
  detail text not null default '',
  checked_at timestamptz not null default now()
);

create table if not exists audit_log (
  id text primary key,
  actor text not null,
  action text not null,
  target text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);
