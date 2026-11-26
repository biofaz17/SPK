begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists sparky_private;
revoke all on schema sparky_private from public, anon, authenticated;

create table if not exists sparky_private.rate_limits (
  bucket text primary key,
  attempts integer not null check (attempts > 0),
  expires_at timestamptz not null
);
create index if not exists sparky_rate_limits_expiration on sparky_private.rate_limits (expires_at);

create or replace function public.sparky_consume_rate_limit(
  bucket_key text, request_limit integer, window_seconds integer
)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  checked_at timestamptz := clock_timestamp();
  updated_bucket sparky_private.rate_limits;
begin
  if bucket_key is null or bucket_key !~ '^[0-9a-f]{64}$'
    or request_limit is null or request_limit not between 1 and 10000
    or window_seconds is null or window_seconds not between 1 and 86400 then
    raise exception 'Invalid rate limit';
  end if;

  insert into sparky_private.rate_limits as current_bucket (bucket, attempts, expires_at)
  values (bucket_key, 1, checked_at + make_interval(secs => window_seconds))
  on conflict (bucket) do update set
    attempts = case when current_bucket.expires_at <= checked_at then 1
      else least(current_bucket.attempts + 1, request_limit + 1) end,
    expires_at = case when current_bucket.expires_at <= checked_at then excluded.expires_at
      else current_bucket.expires_at end
  returning * into updated_bucket;

  with expired as (
    select bucket from sparky_private.rate_limits
    where expires_at <= checked_at order by expires_at limit 32 for update skip locked
  )
  delete from sparky_private.rate_limits using expired
  where rate_limits.bucket = expired.bucket;

  return jsonb_build_object(
    'allowed', updated_bucket.attempts <= request_limit,
    'retryAfter', greatest(1, ceil(extract(epoch from updated_bucket.expires_at - checked_at))::integer)
  );
end;
$$;

create table if not exists sparky_private.admin_sessions (
  id uuid primary key,
  expires_at timestamptz not null
);
create index if not exists sparky_admin_sessions_expiration on sparky_private.admin_sessions (expires_at);

create or replace function public.sparky_create_admin_session(session_id uuid, expires_epoch bigint)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  checked_at timestamptz := clock_timestamp();
  expiry timestamptz := to_timestamp(expires_epoch);
begin
  if session_id is null or expiry is null or expiry <= checked_at or expiry > checked_at + interval '1 hour 1 minute' then
    return false;
  end if;
  delete from sparky_private.admin_sessions where expires_at <= checked_at;
  insert into sparky_private.admin_sessions (id, expires_at) values (session_id, expiry);
  return true;
end;
$$;

create or replace function public.sparky_admin_session_active(session_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from sparky_private.admin_sessions where id = session_id and expires_at > now());
$$;

create or replace function public.sparky_revoke_admin_session(session_id uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  delete from sparky_private.admin_sessions where id = session_id;
  return true;
end;
$$;

create or replace function sparky_private.legacy_password_input(profile_id text, legacy_password text)
returns text
language sql immutable strict set search_path = ''
as $$
  select 'Sparky1!' || translate(encode(extensions.digest(
    convert_to('sparky-explorer-password:v1', 'UTF8') || decode('00', 'hex')
      || convert_to(profile_id, 'UTF8') || decode('00', 'hex') || convert_to(legacy_password, 'UTF8'),
    'sha256'
  ), 'base64'), '+/=', '-_');
$$;

create or replace function public.sparky_verify_legacy_password(profile_id text, derived_password text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  stored_password text;
  stored_verifier text;
begin
  if derived_password is null or derived_password !~ '^Sparky1![A-Za-z0-9_-]{43}$' then
    return false;
  end if;
  select password, legacy_password_verifier into stored_password, stored_verifier
  from public.profiles where id = profile_id and auth_user_id is null for update;

  if stored_verifier is not null then
    return stored_verifier = extensions.crypt(derived_password, stored_verifier);
  end if;
  if stored_password is null or sparky_private.legacy_password_input(profile_id, stored_password) <> derived_password then
    return false;
  end if;
  update public.profiles set
    password = null,
    legacy_password_verifier = extensions.crypt(derived_password, extensions.gen_salt('bf', 12))
  where id = profile_id;
  return true;
end;
$$;

-- Call in batches after the new API is serving explorer logins.
create or replace function public.sparky_backfill_legacy_passwords(batch_size integer default 25)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  updated_rows integer;
begin
  if batch_size is null or batch_size not between 1 and 100 then
    raise exception 'Invalid batch size';
  end if;
  with pending as (
    select id from public.profiles where auth_user_id is null and password is not null
    order by id limit batch_size for update skip locked
  )
  update public.profiles as profile set
    legacy_password_verifier = coalesce(profile.legacy_password_verifier, extensions.crypt(
      sparky_private.legacy_password_input(profile.id, profile.password), extensions.gen_salt('bf', 12)
    )),
    password = null
  from pending where profile.id = pending.id;
  get diagnostics updated_rows = row_count;
  return updated_rows;
end;
$$;

revoke all on function public.sparky_consume_rate_limit(text, integer, integer),
  public.sparky_create_admin_session(uuid, bigint), public.sparky_admin_session_active(uuid),
  public.sparky_revoke_admin_session(uuid), public.sparky_verify_legacy_password(text, text),
  public.sparky_backfill_legacy_passwords(integer) from public, anon, authenticated;
grant execute on function public.sparky_consume_rate_limit(text, integer, integer),
  public.sparky_create_admin_session(uuid, bigint), public.sparky_admin_session_active(uuid),
  public.sparky_revoke_admin_session(uuid), public.sparky_verify_legacy_password(text, text),
  public.sparky_backfill_legacy_passwords(integer) to service_role;

notify pgrst, 'reload schema';

commit;
