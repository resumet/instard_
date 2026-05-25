"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TranscriptScene } from "@/lib/reel-detail-analysis";

export function TranscriptExtractor({
  endpoint,
  disabled,
  initialTranscript = "",
  initialScenes = []
}: {
  endpoint: string;
  disabled: boolean;
  initialTranscript?: string;
  initialScenes?: TranscriptScene[];
}) {
  const router = useRouter();
  const [transcript, setTranscript] = useState(initialTranscript);
  const [scenes, setScenes] = useState<TranscriptScene[]>(initialScenes);
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function extractTranscript() {
    setIsPending(true);
    setMessage("영상에서 음성을 추출하고 텍스트로 변환하는 중입니다.");
    setTranscript("");
    setScenes([]);

    const response = await fetch(endpoint, { method: "POST" });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error ?? "음성 텍스트 추출에 실패했습니다.");
      setIsPending(false);
      return;
    }

    const nextTranscript = payload.transcript ?? "";
    const nextScenes = Array.isArray(payload.scenes) ? payload.scenes : [];

    setTranscript(nextTranscript);
    setScenes(nextScenes);
    setMessage(payload.persisted ? "전사 결과를 DB에 저장했습니다." : "전사 결과를 생성했습니다.");
    setIsPending(false);
    router.refresh();
  }

  function downloadText() {
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "reel-transcript.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>음성 텍스트 추출</CardTitle>
          <CardDescription>
            영상에서 MP3 음성을 추출한 뒤 전사 텍스트를 만들고, 그 텍스트 기준으로 시간대별 구조를 갱신합니다.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={extractTranscript} disabled={disabled || isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              음성을 텍스트로 추출
            </Button>
            {transcript ? (
              <Button variant="outline" onClick={downloadText}>
                TXT 다운로드
              </Button>
            ) : null}
          </div>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>음성 텍스트 스크립트</CardTitle>
          <CardDescription>추출 전에는 비워두고, 전사 완료 후 실제 음성 텍스트만 표시합니다.</CardDescription>
        </CardHeader>
        {transcript ? (
          <div className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-4 text-sm leading-7 whitespace-pre-wrap">
            {transcript}
          </div>
        ) : (
          <div className="min-h-32 rounded-lg border border-dashed bg-muted/20" aria-label="아직 추출된 음성 텍스트 없음" />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>시간대별 스크립트 분석</CardTitle>
          <CardDescription>음성 텍스트가 추출되면 해당 텍스트를 기준으로 구간별 역할과 편집 포인트를 갱신합니다.</CardDescription>
        </CardHeader>
        {scenes.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2">시간</th>
                  <th>역할</th>
                  <th>스크립트</th>
                  <th>화면</th>
                  <th>편집/전환</th>
                </tr>
              </thead>
              <tbody>
                {scenes.map((scene) => (
                  <tr key={`${scene.time}-${scene.role}`} className="border-t align-top">
                    <td className="py-3">{scene.time}</td>
                    <td>{scene.role}</td>
                    <td>{scene.script}</td>
                    <td>{scene.visual}</td>
                    <td>{scene.edit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="min-h-32 rounded-lg border border-dashed bg-muted/20" aria-label="아직 시간대별 분석 없음" />
        )}
      </Card>
    </div>
  );
}
