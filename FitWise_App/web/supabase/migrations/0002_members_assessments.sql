create table if not exists public.members (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  trainer_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;

create policy "trainer manages own members" on public.members
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "member reads self" on public.members
  for select using (profile_id = auth.uid());

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(profile_id) on delete cascade,
  age int not null,
  gender text not null check (gender in ('Male','Female')),
  weight_kg numeric not null,
  height_m numeric not null,
  fat_percentage numeric not null,
  workout_frequency int not null,
  experience_level int not null check (experience_level in (1,2,3)),
  bmi numeric not null,
  goal text not null,
  days_per_week int not null,
  session_duration_minutes int not null,
  equipment text[] not null default '{}',
  restrictions text[] not null default '{}',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.assessments enable row level security;

create policy "trainer manages own members assessments" on public.assessments
  for all using (
    exists (select 1 from public.members m where m.profile_id = assessments.member_id and m.trainer_id = auth.uid())
  ) with check (
    exists (select 1 from public.members m where m.profile_id = assessments.member_id and m.trainer_id = auth.uid())
  );

create policy "member reads own assessments" on public.assessments
  for select using (member_id = auth.uid());
