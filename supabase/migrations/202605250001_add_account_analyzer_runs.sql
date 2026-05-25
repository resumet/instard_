create table if not exists public.account_analyzer_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  target text not null,
  instagram_handle text,
  profile_url text,
  account jsonb not null default '{}'::jsonb,
  recent jsonb not null default '[]'::jsonb,
  top_content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.account_analyzer_runs enable row level security;

drop policy if exists "account analyzer runs owner all" on public.account_analyzer_runs;
create policy "account analyzer runs owner all" on public.account_analyzer_runs
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists account_analyzer_runs_user_created_idx
  on public.account_analyzer_runs (user_id, created_at desc);

notify pgrst, 'reload schema';
