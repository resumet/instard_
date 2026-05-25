export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Project = {
  id: string;
  user_id?: string;
  name: string;
  topic: string;
  target_audience: string;
  goal: string;
  tone: string;
  created_at?: string;
};

export type CompetitorAccount = {
  id: string;
  project_id: string;
  instagram_handle: string;
  profile_url: string;
  display_name: string;
  bio?: string | null;
  follower_count?: number | null;
  following_count?: number | null;
  post_count?: number | null;
  avg_views?: number | null;
  avg_likes?: number | null;
  avg_comments?: number | null;
};

export type CompetitorReel = {
  id: string;
  competitor_account_id: string;
  reel_url: string;
  shortcode: string;
  media_type?: "post" | "reel" | "video" | "carousel";
  media_items?: Array<{
    type: "image" | "video";
    url: string;
    thumbnail_url?: string | null;
  }>;
  caption: string;
  hashtags: string[];
  thumbnail_url?: string | null;
  video_url?: string | null;
  duration_seconds?: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  posted_at?: string | null;
  performance_score: number;
  is_top_performer: boolean;
};

export type ReelAnalysis = {
  performance_summary: string;
  hook_analysis: string;
  script_structure: string;
  emotional_triggers: string[];
  cta_analysis: string;
  content_format: string;
  success_factors: string[];
  reusable_patterns: string[];
  cautions: string[];
};

export type GeneratedReel = {
  title: string;
  target_duration_seconds: number;
  hook: string;
  full_script: string;
  scene_lines: Array<{
    time: string;
    visual: string;
    dialogue: string;
    caption: string;
    edit_point: string;
    b_roll: string;
    camera: string;
  }>;
  captions: string[];
  cta: string;
  alternative_hooks: string[];
  alternative_titles: string[];
  thumbnail_text: string;
  video_style: {
    concept: string;
    location: string;
    subtitle_style: string;
    music_mood: string;
    editing_tempo: string;
  };
  disclaimer: string;
};
