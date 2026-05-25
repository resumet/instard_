import { NextResponse } from "next/server";
import { z } from "zod";
import { demoProject } from "@/lib/demo-data";
import { env } from "@/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const projectSchema = z.object({
  name: z.string().min(1),
  topic: z.string().default(""),
  target_audience: z.string().default(""),
  goal: z.string().default("브랜딩"),
  tone: z.string().default("")
});

export async function POST(request: Request) {
  const input = projectSchema.parse(await request.json());
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({
      demo: true,
      persisted: false,
      reason: "Supabase 서버 환경변수가 없습니다.",
      project: { ...demoProject, ...input, id: "demo-project" }
    });
  }

  const authClient = await createSupabaseServerClient();
  const {
    data: { user }
  } = authClient ? await authClient.auth.getUser() : { data: { user: null } };

  if (!user && !env.authRequired) {
    return NextResponse.json({
      demo: true,
      persisted: false,
      reason: "로그인 없는 분석 모드라 user_id가 필요한 Supabase 저장은 생략합니다.",
      project: { ...demoProject, ...input, id: "demo-project" }
    });
  }

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name,
      topic: input.topic,
      target_audience: input.target_audience,
      goal: input.goal,
      tone: input.tone
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ project: data, persisted: true });
}
