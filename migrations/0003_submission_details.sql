alter table submissions add column if not exists description text not null default '';
alter table submissions add column if not exists icon text not null default '';
alter table submissions add column if not exists demo text not null default '';
alter table submissions add column if not exists pricing text not null default 'free';
alter table submissions add column if not exists category text not null default 'utilities';
