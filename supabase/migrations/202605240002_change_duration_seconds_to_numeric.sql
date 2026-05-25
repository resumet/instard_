alter table public.competitor_reels
  alter column duration_seconds type numeric
  using duration_seconds::numeric;
