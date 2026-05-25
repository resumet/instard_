import { NextResponse } from "next/server";
import { z } from "zod";
import { getApifyDataset } from "@/lib/apify";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getProject, isUuid } from "@/lib/projects";
import type { CompetitorReel } from "@/lib/types";

const resultSchema = z.object({
  projectId: z.string(),
  datasetId: z.string().default("demo-dataset"),
  target: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const input = resultSchema.parse(await request.json());
    const project = await getProject(input.projectId);
    if (!project) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
    }

    const result = await getApifyDataset(input.datasetId);
    const supabase = createSupabaseAdminClient();
    const canPersist = supabase && isUuid(input.projectId);

    if (canPersist) {
      const { id: _accountId, ...accountInsert } = result.account;
      const { data: account, error: accountError } = await supabase
        .from("competitor_accounts")
        .insert({
          ...accountInsert,
          project_id: input.projectId,
          analyzed_at: new Date().toISOString()
        })
        .select("*")
        .single();

      if (accountError) throw new Error(accountError.message);

      const reels = result.reels.map((reel) => toReelInsertPayload(reel, account.id));
      let savedReels = result.reels;
      const { data: insertedReels, error: reelsError } = await supabase
        .from("competitor_reels")
        .insert(reels)
        .select("*");

      if (reelsError && reelsError.message.includes("media_type")) {
        const fallbackReels = reels.map(({ media_type, ...reel }) => reel);
        const { data: fallbackInsertedReels, error: fallbackError } = await supabase
          .from("competitor_reels")
          .insert(fallbackReels)
          .select("*");
        if (fallbackError) throw new Error(fallbackError.message);
        savedReels = (fallbackInsertedReels ?? []).map((reel) => ({
          ...reel,
          media_type: reel.video_url ? "reel" : "post"
        }));
      } else if (reelsError && reelsError.message.includes("invalid input syntax for type integer")) {
        const roundedReels = reels.map((reel) => ({
          ...reel,
          duration_seconds:
            typeof reel.duration_seconds === "number" ? Math.round(reel.duration_seconds) : reel.duration_seconds
        }));
        const { data: roundedInsertedReels, error: roundedError } = await supabase
          .from("competitor_reels")
          .insert(roundedReels)
          .select("*");
        if (roundedError) throw new Error(roundedError.message);
        savedReels = roundedInsertedReels ?? [];
      } else if (reelsError) {
        throw new Error(reelsError.message);
      } else {
        savedReels = insertedReels ?? [];
      }

      return NextResponse.json({ account, reels: savedReels, persisted: true });
    }

    return NextResponse.json({ ...result, persisted: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "결과 저장 실패" },
      { status: 400 }
    );
  }
}

function toReelInsertPayload(reel: CompetitorReel, competitorAccountId: string) {
  const {
    id: _id,
    competitor_account_id: _competitorAccountId,
    media_items: _mediaItems,
    ...insertPayload
  } = reel;

  return {
    ...insertPayload,
    competitor_account_id: competitorAccountId
  };
}
