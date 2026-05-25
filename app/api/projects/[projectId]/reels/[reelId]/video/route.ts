import { NextResponse } from "next/server";
import { downloadVideoBuffer, mediaFileName } from "@/lib/media";
import { getProject, getProjectReel } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; reelId: string }> }
) {
  try {
    const { projectId, reelId } = await params;
    const project = await getProject(projectId);
    if (!project) return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });

    const reel = await getProjectReel(projectId, reelId);
    if (!reel) return NextResponse.json({ error: "릴스를 찾을 수 없습니다." }, { status: 404 });
    if (!reel.video_url) return NextResponse.json({ error: "다운로드 가능한 영상 URL이 없습니다." }, { status: 400 });

    const { buffer, contentType } = await downloadVideoBuffer(reel.video_url);
    return new NextResponse(buffer, {
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${mediaFileName(reel, "mp4")}"`,
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "영상 다운로드 실패" },
      { status: 500 }
    );
  }
}
