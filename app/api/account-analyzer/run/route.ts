import { NextResponse } from "next/server";
import { z } from "zod";
import { startInstagramScrape } from "@/lib/apify";

const runSchema = z.object({
  target: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(30)
});

export async function POST(request: Request) {
  try {
    const input = runSchema.parse(await request.json());
    const result = await startInstagramScrape({
      projectId: "account-analyzer",
      target: input.target,
      limit: input.limit
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계정 분석 실행에 실패했습니다." },
      { status: 400 }
    );
  }
}
