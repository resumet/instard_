import { demoAccount, demoGeneratedReel, demoProject, demoReels } from "@/lib/demo-data";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import type { CompetitorAccount, CompetitorReel, GeneratedReel, Project } from "@/lib/types";

export type ReelTranscript = {
  id: string;
  reel_id: string;
  raw_transcript?: string | null;
  cleaned_transcript?: string | null;
  language?: string | null;
  confidence_score?: number | null;
  created_at?: string;
};

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listProjects(): Promise<Project[]> {
  const userId = await getCurrentUserId();
  const supabase = createSupabaseAdminClient();
  if (!supabase || !userId) return [demoProject];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  return data as Project[];
}

export async function getProject(projectId: string): Promise<Project | null> {
  if (!isUuid(projectId)) return projectId === demoProject.id ? demoProject : null;

  const userId = await getCurrentUserId();
  const supabase = createSupabaseAdminClient();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data as Project;
}

export async function getProjectAnalysisData(projectId: string): Promise<{
  accounts: CompetitorAccount[];
  reels: CompetitorReel[];
  outputs: GeneratedReel[];
}> {
  if (!isUuid(projectId)) {
    return {
      accounts: [demoAccount],
      reels: demoReels,
      outputs: [demoGeneratedReel]
    };
  }

  const userId = await getCurrentUserId();
  const supabase = createSupabaseAdminClient();
  if (!supabase || !userId) return { accounts: [], reels: [], outputs: [] };

  const { data: accounts } = await supabase
    .from("competitor_accounts")
    .select("*, projects!inner(user_id)")
    .eq("project_id", projectId)
    .eq("projects.user_id", userId)
    .order("created_at", { ascending: false });

  const accountIds = (accounts ?? []).map((account) => account.id);
  const { data: reels } = accountIds.length
    ? await supabase
        .from("competitor_reels")
        .select("*")
        .in("competitor_account_id", accountIds)
        .order("performance_score", { ascending: false })
    : { data: [] };

  const { data: outputs } = await supabase
    .from("generated_reels")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return {
    accounts: (accounts ?? []).map(({ projects, ...account }) => account) as CompetitorAccount[],
    reels: (reels ?? []).map((reel) => ({
      ...reel,
      media_type: reel.media_type ?? (reel.video_url ? "reel" : "post")
    })) as CompetitorReel[],
    outputs: (outputs ?? []).map((output) => ({
      title: output.title,
      target_duration_seconds: output.target_duration_seconds,
      hook: output.hook,
      full_script: output.script,
      scene_lines: output.storyboard ?? [],
      captions: output.captions ?? [],
      cta: output.cta,
      alternative_hooks: [],
      alternative_titles: [],
      thumbnail_text: "",
      video_style: output.video_style ?? {},
      disclaimer: "프로젝트 내 분석 데이터를 기반으로 생성된 결과입니다."
    })) as GeneratedReel[]
  };
}

export async function getProjectReel(projectId: string, reelId: string): Promise<CompetitorReel | null> {
  const { reels } = await getProjectAnalysisData(projectId);
  return reels.find((reel) => reel.id === reelId || reel.shortcode === reelId) ?? null;
}

export async function getLatestReelTranscript(projectId: string, reelId: string): Promise<ReelTranscript | null> {
  if (!isUuid(projectId) || !isUuid(reelId)) return null;

  const userId = await getCurrentUserId();
  const supabase = createSupabaseAdminClient();
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("reel_transcripts")
    .select(
      `
      *,
      competitor_reels!inner(
        competitor_accounts!inner(
          projects!inner(user_id)
        )
      )
    `
    )
    .eq("reel_id", reelId)
    .eq("competitor_reels.competitor_accounts.projects.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const { competitor_reels, ...transcript } = data;
  return transcript as ReelTranscript;
}
