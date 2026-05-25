import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { env } from "@/lib/env";

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

export type TranscriptionSegment = {
  start: number;
  end: number;
  text: string;
};

export type DetailedTranscription = {
  text: string;
  segments: TranscriptionSegment[];
};

export async function transcribeMp3(audio: Buffer, filename: string) {
  const result = await transcribeAudioDetailed(audio, filename);
  return result.text;
}

export async function transcribeAudioDetailed(audio: Buffer, filename: string): Promise<DetailedTranscription> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const type = filename.toLowerCase().endsWith(".wav") ? "audio/wav" : "audio/mpeg";
  const file = await toFile(audio, filename, { type });
  const result = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "ko",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
    prompt:
      "한국어 인스타그램 릴스 영상입니다. 브랜드명, 제품명, 신조어, 짧은 구어체 문장을 가능한 한 원문 발음에 가깝게 전사하세요."
  });

  return {
    text: result.text ?? "",
    segments: Array.isArray(result.segments)
      ? result.segments
          .map((segment) => ({
            start: Number(segment.start ?? 0),
            end: Number(segment.end ?? 0),
            text: String(segment.text ?? "").trim()
          }))
          .filter((segment) => segment.text)
      : []
  };
}
