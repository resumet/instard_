create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  topic text not null default '',
  target_audience text not null default '',
  goal text not null default '',
  tone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.competitor_accounts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  instagram_handle text not null,
  profile_url text not null,
  display_name text not null,
  bio text,
  follower_count integer,
  following_count integer,
  post_count integer,
  avg_views integer,
  avg_likes integer,
  avg_comments integer,
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.competitor_reels (
  id uuid primary key default gen_random_uuid(),
  competitor_account_id uuid not null references public.competitor_accounts(id) on delete cascade,
  reel_url text not null,
  shortcode text not null,
  caption text not null default '',
  hashtags text[] not null default '{}',
  thumbnail_url text,
  video_url text,
  duration_seconds integer,
  view_count integer not null default 0,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  posted_at timestamptz,
  performance_score numeric not null default 0,
  is_top_performer boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reel_transcripts (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.competitor_reels(id) on delete cascade,
  raw_transcript text,
  cleaned_transcript text,
  language text,
  confidence_score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.reel_analyses (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.competitor_reels(id) on delete cascade,
  hook_analysis jsonb,
  script_structure jsonb,
  emotional_triggers jsonb,
  cta_analysis jsonb,
  content_format text,
  success_factors jsonb,
  improvement_notes jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text,
  script_text text not null,
  style_summary jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_reels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_reel_ids uuid[] not null default '{}',
  target_duration_seconds integer not null,
  title text not null,
  hook text not null,
  script text not null,
  storyboard jsonb not null,
  video_style jsonb not null,
  captions jsonb not null,
  cta text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.apify_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id text not null,
  run_id text,
  input_payload jsonb not null,
  status text not null,
  result_dataset_id text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.competitor_accounts enable row level security;
alter table public.competitor_reels enable row level security;
alter table public.reel_transcripts enable row level security;
alter table public.reel_analyses enable row level security;
alter table public.user_scripts enable row level security;
alter table public.generated_reels enable row level security;
alter table public.apify_runs enable row level security;

create policy "profiles owner select" on public.profiles for select using (auth.uid() = id);
create policy "profiles owner update" on public.profiles for update using (auth.uid() = id);
create policy "profiles owner insert" on public.profiles for insert with check (auth.uid() = id);

create policy "projects owner all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "competitor accounts owner all" on public.competitor_accounts
  for all using (
    exists (
      select 1 from public.projects
      where projects.id = competitor_accounts.project_id
      and projects.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = competitor_accounts.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "competitor reels owner all" on public.competitor_reels
  for all using (
    exists (
      select 1 from public.competitor_accounts ca
      join public.projects p on p.id = ca.project_id
      where ca.id = competitor_reels.competitor_account_id
      and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.competitor_accounts ca
      join public.projects p on p.id = ca.project_id
      where ca.id = competitor_reels.competitor_account_id
      and p.user_id = auth.uid()
    )
  );

create policy "reel transcripts owner all" on public.reel_transcripts
  for all using (
    exists (
      select 1 from public.competitor_reels cr
      join public.competitor_accounts ca on ca.id = cr.competitor_account_id
      join public.projects p on p.id = ca.project_id
      where cr.id = reel_transcripts.reel_id
      and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.competitor_reels cr
      join public.competitor_accounts ca on ca.id = cr.competitor_account_id
      join public.projects p on p.id = ca.project_id
      where cr.id = reel_transcripts.reel_id
      and p.user_id = auth.uid()
    )
  );

create policy "reel analyses owner all" on public.reel_analyses
  for all using (
    exists (
      select 1 from public.competitor_reels cr
      join public.competitor_accounts ca on ca.id = cr.competitor_account_id
      join public.projects p on p.id = ca.project_id
      where cr.id = reel_analyses.reel_id
      and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.competitor_reels cr
      join public.competitor_accounts ca on ca.id = cr.competitor_account_id
      join public.projects p on p.id = ca.project_id
      where cr.id = reel_analyses.reel_id
      and p.user_id = auth.uid()
    )
  );

create policy "user scripts owner all" on public.user_scripts
  for all using (
    exists (select 1 from public.projects where projects.id = user_scripts.project_id and projects.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects where projects.id = user_scripts.project_id and projects.user_id = auth.uid())
  );

create policy "generated reels owner all" on public.generated_reels
  for all using (
    exists (select 1 from public.projects where projects.id = generated_reels.project_id and projects.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects where projects.id = generated_reels.project_id and projects.user_id = auth.uid())
  );

create policy "apify runs owner all" on public.apify_runs
  for all using (
    exists (select 1 from public.projects where projects.id = apify_runs.project_id and projects.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects where projects.id = apify_runs.project_id and projects.user_id = auth.uid())
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
