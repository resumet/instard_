import OpenAI from "openai";
import { demoGeneratedReel } from "@/lib/demo-data";
import { env } from "@/lib/env";
import type { TranscriptionSegment } from "@/lib/transcription";
import type { CompetitorReel, DeepReelAnalysis, GeneratedReel, ReelAnalysis } from "@/lib/types";

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

export async function analyzeDeepReel(input: {
  reel: CompetitorReel;
  transcript: string;
  transcriptSegments?: TranscriptionSegment[];
}): Promise<DeepReelAnalysis> {
  if (!openai) return fallbackDeepReelAnalysis(input.reel, input.transcript, input.transcriptSegments);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a Korean Instagram Reels strategist. Analyze why a video performed well. Do not copy the original wording as reusable copy. Return only valid JSON in Korean."
        },
        {
          role: "user",
          content: JSON.stringify({
            task: "Deep analysis for a high-performing Instagram Reel",
            rules: [
              "Analyze the viewer storyboard, hook structure, scene transitions, cut split, emotional flow, target audience, and weaknesses.",
              "Create timeline segments with start/end seconds, topic, script summary, cut analysis, transition detail, and viewer emotion.",
              "Explain six concrete devices that likely produced the result.",
              "Explain three details in the first three seconds.",
              "Suggest five ways to create another high-performing video from this pattern.",
              "Use Korean. Keep each card concrete and actionable."
            ],
            expected_schema: {
              summary: "string",
              target_audience: "string",
              target_emotion: "string",
              storyboard: ["string"],
              hook_structure: ["string"],
              first_three_seconds: ["string"],
              six_success_devices: [{ title: "string", detail: "string" }],
              shortcomings: "string",
              remake_methods: [{ title: "string", detail: "string" }],
              segments: [
                {
                  start: "number",
                  end: "number",
                  title: "string",
                  script: "string",
                  viewer_storyboard: "string",
                  hook_role: "string",
                  cut_analysis: "string",
                  transition_detail: "string",
                  emotion: "string"
                }
              ],
              cut_transition_details: ["string"]
            },
            input
          })
        }
      ]
    });

    const normalized = normalizeDeepReelAnalysis(
      JSON.parse(completion.choices[0]?.message.content ?? "{}") as Partial<DeepReelAnalysis>,
      input.reel,
      input.transcript,
      input.transcriptSegments
    );
    return withTranscriptionTiming(normalized, input.transcriptSegments);
  } catch (error) {
    console.warn("OpenAI deep reel analysis failed, using fallback analysis.", error);
    return fallbackDeepReelAnalysis(input.reel, input.transcript, input.transcriptSegments);
  }
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

function fallbackDeepReelAnalysis(
  reel: CompetitorReel,
  transcript: string,
  transcriptSegments?: TranscriptionSegment[]
): DeepReelAnalysis {
  const segments = buildFallbackSegments(reel, transcript, transcriptSegments);
  return {
    summary:
      "이 영상은 초반에 궁금증을 만들고, 중반에는 문제를 구체화한 뒤, 후반에는 시청자가 바로 이해할 수 있는 결론으로 닫는 구조입니다.",
    target_audience:
      "주제에 관심은 있지만 아직 확신이 부족한 초보 시청자, 빠르게 핵심만 알고 싶은 잠재 고객층입니다.",
    target_emotion:
      "놓치면 손해 볼 것 같은 긴장감, 지금 확인하면 해결할 수 있다는 안도감, 댓글이나 저장으로 이어지는 실용 감정입니다.",
    storyboard: [
      "시청자는 첫 문장에서 자신의 문제와 연결되는 질문을 만납니다.",
      "중간 구간에서 왜 중요한지 설명을 듣고 머릿속으로 상황을 재구성합니다.",
      "마지막에는 다음 행동을 할 명분을 얻습니다."
    ],
    hook_structure: [
      "첫 1초: 익숙한 문제를 단정적으로 제시합니다.",
      "1~3초: 반전 또는 비교 구도로 계속 보게 만듭니다.",
      "3초 이후: 설명이 아니라 해답을 줄 것이라는 기대를 만듭니다."
    ],
    first_three_seconds: [
      "핵심 키워드를 화면과 말의 앞쪽에 배치해 이탈 전에 주제를 인식시킵니다.",
      "질문형 또는 비교형 문장으로 시청자가 자기 상황을 대입하게 만듭니다.",
      "불필요한 인트로 없이 바로 본론으로 들어가 스크롤을 멈추게 합니다."
    ],
    six_success_devices: [
      { title: "즉시성", detail: "처음부터 본론을 제시해 시청자가 기다릴 이유를 만듭니다." },
      { title: "자기 관련성", detail: "시청자가 자신의 문제처럼 느끼는 표현을 앞에 둡니다." },
      { title: "구체적 근거", detail: "추상적인 주장보다 원인과 결과를 이어 설명합니다." },
      { title: "짧은 컷 리듬", detail: "문장 단위로 화면 집중점을 바꿔 지루함을 줄입니다." },
      { title: "감정의 완급", detail: "불안에서 이해, 이해에서 행동으로 감정 흐름을 이동시킵니다." },
      { title: "저장 가치", detail: "나중에 다시 볼 만한 정보 구조를 만들어 저장 가능성을 높입니다." }
    ],
    shortcomings:
      "후반 CTA가 약하면 반응은 좋아도 전환으로 이어지기 어렵습니다. 다음 영상에서는 댓글 질문, 저장 이유, 다음 행동을 더 명확히 고정하는 것이 좋습니다.",
    remake_methods: [
      { title: "비교 후킹", detail: "A보다 B가 더 중요한 이유처럼 반전 비교로 시작합니다." },
      { title: "실수 경고", detail: "초보자가 자주 놓치는 한 가지를 초반에 제시합니다." },
      { title: "체크리스트화", detail: "내용을 3단계 또는 5가지 체크포인트로 나눕니다." },
      { title: "사례 전환", detail: "설명 중간에 실제 상황 예시를 넣어 이해 시간을 줄입니다." },
      { title: "댓글 유도형 결말", detail: "마지막에 시청자의 상태를 댓글로 남기게 설계합니다." }
    ],
    segments,
    cut_transition_details: [
      "문장 끝마다 자막 강조 위치를 바꾸면 같은 화면이어도 컷이 난 것처럼 느껴집니다.",
      "주장이 바뀌는 지점에서는 얼굴 클로즈업, 자료 화면, 손동작 중 하나로 시각 기준점을 바꿉니다.",
      "중요 단어 직전에는 0.2~0.4초 정도의 미세한 호흡을 두면 강조가 살아납니다."
    ]
  };
}

function normalizeDeepReelAnalysis(
  analysis: Partial<DeepReelAnalysis>,
  reel: CompetitorReel,
  transcript: string,
  transcriptSegments?: TranscriptionSegment[]
): DeepReelAnalysis {
  const fallback = fallbackDeepReelAnalysis(reel, transcript, transcriptSegments);
  return {
    summary: analysis.summary || fallback.summary,
    target_audience: analysis.target_audience || fallback.target_audience,
    target_emotion: analysis.target_emotion || fallback.target_emotion,
    storyboard: ensureStringArray(analysis.storyboard, fallback.storyboard),
    hook_structure: ensureStringArray(analysis.hook_structure, fallback.hook_structure),
    first_three_seconds: ensureStringArray(analysis.first_three_seconds, fallback.first_three_seconds).slice(0, 3),
    six_success_devices: ensureCards(analysis.six_success_devices, fallback.six_success_devices).slice(0, 6),
    shortcomings: analysis.shortcomings || fallback.shortcomings,
    remake_methods: ensureCards(analysis.remake_methods, fallback.remake_methods).slice(0, 5),
    segments: Array.isArray(analysis.segments) && analysis.segments.length ? analysis.segments : fallback.segments,
    cut_transition_details: ensureStringArray(analysis.cut_transition_details, fallback.cut_transition_details)
  };
}

function buildFallbackSegments(reel: CompetitorReel, transcript: string, transcriptSegments?: TranscriptionSegment[]) {
  if (transcriptSegments?.length) {
    return transcriptSegments.map((segment, index) => ({
      start: Math.max(0, Number(segment.start.toFixed(2))),
      end: Math.max(segment.start + 0.1, Number(segment.end.toFixed(2))),
      title: index === 0 ? "후킹" : index === transcriptSegments.length - 1 ? "정리와 행동 유도" : `전개 ${index}`,
      script: segment.text,
      viewer_storyboard:
        index === 0 ? "첫 문장을 듣고 내 이야기인지 판단합니다." : "앞 구간의 의미를 자기 상황에 대입합니다.",
      hook_role: index === 0 ? "스크롤 정지" : "관심 유지",
      cut_analysis: "실제 전사 타임스탬프 기준 구간입니다. 문장 호흡에 맞춰 컷을 나눌 수 있습니다.",
      transition_detail: "다음 발화로 넘어가는 지점에서 자막, 시선, 자료 화면 중 하나를 바꾸는 구간입니다.",
      emotion: index === 0 ? "궁금함" : index === transcriptSegments.length - 1 ? "행동 욕구" : "이해와 납득"
    }));
  }

  const duration = Math.max(Math.round(Number(reel.duration_seconds ?? 45)), 15);
  const sentences = transcript
    .replace(/\s+/g, " ")
    .split(/(?:[.!?。！？]\s+|\n+)/)
    .map((item) => item.trim())
    .filter(Boolean);
  const chunks = sentences.length ? sentences : [reel.caption || "영상의 핵심 메시지를 전달하는 구간입니다."];
  const segmentCount = Math.min(Math.max(chunks.length, 3), 8);
  const segmentLength = duration / segmentCount;

  return Array.from({ length: segmentCount }, (_, index) => {
    const start = Math.round(index * segmentLength);
    const end = index === segmentCount - 1 ? duration : Math.round((index + 1) * segmentLength);
    const script = chunks[index] ?? chunks[chunks.length - 1] ?? "";
    return {
      start,
      end,
      title: index === 0 ? "후킹" : index === segmentCount - 1 ? "정리와 행동 유도" : `전개 ${index}`,
      script,
      viewer_storyboard:
        index === 0 ? "내 이야기인지 판단하며 멈춥니다." : "앞 문장의 의미를 자기 상황에 대입합니다.",
      hook_role: index === 0 ? "관심 정지" : "이해 유지",
      cut_analysis: "문장 단위로 컷을 나누고 핵심 단어에 자막 강조를 넣는 구간입니다.",
      transition_detail: "다음 주장으로 넘어가기 전 시선, 자막, 자료 화면 중 하나를 바꿉니다.",
      emotion: index === 0 ? "궁금함" : index === segmentCount - 1 ? "행동 욕구" : "이해와 납득"
    };
  });
}

function withTranscriptionTiming(analysis: DeepReelAnalysis, transcriptSegments?: TranscriptionSegment[]) {
  if (!transcriptSegments?.length) return analysis;

  return {
    ...analysis,
    segments: transcriptSegments.map((segment, index) => {
      const analyzed = analysis.segments[index];
      return {
        start: Math.max(0, Number(segment.start.toFixed(2))),
        end: Math.max(segment.start + 0.1, Number(segment.end.toFixed(2))),
        title: analyzed?.title || (index === 0 ? "후킹" : index === transcriptSegments.length - 1 ? "정리와 행동 유도" : `전개 ${index}`),
        script: segment.text,
        viewer_storyboard: analyzed?.viewer_storyboard || "시청자가 발화 내용을 따라가며 의미를 해석하는 구간입니다.",
        hook_role: analyzed?.hook_role || (index === 0 ? "스크롤 정지" : "관심 유지"),
        cut_analysis: analyzed?.cut_analysis || "실제 전사 타임스탬프 기준 구간입니다.",
        transition_detail: analyzed?.transition_detail || "다음 발화로 넘어가는 지점입니다.",
        emotion: analyzed?.emotion || (index === 0 ? "궁금함" : "이해")
      };
    })
  };
}

function ensureStringArray(value: unknown, fallback: string[]) {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : fallback;
}

function ensureCards(value: unknown, fallback: Array<{ title: string; detail: string }>) {
  if (!Array.isArray(value)) return fallback;
  const cards = value.filter(
    (item): item is { title: string; detail: string } =>
      item && typeof item === "object" && typeof item.title === "string" && typeof item.detail === "string"
  );
  return cards.length ? cards : fallback;
}
