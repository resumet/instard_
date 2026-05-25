import { NextResponse } from "next/server";
import { z } from "zod";
import { getApifyDataset } from "@/lib/apify";
import { getRecentTopContent } from "@/lib/content-groups";

const resultSchema = z.object({
  datasetId: z.string().default("demo-dataset")
});

export async function POST(request: Request) {
  try {
    const input = resultSchema.parse(await request.json());
    const result = await getApifyDataset(input.datasetId);
    const grouped = getRecentTopContent(result.reels, 10);

    return NextResponse.json({
      account: result.account,
      recent: grouped.recent,
      topContent: grouped.topContent,
      topPosts: grouped.topPosts,
      topReels: grouped.topReels
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계정 분석 결과를 불러오지 못했습니다." },
      { status: 400 }
    );
  }
}
