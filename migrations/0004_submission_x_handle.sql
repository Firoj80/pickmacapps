alter table submissions add column if not exists x_handle text not null default '';
alter table apps add column if not exists submitter_x text;
