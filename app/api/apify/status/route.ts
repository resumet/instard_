import { NextResponse } from "next/server";
import { getApifyRunStatus } from "@/lib/apify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId가 필요합니다." }, { status: 400 });

  try {
    return NextResponse.json(await getApifyRunStatus(runId));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "상태 조회 실패" },
      { status: 400 }
    );
  }
}
