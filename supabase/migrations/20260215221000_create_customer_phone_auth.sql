-- Customer phone authentication (independent from Supabase Auth)
-- Used by custom OTP + cookie session flow for storefront customers.

create extension if not exists pgcrypto;

create table if not exists public.customer_users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  last_login_at timestamptz
);

create table if not exists public.customer_otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_customer_users_phone on public.customer_users(phone);
create index if not exists idx_customer_otp_phone_created_at on public.customer_otp_codes(phone, created_at desc);
create index if not exists idx_customer_otp_expires_at on public.customer_otp_codes(expires_at);

alter table public.customer_users enable row level security;
alter table public.customer_otp_codes enable row level security;

-- No public policies intentionally. Access should happen only via service role.
