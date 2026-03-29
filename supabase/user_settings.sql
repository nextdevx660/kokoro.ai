alter table public.users
add column if not exists settings jsonb not null default jsonb_build_object(
  'emailAnnouncements', true,
  'productUpdates', true,
  'privateProfile', false,
  'safeMode', false,
  'language', 'English',
  'theme', 'System default'
);
