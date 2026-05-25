import { NextResponse } from "next/server";
import { getCurrentUserId, isUuid } from "@/lib/projects";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    if (!isUuid(runId)) return NextResponse.json({ error: "올바르지 않은 저장 ID입니다." }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    if (!supabase) throw new Error("Supabase service role 환경변수가 필요합니다.");

    const userId = await getCurrentUserId();
    let query = supabase.from("account_analyzer_runs").select("*").eq("id", runId);
    query = userId ? query.eq("user_id", userId) : query.is("user_id", null);
    const { data, error } = await query.single();
    if (error) throw new Error(toSupabaseSaveError(error.message));

    return NextResponse.json({
      run: {
        id: data.id,
        target: data.target,
        instagram_handle: data.instagram_handle,
        profile_url: data.profile_url,
        created_at: data.created_at,
        account: data.account,
        recent: data.recent,
        topContent: data.top_content
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "저장된 분석을 불러오지 못했습니다." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const { runId } = await params;
    if (!isUuid(runId)) return NextResponse.json({ error: "올바르지 않은 저장 ID입니다." }, { status: 400 });

    const supabase = createSupabaseAdminClient();
    if (!supabase) throw new Error("Supabase service role 환경변수가 필요합니다.");

    const userId = await getCurrentUserId();
    let query = supabase.from("account_analyzer_runs").delete().eq("id", runId);
    query = userId ? query.eq("user_id", userId) : query.is("user_id", null);
    const { error } = await query;
    if (error) throw new Error(toSupabaseSaveError(error.message));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "저장된 분석을 삭제하지 못했습니다." },
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
