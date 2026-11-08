-- Remove bulk ingested external apps from the database, retaining only the curated catalog apps and user submissions
delete from apps
where slug not in (
  'helumi', 'macwhisper', 'anytype', 'ia-writer', 'clearbar',
  'lounge', 'alcove', 'holdspeak', 'precis', 'voicera',
  'shottr', 'better-shot', 'dejashot', 'screen-charm', 'screentoast',
  'boom', 'tucket', 'clippio', 'maclip', 'notchdodo',
  'droppy', 'mole', 'plumby', 'bytesweep', 'scanmydisk'
)
and (is_user_submitted is not true or is_user_submitted is null);
