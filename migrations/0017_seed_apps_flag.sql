-- Migration 0017: Track starter seed apps vs user/admin active apps
alter table apps add column if not exists is_seed boolean not null default false;

-- Backfill is_seed for the 24 initial build-time catalog seed apps
update apps set is_seed = true where slug in (
  'helumi',
  'macwhisper',
  'anytype',
  'ia-writer',
  'clearbar',
  'lounge',
  'alcove',
  'holdspeak',
  'precis',
  'voicera',
  'shottr',
  'better-shot',
  'dejashot',
  'screen-charm',
  'screentoast',
  'boom',
  'tucket',
  'clippio',
  'maclip',
  'notchdodo',
  'droppy',
  'mole',
  'plumby',
  'bytesweep'
);
