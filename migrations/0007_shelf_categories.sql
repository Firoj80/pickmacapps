create table if not exists categories (
  slug text primary key,
  name text not null,
  emoji text not null default '',
  paragraphs jsonb not null default '[]'::jsonb,
  tips jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

update apps
set category = 'utility',
    category_name = 'Utility',
    category_icon = '🔧'
where category = 'utilities';

update apps
set category = 'dev',
    category_name = 'Dev',
    category_icon = '🛠️'
where category = 'developer-tools';
