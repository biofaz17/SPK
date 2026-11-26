begin;

alter table public.profiles
  add column if not exists auth_user_id uuid references auth.users (id) on delete set null,
  add column if not exists legacy_password_verifier text,
  add column if not exists terms_accepted_version text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_log jsonb,
  alter column password drop not null,
  alter column subscription set default 'FREE';

create unique index if not exists sparky_profiles_auth_user_id_key
  on public.profiles (auth_user_id)
  where auth_user_id is not null;

alter table public.profiles enable row level security;

revoke all privileges on table public.profiles from public, anon, authenticated;
revoke all privileges (legacy_password_verifier) on table public.profiles from public, anon, authenticated;
revoke all privileges (
  id, auth_user_id, name, password, parent_email, age, subscription, active_skin,
  progress, settings, last_active, terms_accepted_version, terms_accepted_at, terms_log
) on table public.profiles from public, anon, authenticated;

grant select (
  id, auth_user_id, name, parent_email, age, subscription, active_skin,
  progress, settings, last_active, terms_accepted_version, terms_accepted_at
) on table public.profiles to authenticated;
grant update (
  progress, settings, active_skin, last_active
) on table public.profiles to authenticated;

grant select on table public.profiles to service_role;
grant update (subscription) on table public.profiles to service_role;

drop policy if exists sparky_profile_owner on public.profiles;
drop policy if exists sparky_profile_owner_select on public.profiles;
drop policy if exists sparky_profile_owner_update on public.profiles;

-- Restrictive policy also limits any permissive policies already installed.
create policy sparky_profile_owner on public.profiles
  as restrictive for all to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));
create policy sparky_profile_owner_select on public.profiles
  for select to authenticated
  using (auth_user_id = (select auth.uid()));
create policy sparky_profile_owner_update on public.profiles
  for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

create or replace function public.sparky_link_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile jsonb := new.raw_app_meta_data -> 'sparky_profile';
begin
  -- app_metadata can only be set by trusted Auth administration.
  if profile is null then
    return new;
  end if;

  -- Auth may add app_metadata in an update inside the create-user transaction.
  if tg_op = 'UPDATE' and old.raw_app_meta_data -> 'sparky_profile' is not null then
    return new;
  end if;

  if profile ->> 'action' = 'migrate' then
    update public.profiles
    set auth_user_id = new.id, password = null, legacy_password_verifier = null
    where id = profile ->> 'id' and auth_user_id is null
      and (password is not null or legacy_password_verifier is not null);
    if not found then
      raise exception 'Sparky profile is unavailable for migration';
    end if;
  elsif profile ->> 'action' = 'register' then
    insert into public.profiles (
      id, auth_user_id, name, parent_email, age, active_skin, progress, settings, last_active
    ) values (
      profile ->> 'id', new.id, profile ->> 'name', profile ->> 'parent_email',
      (profile ->> 'age')::integer, 'default',
      '{"unlockedLevels":1,"stars":0,"creativeProjects":0,"totalBlocksUsed":0,"secretsFound":0}'::jsonb,
      '{"soundEnabled":true,"musicEnabled":true}'::jsonb,
      now()
    );

    update auth.users
    set raw_app_meta_data = jsonb_set(
      raw_app_meta_data, '{sparky_profile}', profile - array['name', 'parent_email', 'age']
    )
    where id = new.id;
  else
    raise exception 'Invalid Sparky profile operation';
  end if;

  return new;
end;
$$;

revoke all on function public.sparky_link_profile() from public, anon, authenticated;

drop trigger if exists sparky_link_profile on auth.users;
create trigger sparky_link_profile
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function public.sparky_link_profile();

create or replace function public.sparky_auth_ready()
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::pg_catalog.regclass
      and tgname = 'sparky_link_profile'
      and tgenabled in ('O', 'A')
  );
$$;

revoke all on function public.sparky_auth_ready() from public, anon, authenticated;
grant execute on function public.sparky_auth_ready() to service_role;

notify pgrst, 'reload schema';

commit;
