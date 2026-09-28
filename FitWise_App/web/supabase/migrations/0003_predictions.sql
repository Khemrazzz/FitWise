create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  predicted_category text not null,
  confidence numeric,
  probabilities jsonb,
  model_name text,
  model_version text,
  feature_profile text,
  created_at timestamptz not null default now()
);

alter table public.predictions enable row level security;

create policy "trainer manages predictions for own members" on public.predictions
  for all using (
    exists (
      select 1 from public.assessments a
      join public.members m on m.profile_id = a.member_id
      where a.id = predictions.assessment_id and m.trainer_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.assessments a
      join public.members m on m.profile_id = a.member_id
      where a.id = predictions.assessment_id and m.trainer_id = auth.uid()
    )
  );

create policy "member reads own predictions" on public.predictions
  for select using (
    exists (select 1 from public.assessments a where a.id = predictions.assessment_id and a.member_id = auth.uid())
  );
