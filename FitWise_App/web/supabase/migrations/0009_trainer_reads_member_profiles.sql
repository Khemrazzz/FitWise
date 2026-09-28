-- Bug fix: the members list / member profile pages query profiles.full_name
-- for a trainer's members using the trainer's own RLS-scoped client, but only
-- a "self select" policy existed -- meaning a trainer could never actually
-- see a member's name (it would silently come back empty). This adds the
-- missing read path without weakening isolation: only a member's own trainer
-- (via the members table) can read that member's profile row.
create policy "trainer reads own members profiles" on public.profiles
  for select using (
    exists (select 1 from public.members m where m.profile_id = profiles.id and m.trainer_id = auth.uid())
  );
