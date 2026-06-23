-- Run this entire script in your Supabase SQL Editor (Dashboard -> SQL Editor)

-- 1. Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Create watchlists table
create table public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, symbol)
);

alter table public.watchlists enable row level security;

create policy "Users can view their own watchlists" on public.watchlists
  for select using (auth.uid() = user_id);

create policy "Users can insert into their own watchlist" on public.watchlists
  for insert with check (auth.uid() = user_id);

create policy "Users can delete from their own watchlist" on public.watchlists
  for delete using (auth.uid() = user_id);

-- 3. Add cash_balance to profiles for virtual trading
alter table public.profiles
add column if not exists cash_balance numeric(12,2) not null default 100000.00;

-- 4. Create stock holdings table (aggregated per symbol)
create table if not exists public.holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  shares numeric(12,4) not null default 0.0000,
  average_buy_price numeric(12,2) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, symbol),
  constraint positive_shares check (shares >= 0)
);

alter table public.holdings enable row level security;

create policy "Users can view their own holdings" on public.holdings
  for select using (auth.uid() = user_id);

create policy "Users can insert their own holdings" on public.holdings
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own holdings" on public.holdings
  for update using (auth.uid() = user_id);

create policy "Users can delete their own holdings" on public.holdings
  for delete using (auth.uid() = user_id);

-- 5. Create trade transaction ledger
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  type text not null check (type in ('BUY', 'SELL')),
  shares numeric(12,4) not null,
  price numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  executed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions" on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

-- 6. Auto-create profile on signup (now includes cash_balance with default)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
