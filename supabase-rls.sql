revoke insert, update on table public.profiles from public, anon, authenticated;
grant insert (id, name, password, parent_email, age, active_skin, progress, settings, last_active)
	on table public.profiles to anon, authenticated;
grant update (progress, settings, active_skin, last_active, terms_accepted_version, terms_accepted_at, terms_log)
	on table public.profiles to anon, authenticated;
alter table public.profiles alter column subscription set default 'FREE';