create extension if not exists pgcrypto;

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  name text not null,
  description text not null default '',
  tag text not null default '',
  prompt text not null,
  avatar_url text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists characters_visibility_created_idx
on public.characters(visibility, created_at desc);

create index if not exists characters_user_created_idx
on public.characters(user_id, created_at desc);

create or replace function public.set_characters_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists characters_set_updated_at on public.characters;

create trigger characters_set_updated_at
before update on public.characters
for each row
execute function public.set_characters_updated_at();

alter table public.characters enable row level security;

drop policy if exists "characters_select_public" on public.characters;
create policy "characters_select_public"
on public.characters
for select
using (visibility = 'public');

drop policy if exists "characters_select_own" on public.characters;
create policy "characters_select_own"
on public.characters
for select
using (auth.uid() = user_id);

drop policy if exists "characters_insert_own" on public.characters;
create policy "characters_insert_own"
on public.characters
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "characters_update_own" on public.characters;
create policy "characters_update_own"
on public.characters
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "characters_delete_own" on public.characters;
create policy "characters_delete_own"
on public.characters
for delete
to authenticated
using (auth.uid() = user_id);
