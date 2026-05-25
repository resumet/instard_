import { NextResponse } from "next/server";
import { extractAudioMp3, mediaFileName } from "@/lib/media";
import { getProject, getProjectReel, isUuid } from "@/lib/projects";
import { buildTranscriptScenes } from "@/lib/reel-detail-analysis";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { transcribeMp3 } from "@/lib/transcription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; reelId: string }> }
) {
  try {
    const { projectId, reelId } = await params;
    const project = await getProject(projectId);
    if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });

    const reel = await getProjectReel(projectId, reelId);
    if (!reel) return NextResponse.json({ error: "릴스를 찾을 수 없습니다." }, { status: 404 });
    if (!reel.video_url) return NextResponse.json({ error: "전사할 영상 URL이 없습니다." }, { status: 400 });

    const audio = await extractAudioMp3(reel.video_url);
    const transcript = await transcribeMp3(audio, mediaFileName(reel, "mp3"));
    const scenes = buildTranscriptScenes(reel, transcript);

    const supabase = createSupabaseAdminClient();
    if (supabase && isUuid(reel.id)) {
      await supabase.from("reel_transcripts").insert({
        reel_id: reel.id,
        raw_transcript: transcript,
        cleaned_transcript: transcript,
        language: "ko",
        confidence_score: null
      });
    }

    return NextResponse.json({
      transcript,
      scenes,
      persisted: Boolean(supabase && isUuid(reel.id))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "음성 텍스트 추출 실패" },
      { status: 500 }
    );
  }
}
