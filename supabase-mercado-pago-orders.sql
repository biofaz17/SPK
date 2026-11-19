begin;

create table if not exists public.mercado_pago_orders (
  reference uuid primary key default gen_random_uuid(),
  checkout_attempt_id uuid not null,
  profile_id text not null check (char_length(profile_id) between 1 and 100),
  tier text not null check (tier in ('STARTER', 'PRO')),
  provider_order_id text unique,
  checkout_url text,
  created_at timestamptz not null default now(),
  unique (profile_id, checkout_attempt_id),
  check ((provider_order_id is null) = (checkout_url is null))
);

alter table public.mercado_pago_orders enable row level security;
revoke all on table public.mercado_pago_orders from public, anon, authenticated;
grant select, insert, update on table public.mercado_pago_orders to service_role;

commit;
