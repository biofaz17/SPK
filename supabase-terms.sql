begin;

revoke update (terms_accepted_version, terms_accepted_at, terms_log)
  on public.profiles from public, anon, authenticated;

create table if not exists public.sparky_terms_acceptances (
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  terms_version text not null,
  accepted_at timestamptz not null default clock_timestamp(),
  primary key (auth_user_id, terms_version)
);

alter table public.sparky_terms_acceptances enable row level security;
revoke all on public.sparky_terms_acceptances from public, anon, authenticated;

create or replace function public.sparky_accept_terms(p_version text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  recorded_at timestamptz;
  current_version constant text := 'v1.0';
begin
  if actor_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_version is distinct from current_version then
    raise exception 'Terms version changed' using errcode = '22023';
  end if;

  insert into public.sparky_terms_acceptances (auth_user_id, terms_version)
  values (actor_id, current_version)
  on conflict (auth_user_id, terms_version) do nothing;

  select accepted_at into strict recorded_at
  from public.sparky_terms_acceptances
  where auth_user_id = actor_id and terms_version = current_version;

  update public.profiles
  set terms_accepted_version = current_version,
      terms_accepted_at = recorded_at,
      terms_log = jsonb_build_object('auth_user_id', actor_id, 'version', current_version)
  where auth_user_id = actor_id;

  if not found then
    raise exception 'Profile not found' using errcode = '42501';
  end if;
  return recorded_at;
end;
$$;

revoke all on function public.sparky_accept_terms(text) from public, anon, authenticated;
grant execute on function public.sparky_accept_terms(text) to authenticated;

commit;
