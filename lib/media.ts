import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { CompetitorReel } from "@/lib/types";

const workDir = path.join(process.cwd(), ".tmp", "media");

export function mediaFileName(reel: CompetitorReel, extension: string) {
  const safeShortcode = reel.shortcode.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `reel-${safeShortcode}.${extension}`;
}

export async function downloadVideoBuffer(videoUrl: string) {
  const response = await fetch(videoUrl, {
    headers: {
      "user-agent": "Mozilla/5.0"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`영상 다운로드 실패: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "video/mp4";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, contentType };
}

export async function extractAudioMp3(videoUrl: string) {
  await mkdir(workDir, { recursive: true });
  const id = randomUUID();
  const inputPath = path.join(workDir, `${id}.mp4`);
  const outputPath = path.join(workDir, `${id}.mp3`);

  try {
    const { buffer } = await downloadVideoBuffer(videoUrl);
    await writeFile(inputPath, buffer);
    await runFfmpeg(inputPath, outputPath);
    return await readFile(outputPath);
  } finally {
    await rm(inputPath, { force: true }).catch(() => undefined);
    await rm(outputPath, { force: true }).catch(() => undefined);
  }
}

function runFfmpeg(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn("ffmpeg", [
      "-y",
      "-i",
      inputPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-ab",
      "192k",
      outputPath
    ]);

    let stderr = "";
    process.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    process.on("error", (error) => {
      reject(new Error(`ffmpeg 실행 실패: ${error.message}`));
    });
    process.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg 오디오 추출 실패: ${stderr.slice(-800)}`));
    });
  });
}
