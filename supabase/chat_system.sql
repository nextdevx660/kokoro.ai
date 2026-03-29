create extension if not exists pgcrypto;

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  character_id text not null,
  character_name text not null,
  character_avatar_url text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
add column if not exists chat_id uuid references public.chats(id) on delete set null;

alter table public.users
add column if not exists plan text not null default 'free';

alter table public.users
add column if not exists daily_tokens_remaining integer not null default 20;

alter table public.users
add column if not exists token_last_reset_at date not null default ((now() at time zone 'utc')::date);

create index if not exists chats_user_id_idx on public.chats(user_id);
create index if not exists chats_character_id_idx on public.chats(character_id);
create index if not exists chats_user_character_updated_idx
on public.chats(user_id, character_id, updated_at desc);

alter table public.chats enable row level security;

drop policy if exists "Users can read their chats" on public.chats;
create policy "Users can read their chats"
on public.chats
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their chats" on public.chats;
create policy "Users can insert their chats"
on public.chats
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their chats" on public.chats;
create policy "Users can update their chats"
on public.chats
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
on public.users
for select
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
on public.users
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.get_daily_chat_token_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  user_record public.users%rowtype;
  today_utc date := (now() at time zone 'utc')::date;
  effective_plan text;
  effective_tokens integer;
begin
  select *
  into user_record
  from public.users
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'User profile not found';
  end if;

  effective_plan := lower(coalesce(user_record.plan, 'free'));
  effective_tokens := coalesce(user_record.daily_tokens_remaining, 20);

  if user_record.token_last_reset_at is distinct from today_utc then
    effective_tokens := 20;

    update public.users
    set daily_tokens_remaining = effective_tokens,
        token_last_reset_at = today_utc
    where id = user_record.id;
  end if;

  return jsonb_build_object(
    'plan', effective_plan,
    'remainingTokens', effective_tokens
  );
end;
$$;

create or replace function public.consume_daily_chat_token()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  token_state jsonb;
  effective_plan text;
  effective_tokens integer;
begin
  token_state := public.get_daily_chat_token_status();
  effective_plan := lower(coalesce(token_state->>'plan', 'free'));
  effective_tokens := coalesce((token_state->>'remainingTokens')::integer, 20);

  if effective_plan in ('pro', 'premium') then
    return jsonb_build_object(
      'plan', effective_plan,
      'remainingTokens', effective_tokens
    );
  end if;

  if effective_tokens <= 0 then
    return jsonb_build_object(
      'plan', effective_plan,
      'remainingTokens', 0
    );
  end if;

  update public.users
  set daily_tokens_remaining = effective_tokens - 1
  where id = auth.uid()
  returning daily_tokens_remaining into effective_tokens;

  return jsonb_build_object(
    'plan', effective_plan,
    'remainingTokens', effective_tokens
  );
end;
$$;

create or replace function public.activate_pro_plan(target_user_id uuid)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_user public.users%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if auth.uid() <> target_user_id then
    raise exception 'Cannot activate plan for another user';
  end if;

  update public.users
  set plan = 'pro'
  where id = target_user_id
  returning * into updated_user;

  if not found then
    raise exception 'User profile not found';
  end if;

  return updated_user;
end;
$$;

grant execute on function public.get_daily_chat_token_status() to authenticated;
grant execute on function public.consume_daily_chat_token() to authenticated;
grant execute on function public.activate_pro_plan(uuid) to authenticated;
