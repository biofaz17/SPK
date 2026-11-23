begin;

alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles alter column created_at set default now();

-- An Auth account created during a legacy login records migration, not registration.
update public.profiles as profile
set created_at = auth_user.created_at
from auth.users as auth_user
where profile.created_at is null
  and profile.auth_user_id = auth_user.id
  and auth_user.created_at is not null
  and auth_user.raw_app_meta_data -> 'sparky_profile' ->> 'action' = 'register'
  and auth_user.raw_app_meta_data -> 'sparky_profile' ->> 'id' = profile.id::text;

revoke insert (created_at), update (created_at) on public.profiles from public, anon, authenticated;

create or replace function public.sparky_admin_accounts(
  search_term text,
  plan_filter text,
  account_view text,
  requested_page integer
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with options as (
    select
      lower(left(btrim(coalesce(search_term, '')), 100)) as search,
      statement_timestamp() as checked_at,
      statement_timestamp() - interval '7 days' as recent_cutoff,
      date_trunc('day', statement_timestamp(), 'America/Sao_Paulo') as today_start
  ), accounts as not materialized (
    select
      profile.id::text as id,
      coalesce(nullif(btrim(profile.name), ''), profile.id::text) as name,
      case when profile.subscription::text in ('STARTER', 'PRO') then profile.subscription::text else 'FREE' end as plan,
      profile.created_at,
      profile.last_active,
      nullif(btrim(profile.terms_accepted_version), '') is not null as terms_accepted,
      case when jsonb_typeof(profile.progress::jsonb -> 'unlockedLevels') = 'number'
        then profile.progress::jsonb -> 'unlockedLevels' end as unlocked_levels,
      case when jsonb_typeof(profile.progress::jsonb -> 'stars') = 'number'
        then profile.progress::jsonb -> 'stars' end as stars,
      profile.created_at between options.recent_cutoff and options.checked_at as recently_created,
      profile.last_active between options.today_start and options.checked_at as active_today
    from public.profiles as profile cross join options
  ), summary as (
    select
      count(*) as total,
      count(*) filter (where recently_created) as new_last_7_days,
      count(*) filter (where active_today) as active_today,
      count(*) filter (where terms_accepted) as with_terms,
      count(*) filter (where created_at is null) as without_registration_date,
      count(*) filter (where plan = 'FREE') as free,
      count(*) filter (where plan = 'STARTER') as starter,
      count(*) filter (where plan = 'PRO') as pro
    from accounts
  ), matching_accounts as (
    select accounts.*
    from accounts cross join options
    where (plan_filter is null or plan = plan_filter)
      and (case account_view
        when 'new' then recently_created
        when 'legacy' then created_at is null
        else true
      end)
      and (options.search = '' or strpos(lower(name), options.search) > 0 or strpos(lower(id), options.search) > 0)
  ), pagination as (
    select
      count(*) as filtered_total,
      least(greatest(requested_page, 1), greatest(1, (count(*) + 24) / 25)) as page
    from matching_accounts
  ), page_rows as (
    select matching_accounts.*, case when account_view = 'new' then created_at else last_active end as sort_date
    from matching_accounts
    order by sort_date desc nulls last, id asc
    limit 25 offset (select (page - 1) * 25 from pagination)
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total', summary.total,
      'newLast7Days', summary.new_last_7_days,
      'activeToday', summary.active_today,
      'withTerms', summary.with_terms,
      'withoutRegistrationDate', summary.without_registration_date,
      'free', summary.free,
      'starter', summary.starter,
      'pro', summary.pro
    ),
    'profiles', coalesce((select jsonb_agg(jsonb_build_object(
      'id', id,
      'name', name,
      'plan', plan,
      'createdAt', created_at,
      'lastActive', last_active,
      'termsAccepted', terms_accepted,
      'unlockedLevels', unlocked_levels,
      'stars', stars
    ) order by sort_date desc nulls last, id asc) from page_rows), '[]'::jsonb),
    'filteredTotal', pagination.filtered_total,
    'page', pagination.page,
    'pageSize', 25
  )
  from summary cross join pagination;
$$;

revoke all on function public.sparky_admin_accounts(text, text, text, integer) from public, anon, authenticated;
grant execute on function public.sparky_admin_accounts(text, text, text, integer) to service_role;

notify pgrst, 'reload schema';

commit;
