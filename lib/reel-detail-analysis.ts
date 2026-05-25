import type { CompetitorReel } from "@/lib/types";

export type TranscriptScene = {
  time: string;
  role: string;
  script: string;
  visual: string;
  edit: string;
};

type ScriptSegment = {
  script: string;
  weight: number;
};

export function buildReelDetailAnalysis(reel: CompetitorReel, transcript?: string | null) {
  const cleanedTranscript = cleanTranscript(transcript);

  return {
    transcript: cleanedTranscript,
    scenes: cleanedTranscript ? buildTranscriptScenes(reel, cleanedTranscript) : [],
    hookElements: cleanedTranscript ? inferHookElements(cleanedTranscript) : [],
    transitionEffects: cleanedTranscript ? inferTransitionEffects(reel) : [],
    successReasons: inferSuccessReasons(reel),
    caution: cleanedTranscript
      ? "음성 전사 텍스트를 기준으로 구조를 분석했습니다. 경쟁사 문장을 그대로 복제하지 말고 훅, 전개, 전환 방식만 참고하세요."
      : "아직 음성 텍스트를 추출하지 않았습니다. 음성 추출을 실행하면 스크립트와 시간대별 분석이 표시됩니다."
  };
}

export function buildTranscriptScenes(reel: CompetitorReel, transcript: string): TranscriptScene[] {
  const cleaned = cleanTranscript(transcript);
  if (!cleaned) return [];

  const duration = Math.max(Math.round(Number(reel.duration_seconds ?? 30)), 15);
  const segments = buildNaturalSegments(cleaned);
  const totalWeight = segments.reduce((sum, segment) => sum + segment.weight, 0);

  let cursor = 0;
  return segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    const start = Math.round(cursor);
    const segmentDuration = isLast ? duration - cursor : (duration * segment.weight) / totalWeight;
    cursor += segmentDuration;
    const end = isLast ? duration : Math.max(start + 1, Math.round(cursor));

    return {
      time: `${start}~${end}초`,
      role: sceneRole(index, segments.length, segment.script),
      script: segment.script,
      visual: sceneVisual(index, segments.length, Boolean(reel.video_url)),
      edit: sceneEdit(index, segments.length)
    };
  });
}

function buildNaturalSegments(text: string): ScriptSegment[] {
  const sentences = splitSentences(text);
  if (!sentences.length) return [];

  const segments: string[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    const next = buffer ? `${buffer} ${sentence}` : sentence;
    const shouldFlush =
      buffer &&
      (isNaturalBreakpoint(buffer) || next.length > 120 || sentenceStartsNewThought(sentence));

    if (shouldFlush) {
      segments.push(buffer);
      buffer = sentence;
    } else {
      buffer = next;
    }
  }

  if (buffer) segments.push(buffer);

  return segments.map((script) => ({
    script,
    weight: estimateSpeechWeight(script)
  }));
}

function splitSentences(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const matches = normalized.match(/[^.!?。！？\n]+[.!?。！？]?/g) ?? [normalized];
  return matches.map((item) => item.trim()).filter(Boolean);
}

function isNaturalBreakpoint(text: string) {
  return /[.!?。！？]$/.test(text.trim()) || /(그리고|그런데|하지만|그래서|결국|마지막으로)[, ]?$/i.test(text);
}

function sentenceStartsNewThought(sentence: string) {
  return /^(그리고|그런데|하지만|그래서|결국|마지막으로|첫째|둘째|셋째|먼저|다음으로|반대로)/.test(sentence);
}

function estimateSpeechWeight(script: string) {
  const koreanChars = script.match(/[가-힣]/g)?.length ?? 0;
  const otherWords = script.replace(/[가-힣]/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, koreanChars / 8 + otherWords);
}

function sceneRole(index: number, total: number, script: string) {
  if (index === 0) return "훅";
  if (index === total - 1) return /(댓글|저장|팔로우|문의|확인|신청|공유)/.test(script) ? "CTA" : "정리";
  if (/(문제|실수|주의|왜|이유|몰랐|하지 마)/.test(script)) return "문제 제기";
  if (/(방법|팁|체크|정리|먼저|다음|첫째|둘째|셋째)/.test(script)) return "해결/팁";
  return "전개";
}

function sceneVisual(index: number, total: number, hasVideo: boolean) {
  if (index === 0) return "첫 문장을 크게 보여주는 클로즈업 또는 강한 첫 화면";
  if (index === total - 1) return "핵심 메시지 재강조, 저장/댓글 유도 자막";
  return hasVideo ? "대사 흐름에 맞춰 말하는 장면과 보조 화면 교차" : "문장 핵심어를 자막으로 강조하고 관련 이미지 컷 전환";
}

function sceneEdit(index: number, total: number) {
  if (index === 0) return "첫 문장의 핵심 단어를 크게 강조하고 빠르게 진입";
  if (index === total - 1) return "템포를 낮추고 CTA 또는 결론 자막을 고정";
  return "문장 단위로 컷을 나누고 핵심 단어 등장 시 자막 변화";
}

function inferHookElements(transcript: string) {
  const firstLine = splitSentences(transcript)[0];
  const elements = [];

  if (firstLine) elements.push(`첫 문장 훅: "${firstLine.slice(0, 80)}${firstLine.length > 80 ? "..." : ""}"`);
  if (/[?？]/.test(transcript)) elements.push("질문형 문장으로 시청자의 자기 대입을 유도합니다.");
  if (/(주의|실수|망하는|하지 마|몰랐|비밀|진짜|이유)/.test(transcript)) {
    elements.push("손실 회피나 호기심을 자극하는 단어가 포함되어 있습니다.");
  }
  if (/(방법|체크|정리|팁|순서|해야)/.test(transcript)) {
    elements.push("바로 적용 가능한 실용 정보를 약속합니다.");
  }

  return elements.length ? elements : ["첫 문장에서 문제나 결론을 빠르게 제시하는 구조입니다."];
}

function inferTransitionEffects(reel: CompetitorReel) {
  const effects = ["문장 단위로 컷을 끊으면 대사 리듬이 자연스럽게 살아납니다.", "핵심 단어마다 자막 스타일을 바꾸면 이해 속도가 빨라집니다."];
  if (reel.video_url) effects.push("말하는 장면과 B-roll을 교차해 화면 피로도를 낮출 수 있습니다.");
  if ((reel.duration_seconds ?? 0) > 35) effects.push("중간 문단 전환 시 화면 구도나 배경을 바꾸는 패턴 인터럽트가 필요합니다.");
  return effects;
}

function inferSuccessReasons(reel: CompetitorReel) {
  const reasons = [];
  if (reel.is_top_performer) reasons.push("프로젝트 내 비교 기준에서 상위 성과 콘텐츠로 분류되었습니다.");
  if (reel.view_count > 0) reasons.push(`조회수 ${reel.view_count.toLocaleString()}회로 확산 가능성이 확인됩니다.`);
  if (reel.like_count + reel.comment_count > 0) {
    reasons.push("좋아요와 댓글 반응이 있어 메시지 공감도가 확인됩니다.");
  }
  return reasons.length ? reasons : ["수집된 성과 지표를 기준으로 후킹 구조와 CTA를 함께 검토해야 합니다."];
}

function cleanTranscript(transcript?: string | null) {
  return transcript?.replace(/\s+/g, " ").trim() ?? "";
}
