-- Stop the old catalog seed from sticking. Helumi and MacWhisper were marked
-- Editor's Choice by a hardcoded list, not by the admin. ScanMyDisk stays as saved.
update apps set editor_choice = false where slug in ('helumi', 'macwhisper');
