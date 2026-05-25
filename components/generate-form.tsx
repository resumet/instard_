"use client";

import { useState } from "react";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { GeneratedReel } from "@/lib/types";

export function GenerateForm({
  projectId,
  defaultTopic,
  defaultAudience,
  defaultTone,
  analyzedReelCount
}: {
  projectId: string;
  defaultTopic?: string;
  defaultAudience?: string;
  defaultTone?: string;
  analyzedReelCount: number;
}) {
  const [result, setResult] = useState<GeneratedReel | null>(null);
  const [sourceCount, setSourceCount] = useState(analyzedReelCount);
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/ai/generate-script", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, ...Object.fromEntries(formData) })
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "생성에 실패했습니다.");
      setIsPending(false);
      return;
    }
    setResult(payload.generated);
    setSourceCount(payload.sourceReelCount ?? analyzedReelCount);
    setMessage(payload.persisted === false ? "생성은 완료됐지만 저장은 생략되었습니다." : "프로젝트에 생성 결과를 저장했습니다.");
    setIsPending(false);
  }

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>내 릴스 생성</CardTitle>
          <CardDescription>
            현재 프로젝트의 분석 릴스 {sourceCount}개를 기반으로 스크립트와 촬영 콘티를 만듭니다.
          </CardDescription>
        </CardHeader>
        {sourceCount === 0 ? (
          <div className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            아직 분석 데이터가 없습니다. 먼저 이 프로젝트에서 경쟁사 분석을 실행하면 더 정확한 스크립트를 만들 수 있습니다.
          </div>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input name="topic" defaultValue={defaultTopic || "40대 직장인을 위한 부동산 투자"} placeholder="콘텐츠 분야" />
          <Textarea name="target_audience" defaultValue={defaultAudience || "퇴직 후 노후가 걱정되는 직장인"} placeholder="타깃 고객" />
          <Textarea name="core_message" defaultValue="월급만으로는 노후 준비가 어렵다" placeholder="핵심 메시지" />
          <Input name="product_or_service" defaultValue="부동산 투자 강의" placeholder="상품/서비스" />
          <Input name="tone" defaultValue={defaultTone || "현실적이고 친근한 조언형"} placeholder="톤앤매너" />
          <Textarea
            name="existing_script"
            placeholder="기존 릴스 스크립트"
            defaultValue="막막하다면 오늘은 숫자 하나만 확인해보세요. 중요한 건 큰 결심보다 작은 점검입니다."
          />
          <Select name="target_duration_seconds" defaultValue="30">
            <option value="15">15초</option>
            <option value="30">30초</option>
            <option value="45">45초</option>
            <option value="60">60초</option>
            <option value="90">90초</option>
          </Select>
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button className="w-full" disabled={isPending}>
            <Sparkles className="h-4 w-4" />
            {isPending ? "생성 중..." : "프로젝트 데이터로 생성"}
          </Button>
        </form>
      </Card>

      <Card>
        {result ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-primary">{result.target_duration_seconds}초 릴스</p>
                <h2 className="mt-1 text-2xl font-bold">{result.title}</h2>
                <p className="mt-2 text-muted-foreground">{result.disclaimer}</p>
              </div>
              <Button variant="outline" size="icon" onClick={copyResult} title="결과 복사">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <section>
              <h3 className="font-semibold">첫 3초 훅</h3>
              <p className="mt-2 rounded-lg bg-accent p-3 text-accent-foreground">{result.hook}</p>
            </section>
            <section>
              <h3 className="font-semibold">전체 스크립트</h3>
              <p className="mt-2 whitespace-pre-line leading-7">{result.full_script}</p>
            </section>
            <section className="overflow-x-auto">
              <h3 className="mb-2 font-semibold">장면별 촬영 콘티</h3>
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="py-2">시간</th>
                    <th>화면</th>
                    <th>대사</th>
                    <th>자막</th>
                    <th>편집</th>
                    <th>구도</th>
                  </tr>
                </thead>
                <tbody>
                  {result.scene_lines.map((scene) => (
                    <tr key={scene.time} className="border-t align-top">
                      <td className="py-3">{scene.time}</td>
                      <td>{scene.visual}</td>
                      <td>{scene.dialogue}</td>
                      <td>{scene.caption}</td>
                      <td>{scene.edit_point}</td>
                      <td>{scene.camera}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="grid gap-3 md:grid-cols-2">
              <Info title="CTA" value={result.cta} />
              <Info title="썸네일" value={result.thumbnail_text} />
              <Info title="영상 콘셉트" value={result.video_style.concept} />
              <Info title="편집 템포" value={result.video_style.editing_tempo} />
            </section>
          </div>
        ) : (
          <div className="flex min-h-[520px] items-center justify-center text-center text-muted-foreground">
            생성 결과가 여기에 표시됩니다.
          </div>
        )}
      </Card>
    </div>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
