alter table public.plans add column if not exists approved_by uuid references public.profiles(id);
alter table public.plans add column if not exists approved_at timestamptz;

create table if not exists public.plan_audit_log (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  action text not null check (action in ('approved','rejected','edited')),
  reason text,
  previous_days jsonb,
  previous_validation jsonb,
  changed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.plan_audit_log enable row level security;

create policy "trainer manages audit log for own members plans" on public.plan_audit_log
  for all using (
    exists (
      select 1 from public.plans p
      join public.assessments a on a.id = p.assessment_id
      join public.members m on m.profile_id = a.member_id
      where p.id = plan_audit_log.plan_id and m.trainer_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.plans p
      join public.assessments a on a.id = p.assessment_id
      join public.members m on m.profile_id = a.member_id
      where p.id = plan_audit_log.plan_id and m.trainer_id = auth.uid()
    )
  );
