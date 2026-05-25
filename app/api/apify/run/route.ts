import { NextResponse } from "next/server";
import { z } from "zod";
import { startInstagramScrape } from "@/lib/apify";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getProject, isUuid } from "@/lib/projects";

const runSchema = z.object({
  projectId: z.string(),
  target: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(30)
});

export async function POST(request: Request) {
  try {
    const input = runSchema.parse(await request.json());
    const project = await getProject(input.projectId);
    if (!project) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
    }

    const result = await startInstagramScrape(input);
    const supabase = createSupabaseAdminClient();
    const canPersist = supabase && isUuid(input.projectId);

    if (canPersist) {
      await supabase.from("apify_runs").insert({
        project_id: input.projectId,
        actor_id: process.env.APIFY_INSTAGRAM_ACTOR_ID ?? "apify/instagram-scraper",
        run_id: result.runId,
        input_payload: input,
        status: result.status,
        result_dataset_id: result.datasetId,
        started_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ ...result, persisted: Boolean(canPersist) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Apify 실행 실패" },
      { status: 400 }
    );
  }
}
