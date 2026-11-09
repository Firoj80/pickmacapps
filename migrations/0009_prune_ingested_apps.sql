-- Remove bulk ingested external apps from the database, retaining only the curated catalog apps and user submissions
delete from apps
where slug not in (
  'helumi', 'macwhisper', 'anytype', 'ia-writer', 'clearbar',
  'lounge', 'alcove', 'holdspeak', 'precis', 'voicera',
  'shottr', 'better-shot', 'dejashot', 'screen-charm', 'screentoast',
  'boom', 'tucket', 'clippio', 'maclip', 'notchdodo',
  'droppy', 'mole', 'plumby', 'bytesweep'
)
and (submitter_email is null or submitter_email = '');
