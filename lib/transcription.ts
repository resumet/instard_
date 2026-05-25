import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { env } from "@/lib/env";

const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;

export async function transcribeMp3(audio: Buffer, filename: string) {
  if (!openai) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const file = await toFile(audio, filename, { type: "audio/mpeg" });
  const result = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "ko",
    response_format: "json"
  });

  return result.text;
}
