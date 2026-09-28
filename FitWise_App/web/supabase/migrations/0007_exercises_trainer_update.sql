create policy "trainers can update exercises" on public.exercises
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'trainer')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'trainer')
  );
