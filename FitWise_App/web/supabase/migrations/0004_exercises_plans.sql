create table if not exists public.exercises (
  id text primary key,
  name text not null,
  category text not null,
  difficulty text[] not null default '{}',
  equipment text[] not null default '{}',
  muscles text[] not null default '{}',
  impact text not null,
  contraindication_tags text[] not null default '{}',
  estimated_minutes int not null,
  is_active boolean not null default true
);

alter table public.exercises enable row level security;

-- Catalogue is readable by any signed-in user (trainer or member); writes
-- happen via the admin/seed script for now, CRUD UI lands in Phase 8.
create policy "authenticated users read exercises" on public.exercises
  for select using (auth.role() = 'authenticated');

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  prediction_id uuid references public.predictions(id),
  generator text not null check (generator in ('rule_based','gemini')),
  plan_name text not null,
  days_per_week int not null,
  explanation text,
  days jsonb not null,
  rules_applied text[],
  validation jsonb not null,
  status text not null default 'draft' check (status in ('draft','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "trainer manages plans for own members" on public.plans
  for all using (
    exists (
      select 1 from public.assessments a
      join public.members m on m.profile_id = a.member_id
      where a.id = plans.assessment_id and m.trainer_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.assessments a
      join public.members m on m.profile_id = a.member_id
      where a.id = plans.assessment_id and m.trainer_id = auth.uid()
    )
  );

-- Members only ever see approved plans, never drafts under trainer review.
create policy "member reads own approved plans" on public.plans
  for select using (
    status = 'approved'
    and exists (select 1 from public.assessments a where a.id = plans.assessment_id and a.member_id = auth.uid())
  );
