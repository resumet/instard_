export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  apifyToken: process.env.APIFY_TOKEN,
  apifyInstagramActorId:
    process.env.APIFY_INSTAGRAM_ACTOR_ID ?? "apify/instagram-scraper",
  openaiApiKey: process.env.OPENAI_API_KEY,
  authRequired: process.env.AUTH_REQUIRED === "true"
};

export function hasSupabaseBrowserEnv() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function hasSupabaseAdminEnv() {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}
