import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeReel } from "@/lib/ai";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const schema = z.object({
  reelId: z.string().optional(),
  caption: z.string().default(""),
  transcript: z.string().optional(),
  view_count: z.number().default(0),
  like_count: z.number().default(0),
  comment_count: z.number().default(0),
  duration_seconds: z.number().nullable().optional(),
  account_avg_views: z.number().nullable().optional()
});

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  const analysis = await analyzeReel(input);
  const supabase = createSupabaseAdminClient();

  if (supabase && input.reelId) {
    await supabase.from("reel_analyses").insert({
      reel_id: input.reelId,
      hook_analysis: analysis.hook_analysis,
      script_structure: analysis.script_structure,
      emotional_triggers: analysis.emotional_triggers,
      cta_analysis: analysis.cta_analysis,
      content_format: analysis.content_format,
      success_factors: analysis.success_factors,
      improvement_notes: analysis.cautions
    });
  }

  return NextResponse.json({ analysis });
}
