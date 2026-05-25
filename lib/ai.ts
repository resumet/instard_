import OpenAI from "openai";
import { demoGeneratedReel } from "@/lib/demo-data";
import { env } from "@/lib/env";
import type { GeneratedReel, ReelAnalysis } from "@/lib/types";

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

export async function analyzeReel(input: {
  caption: string;
  transcript?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration_seconds?: number | null;
  account_avg_views?: number | null;
}): Promise<ReelAnalysis> {
  if (!openai) return fallbackReelAnalysis(input);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "너는 인스타그램 릴스 성과 분석가다. 원본 문장을 복제하지 않고 구조와 패턴만 분석한다. JSON만 출력한다."
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "릴스 성과 분석",
          expected_schema: {
            performance_summary: "string",
            hook_analysis: "string",
            script_structure: "string",
            emotional_triggers: ["string"],
            cta_analysis: "string",
            content_format: "string",
            success_factors: ["string"],
            reusable_patterns: ["string"],
            cautions: ["string"]
          },
          input
        })
      }
    ]
  });

  return JSON.parse(completion.choices[0]?.message.content ?? "{}") as ReelAnalysis;
}

export async function analyzeUserStyle(input: { scripts: string; tone?: string }) {
  if (!openai) {
    return {
      tone_summary: input.tone || "현실적이고 친근한 조언형",
      frequent_expressions: ["지금 확인해보세요", "막막하다면", "핵심은"],
      strengths: ["문제 제기가 구체적임", "행동 지시가 명확함"],
      improvements: ["초반 훅을 더 짧게 압축", "CTA를 저장/상담 중 하나로 고정"],
      generation_rules: ["짧은 문장 위주", "한 영상에 메시지 하나", "마지막은 행동 CTA"]
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "사용자의 기존 릴스 스크립트에서 말투와 구성 규칙을 추출한다. JSON만 출력한다."
      },
      { role: "user", content: JSON.stringify(input) }
    ]
  });

  return JSON.parse(completion.choices[0]?.message.content ?? "{}");
}

export async function generateReel(input: {
  project?: {
    name: string;
    topic: string;
    target_audience: string;
    goal: string;
    tone: string;
  };
  topic: string;
  target_audience: string;
  core_message: string;
  product_or_service: string;
  tone: string;
  existing_script?: string;
  target_duration_seconds: number;
  competitor_patterns?: unknown;
  analysis_summary?: unknown;
}): Promise<GeneratedReel> {
  if (!openai) {
    return {
      ...demoGeneratedReel,
      target_duration_seconds: input.target_duration_seconds,
      title: `${input.topic} 릴스 기획안`,
      video_style: {
        ...demoGeneratedReel.video_style,
        concept: `${input.tone} 톤의 문제 제기형 릴스`
      },
      disclaimer:
        "OpenAI 키가 없어서 데모 생성물을 표시했습니다. 실제 키가 있으면 프로젝트 내 분석 데이터 기반으로 생성합니다."
    };
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "너는 한국어 릴스 스크립트와 촬영 콘티를 만드는 콘텐츠 디렉터다. 반드시 사용자가 지정한 프로젝트 주제와 타깃을 중심으로 기획한다. competitor_patterns에는 현재 프로젝트 안에서 분석된 릴스만 들어온다. 다른 프로젝트 데이터나 일반 지식을 경쟁사 데이터처럼 섞지 않는다. 경쟁사 원문을 복제하지 말고 성과 구조, 훅 방식, 전개 방식, CTA 패턴만 참고해 완전히 새 문장으로 작성한다. JSON만 출력한다."
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "프로젝트 주제 기반 릴스 스크립트와 촬영 콘티 생성",
          rules: [
            "프로젝트 주제와 입력된 핵심 메시지를 벗어나지 않는다.",
            "competitor_patterns의 문장을 그대로 복사하지 않는다.",
            "분석 데이터가 부족하면 부족하다고 전제하고 더 보수적으로 생성한다.",
            "장면별 콘티는 실제 촬영 가능한 화면 지시로 작성한다."
          ],
          expected_schema: {
            title: "string",
            target_duration_seconds: "number",
            hook: "string",
            full_script: "string",
            scene_lines: [
              {
                time: "string",
                visual: "string",
                dialogue: "string",
                caption: "string",
                edit_point: "string",
                b_roll: "string",
                camera: "string"
              }
            ],
            captions: ["string"],
            cta: "string",
            alternative_hooks: ["string"],
            alternative_titles: ["string"],
            thumbnail_text: "string",
            video_style: {
              concept: "string",
              location: "string",
              subtitle_style: "string",
              music_mood: "string",
              editing_tempo: "string"
            },
            disclaimer: "string"
          },
          input
        })
      }
    ]
  });

  return JSON.parse(completion.choices[0]?.message.content ?? "{}") as GeneratedReel;
}

function fallbackReelAnalysis(input: {
  caption: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  account_avg_views?: number | null;
}): ReelAnalysis {
  const multiplier = input.account_avg_views
    ? (input.view_count / input.account_avg_views).toFixed(1)
    : "상위";
  return {
    performance_summary: `이 릴스는 기준 조회수 대비 ${multiplier} 수준의 성과를 보이며 초반 문제 제기가 강합니다.`,
    hook_analysis: "첫 문장에서 시청자의 현재 불안이나 손실 가능성을 바로 건드립니다.",
    script_structure: "Hook → Problem → Solution → CTA",
    emotional_triggers: ["손실 회피", "노후 불안", "지금 확인해야 한다는 긴급성"],
    cta_analysis: "저장, 댓글, 상담처럼 한 가지 행동으로 좁히면 전환이 더 명확합니다.",
    content_format: "문제 제기형",
    success_factors: ["구체적인 타깃 호명", "짧은 문장", "실행 가능한 한 가지 팁"],
    reusable_patterns: ["질문형 훅", "불안을 숫자로 구체화", "마지막에 체크리스트 제공"],
    cautions: ["원본 문장 복제 금지", "공포감만 주지 말고 해결 기대감을 함께 제시"]
  };
}
