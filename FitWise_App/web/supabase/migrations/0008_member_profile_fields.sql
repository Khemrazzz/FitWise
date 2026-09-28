alter table public.members add column if not exists phone text;
alter table public.members add column if not exists date_of_birth date;
alter table public.members add column if not exists emergency_contact text;

alter table public.assessments add column if not exists target_weight_kg numeric;
alter table public.assessments add column if not exists preferred_days text;
alter table public.assessments add column if not exists available_time text;
alter table public.assessments add column if not exists trainer_notes text;
