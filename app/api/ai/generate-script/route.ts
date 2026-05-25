import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReel } from "@/lib/ai";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { buildProjectInsightSummary } from "@/lib/insights";
import { getProject, getProjectAnalysisData, isUuid } from "@/lib/projects";

const schema = z.object({
  projectId: z.string(),
  topic: z.string().min(1),
  target_audience: z.string().default(""),
  core_message: z.string().default(""),
  product_or_service: z.string().default(""),
  tone: z.string().default(""),
  existing_script: z.string().optional(),
  target_duration_seconds: z.coerce.number().int().min(5).max(180)
});

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  const project = await getProject(input.projectId);
  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  const { accounts, reels } = await getProjectAnalysisData(input.projectId);
  const topReels = reels
    .slice()
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, 10);

  const generated = await generateReel({
    ...input,
    project: {
      name: project.name,
      topic: project.topic,
      target_audience: project.target_audience,
      goal: project.goal,
      tone: project.tone
    },
    analysis_summary: buildProjectInsightSummary(project, accounts, reels),
    competitor_patterns: topReels.map((reel) => ({
      reel_url: reel.reel_url,
      shortcode: reel.shortcode,
      caption: reel.caption,
      hashtags: reel.hashtags,
      duration_seconds: reel.duration_seconds,
      view_count: reel.view_count,
      like_count: reel.like_count,
      comment_count: reel.comment_count,
      performance_score: reel.performance_score,
      is_top_performer: reel.is_top_performer
    }))
  });

  const supabase = createSupabaseAdminClient();
  const canPersist = Boolean(supabase && isUuid(input.projectId));

  if (supabase && canPersist) {
    const { error } = await supabase.from("generated_reels").insert({
      project_id: input.projectId,
      source_reel_ids: topReels.map((reel) => reel.id).filter(isUuid),
      target_duration_seconds: generated.target_duration_seconds,
      title: generated.title,
      hook: generated.hook,
      script: generated.full_script,
      storyboard: generated.scene_lines,
      video_style: generated.video_style,
      captions: generated.captions,
      cta: generated.cta
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    generated,
    sourceReelCount: topReels.length,
    persisted: canPersist
  });
}
