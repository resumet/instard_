import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeDeepReel } from "@/lib/ai";
import { extractAudioWav, mediaFileName } from "@/lib/media";
import { buildTranscriptScenes } from "@/lib/reel-detail-analysis";
import { transcribeAudioDetailed, type TranscriptionSegment } from "@/lib/transcription";
import type { CompetitorReel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string(),
  thumbnail_url: z.string().nullable().optional()
});

const reelSchema = z.object({
  id: z.string(),
  competitor_account_id: z.string().default("account-analyzer"),
  reel_url: z.string(),
  shortcode: z.string(),
  media_type: z.enum(["post", "reel", "video", "carousel"]).optional(),
  media_items: z.array(mediaItemSchema).optional(),
  caption: z.string().default(""),
  hashtags: z.array(z.string()).default([]),
  thumbnail_url: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  duration_seconds: z.number().nullable().optional(),
  view_count: z.number().default(0),
  like_count: z.number().default(0),
  comment_count: z.number().default(0),
  posted_at: z.string().nullable().optional(),
  performance_score: z.number().default(0),
  is_top_performer: z.boolean().default(true)
});

const schema = z.object({
  reel: reelSchema
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const reel = input.reel as CompetitorReel;
    const videoUrl = reel.video_url || reel.media_items?.find((item) => item.type === "video")?.url;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "이 릴스에는 다운로드 가능한 영상 URL이 없어 음성을 추출할 수 없습니다." },
        { status: 400 }
      );
    }

    const audio = await extractAudioWav(videoUrl);
    const transcription = await transcribeAudioDetailed(audio, mediaFileName(reel, "wav"));

    if (!transcription.text.trim()) {
      return NextResponse.json(
        { error: "음성 파일에서 스크립트를 추출하지 못했습니다." },
        { status: 502 }
      );
    }

    const transcript = transcription.text;
    const transcriptSegments = transcription.segments;
    const scenes = buildScenes(reel, transcript, transcriptSegments);
    const analysis = await analyzeDeepReel({ reel, transcript, transcriptSegments });

    return NextResponse.json({
      transcript,
      audioTranscript: transcript,
      transcriptSegments,
      transcriptionStatus: "success",
      transcriptionSource: "audio",
      transcriptionError: null,
      scenes,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "릴스 음성 스크립트 분석에 실패했습니다." },
      { status: 500 }
    );
  }
}

function buildScenes(reel: CompetitorReel, transcript: string, transcriptSegments: TranscriptionSegment[]) {
  if (!transcriptSegments.length) return buildTranscriptScenes(reel, transcript);

  return transcriptSegments.map((segment, index) => ({
    time: `${formatSeconds(segment.start)}~${formatSeconds(segment.end)}`,
    role: index === 0 ? "후킹" : index === transcriptSegments.length - 1 ? "정리" : "전개",
    script: segment.text,
    visual: "릴스 음성 타임스탬프 기준 구간입니다.",
    edit: "발화가 바뀌는 지점에 맞춰 컷/자막 전환을 점검하세요."
  }));
}

function formatSeconds(value: number) {
  return `${Math.max(0, Number(value.toFixed(2)))}초`;
}
