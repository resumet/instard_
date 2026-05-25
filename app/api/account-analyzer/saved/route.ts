import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/projects";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const saveSchema = z.object({
  target: z.string().min(1),
  account: z.record(z.unknown()).nullable().optional(),
  recent: z.array(z.record(z.unknown())).default([]),
  topContent: z.array(z.record(z.unknown())).default([])
});

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) throw new Error("Supabase service role 환경변수가 필요합니다.");

    const userId = await getCurrentUserId();
    let query = supabase
      .from("account_analyzer_runs")
      .select("id,target,instagram_handle,profile_url,created_at")
      .order("created_at", { ascending: false })
      .limit(30);

    query = userId ? query.eq("user_id", userId) : query.is("user_id", null);
    const { data, error } = await query;
    if (error) throw new Error(toSupabaseSaveError(error.message));

    return NextResponse.json({ runs: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "저장된 분석 목록을 불러오지 못했습니다." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const input = saveSchema.parse(await request.json());
    const supabase = createSupabaseAdminClient();
    if (!supabase) throw new Error("Supabase service role 환경변수가 필요합니다.");

    const userId = await getCurrentUserId();
    const account = input.account ?? {};
    const instagramHandle = typeof account.instagram_handle === "string" ? account.instagram_handle : null;
    const profileUrl = typeof account.profile_url === "string" ? account.profile_url : null;

    const { data, error } = await supabase
      .from("account_analyzer_runs")
      .insert({
        user_id: userId,
        target: input.target,
        instagram_handle: instagramHandle,
        profile_url: profileUrl,
        account,
        recent: input.recent,
        top_content: input.topContent
      })
      .select("id,target,instagram_handle,profile_url,created_at")
      .single();

    if (error) throw new Error(toSupabaseSaveError(error.message));
    return NextResponse.json({ run: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "계정 분석을 저장하지 못했습니다." },
      { status: 400 }
    );
  }
}

function toSupabaseSaveError(message: string) {
  if (message.includes("account_analyzer_runs") && message.includes("schema cache")) {
    return "Supabase에 account_analyzer_runs 테이블이 아직 적용되지 않았습니다. 마이그레이션을 실행한 뒤 schema cache를 새로고침해주세요.";
  }
  return message;
}
