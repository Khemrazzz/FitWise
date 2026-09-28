-- Admin role, trainer self sign-up with approval, and a fix for a privilege
-- escalation: the "self update" policy in 0001 let any signed-in user change
-- their own profiles.role (a member could make themselves a trainer). Role and
-- account status are now changeable only by the server (service role) or by a
-- direct database session (SQL editor / migrations).

-- 1. Roles and account status -------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'trainer', 'member'));

alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('pending', 'active', 'disabled'));

-- Contact details used by the admin area (trainer applications, member lists).
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists specialisation text;

update public.profiles p set email = u.email from auth.users u where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (new.id, 'member', new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

-- 2. Role helper ----------------------------------------------------------------
-- security definer so policies on profiles can call it without recursing into
-- profiles' own RLS. Returns null for pending or disabled accounts, so every
-- policy built on it automatically excludes them.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and status = 'active'
$$;

revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

-- 3. Privilege-escalation fix ---------------------------------------------------
-- auth.role() is 'service_role' for the server's secret key and null for a
-- direct database session; for a signed-in user it is 'authenticated'.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
as $$
begin
  if (new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.email is distinct from old.email)
     and coalesce(auth.role(), 'service_role') <> 'service_role' then
    raise exception 'role, status and email can only be changed by the server';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges on public.profiles;
create trigger protect_profile_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- Only an active trainer may create a trainer-member link (previously any
-- signed-in user could insert a members row pointing at themselves).
drop policy if exists "trainer manages own members" on public.members;
create policy "trainer manages own members" on public.members
  for all using (trainer_id = auth.uid())
  with check (trainer_id = auth.uid() and public.current_app_role() = 'trainer');

-- 4. Admin access ---------------------------------------------------------------
-- Admins manage accounts, trainer assignments and the catalogue. They get no
-- policies on assessments, predictions, plans or completions, so member
-- fitness data stays visible only to the member and their own trainer.
create policy "admin reads all profiles" on public.profiles
  for select using (public.current_app_role() = 'admin');

create policy "admin reads all members" on public.members
  for select using (public.current_app_role() = 'admin');

create policy "admin reassigns members" on public.members
  for update using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists "trainers can update exercises" on public.exercises;
create policy "admin manages exercises" on public.exercises
  for update using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- 5. Admin audit log --------------------------------------------------------------
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'trainer_created', 'trainer_approved', 'trainer_rejected', 'trainer_deactivated',
    'trainer_reactivated', 'member_reassigned', 'exercise_updated'
  )),
  target_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

-- Written only by the server (service role); admins can read it.
create policy "admin reads audit log" on public.admin_audit_log
  for select using (public.current_app_role() = 'admin');
