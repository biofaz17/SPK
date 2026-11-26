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

create table if not exists public.mercado_pago_webhook_deliveries (
  delivery_key text primary key check (delivery_key ~ '^[0-9a-f]{64}$'),
  lease_token uuid not null,
  lease_expires_at timestamptz not null,
  processed_at timestamptz
);

alter table public.mercado_pago_webhook_deliveries enable row level security;
revoke all on table public.mercado_pago_webhook_deliveries from public, anon, authenticated;
grant select, insert, update on table public.mercado_pago_webhook_deliveries to service_role;

create or replace function public.sparky_claim_mercado_pago_webhook(p_delivery_key text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  claim_token uuid;
begin
  insert into public.mercado_pago_webhook_deliveries as delivery (delivery_key, lease_token, lease_expires_at)
  values (p_delivery_key, gen_random_uuid(), statement_timestamp() + interval '2 minutes')
  on conflict (delivery_key) do update
    set lease_token = excluded.lease_token, lease_expires_at = excluded.lease_expires_at
    where delivery.processed_at is null and delivery.lease_expires_at <= statement_timestamp()
  returning delivery.lease_token into claim_token;

  if found then
    return claim_token::text;
  end if;
  if exists (select 1 from public.mercado_pago_webhook_deliveries where delivery_key = p_delivery_key and processed_at is not null) then
    return 'processed';
  end if;
  return 'busy';
end;
$$;

revoke all on function public.sparky_claim_mercado_pago_webhook(text) from public, anon, authenticated;
grant execute on function public.sparky_claim_mercado_pago_webhook(text) to service_role;

notify pgrst, 'reload schema';

commit;
