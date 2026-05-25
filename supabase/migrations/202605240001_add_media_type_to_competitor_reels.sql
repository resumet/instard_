alter table public.competitor_reels
  add column if not exists media_type text not null default 'reel';

create index if not exists competitor_reels_media_type_idx
  on public.competitor_reels (media_type);

create index if not exists competitor_reels_posted_at_idx
  on public.competitor_reels (posted_at);
