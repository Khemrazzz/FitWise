create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  member_id uuid not null references public.profiles(id),
  day_number int not null,
  notes text,
  completed_at timestamptz not null default now()
);

alter table public.completions enable row level security;

create policy "member manages own completions" on public.completions
  for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy "trainer reads completions for own members" on public.completions
  for select using (
    exists (select 1 from public.members m where m.profile_id = completions.member_id and m.trainer_id = auth.uid())
  );
