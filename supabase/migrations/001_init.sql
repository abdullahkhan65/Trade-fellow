-- ============================================================
-- PropTrader — Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Accounts table (supports multiple funded accounts per user)
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  broker text,
  account_number text,
  account_type text default 'funded' check (account_type in ('challenge', 'funded', 'personal')),
  starting_balance numeric not null default 100000,
  currency text default 'USD',
  max_daily_risk_percent numeric default 5,
  max_drawdown_percent numeric default 10,
  profit_target_percent numeric default 10,
  trading_style text default 'day' check (trading_style in ('scalping', 'day', 'swing')),
  trailing_drawdown boolean default false,
  metaapi_account_id text,
  metaapi_token text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Trades table
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  position_size numeric not null default 0,
  entry numeric not null default 0,
  stop_loss numeric not null default 0,
  take_profit numeric,
  exit numeric,
  pnl numeric,
  risk_amount numeric,
  risk_percent numeric,
  r_multiple numeric,
  status text default 'closed' check (status in ('open', 'closed')),
  trading_style text default 'day',
  notes text default '',
  tags text[] default '{}',
  mt5_ticket text,
  created_at timestamptz default now()
);

-- Unique constraint on mt5_ticket for dedup during import
create unique index if not exists trades_mt5_ticket_idx on public.trades(mt5_ticket)
  where mt5_ticket is not null;

-- Performance indexes
create index if not exists trades_account_id_idx on public.trades(account_id);
create index if not exists trades_user_id_idx on public.trades(user_id);
create index if not exists trades_date_idx on public.trades(date);
create index if not exists trades_status_idx on public.trades(status);
create index if not exists accounts_user_id_idx on public.accounts(user_id);

-- Enable Row Level Security
alter table public.accounts enable row level security;
alter table public.trades enable row level security;

-- RLS Policies: users can only access their own data
drop policy if exists "own_accounts" on public.accounts;
create policy "own_accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own_trades" on public.trades;
create policy "own_trades" on public.trades
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Optional: Enable Google OAuth in Supabase Dashboard
-- Authentication → Providers → Google → Enable
-- (requires Google Cloud OAuth credentials)
-- ============================================================
