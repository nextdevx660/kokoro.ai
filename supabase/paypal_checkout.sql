create table if not exists public.paypal_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  paypal_order_id text not null unique,
  paypal_capture_id text unique,
  plan text not null default 'pro',
  amount text not null,
  currency text not null default 'USD',
  status text not null default 'CREATED',
  payer_email text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  captured_at timestamptz
);

create index if not exists paypal_orders_user_id_idx on public.paypal_orders(user_id);
create index if not exists paypal_orders_order_id_idx on public.paypal_orders(paypal_order_id);

alter table public.paypal_orders enable row level security;

drop policy if exists "Users can read their own paypal orders" on public.paypal_orders;
create policy "Users can read their own paypal orders"
on public.paypal_orders
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own paypal orders" on public.paypal_orders;
create policy "Users can insert their own paypal orders"
on public.paypal_orders
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own paypal orders" on public.paypal_orders;
create policy "Users can update their own paypal orders"
on public.paypal_orders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
