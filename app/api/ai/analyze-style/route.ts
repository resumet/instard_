import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeUserStyle } from "@/lib/ai";

const schema = z.object({
  scripts: z.string().min(1),
  tone: z.string().optional()
});

export async function POST(request: Request) {
  const style = await analyzeUserStyle(schema.parse(await request.json()));
  return NextResponse.json({ style });
}
