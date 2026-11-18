-- ============================================================
-- Migration 0015: Align featured apps active duration to 7 days
-- ============================================================

-- Clamp any active featured apps whose duration was previously set to 30 days
update apps
set featured_until = now() + interval '7 days'
where editor_choice = true
  and featured_until is not null
  and featured_until > now() + interval '7 days';
