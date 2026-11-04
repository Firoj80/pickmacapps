-- A deleted app must stay deleted. The catalog seed skips these slugs.
create table if not exists app_tombstones (
  slug text primary key,
  deleted_at timestamptz not null default now()
);
