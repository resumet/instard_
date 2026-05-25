"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseBrowserEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!hasSupabaseBrowserEnv()) return null;
  return createBrowserClient(env.supabaseUrl!, env.supabaseAnonKey!);
}
