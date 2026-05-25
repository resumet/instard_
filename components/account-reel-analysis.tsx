"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  Scissors,
  Sparkles,
  Target,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { proxiedMediaUrl } from "@/lib/media-proxy";
import { formatNumber } from "@/lib/utils";
import type { CompetitorReel, DeepReelAnalysis, DeepReelSegment } from "@/lib/types";

const storagePrefix = "account-analyzer:reel:";

export function AccountReelAnalysis({ reelId }: { reelId: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [reel, setReel] = useState<CompetitorReel | null>(null);
  const [transcript, setTranscript] = useState("");
  const [audioTranscript, setAudioTranscript] = useState("");
  const [transcriptionError, setTranscriptionError] = useState("");
  const [analysis, setAnalysis] = useState<DeepReelAnalysis | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored =
      window.sessionStorage.getItem(`${storagePrefix}${reelId}`) ||
      window.sessionStorage.getItem("account-analyzer:last-reel");
    if (!stored) return;
    try {
      setReel(JSON.parse(stored) as CompetitorReel);
    } catch {
      setMessage("영상 데이터를 읽지 못했습니다. 계정분석기에서 TOP3 영상을 다시 선택해주세요.");
    }
  }, [reelId]);

  const segments = useMemo(() => {
    if (analysis?.segments?.length) return analysis.segments;
    return buildPreviewSegments(reel, duration || Number(reel?.duration_seconds ?? 45));
  }, [analysis, duration, reel]);

  async function runAnalysis() {
    if (!reel) return;
    setIsAnalyzing(true);
    setMessage("릴스 영상을 다운로드해 음성을 추출하고 스크립트를 만드는 중입니다.");
    setTranscriptionError("");
    setAudioTranscript("");

    try {
      const response = await fetch("/api/account-analyzer/reel-analysis", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reel })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "릴스 음성 스크립트 분석에 실패했습니다.");

      setTranscript(payload.transcript ?? "");
      setAudioTranscript(payload.audioTranscript ?? payload.transcript ?? "");
      setTranscriptionError("");
      setAnalysis(payload.analysis ?? null);
      setMessage("릴스 음성에서 스크립트 전문을 만들었습니다. 전체 원문과 타임라인을 확인할 수 있습니다.");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "릴스 음성 스크립트 분석에 실패했습니다.";
      setMessage(nextMessage);
      setTranscriptionError(nextMessage);
      setTranscript("");
      setAudioTranscript("");
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function seekTo(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(seconds, video.duration || seconds));
    setCurrentTime(video.currentTime);
    void video.play();
    setIsPlaying(true);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  const videoUrl = reel?.video_url || reel?.media_items?.find((item) => item.type === "video")?.url || "";
  const poster = proxiedMediaUrl(reel?.thumbnail_url);
  const activeSegment = segments.find((segment) => currentTime >= segment.start && currentTime <= segment.end) ?? segments[0];

  if (!reel) {
    return (
      <div className="space-y-5">
        <Link href="/account-analyzer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          계정분석기로 돌아가기
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>영상 데이터가 없습니다.</CardTitle>
            <CardDescription>계정분석기에서 TOP3 영상의 분석 버튼을 눌러 상세화면을 열어주세요.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Link href="/account-analyzer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            계정분석기로 돌아가기
          </Link>
          <p className="mt-4 text-sm font-medium text-primary">TOP 영상 분석</p>
          <h1 className="text-3xl font-bold">릴스 상세 분석</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            릴스에서 추출한 음성 스크립트 전문을 기준으로 영상, 세그먼트, 타임라인, 후킹과 컷 전환을 분석합니다.
          </p>
        </div>
        <Button onClick={runAnalysis} disabled={isAnalyzing || !videoUrl}>
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          음성 스크립트 분석
        </Button>
      </div>

      {message ? <p className="rounded-md border bg-white px-4 py-3 text-sm text-muted-foreground">{message}</p> : null}
      {transcriptionError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          음성 전사 오류: {transcriptionError}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Eye} label="조회" value={formatNumber(reel.view_count)} />
        <Metric icon={Heart} label="좋아요" value={formatNumber(reel.like_count)} />
        <Metric icon={MessageCircle} label="댓글" value={formatNumber(reel.comment_count)} />
        <Metric icon={Sparkles} label="반응 점수" value={String(Math.round(reel.performance_score * 100))} />
      </div>

      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="p-3">
          <div className="overflow-hidden rounded-lg bg-black">
            {videoUrl ? (
              <video
                ref={videoRef}
                className="aspect-[9/16] w-full object-contain"
                src={videoUrl}
                poster={poster ?? undefined}
                playsInline
                controls
                preload="metadata"
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || Number(reel.duration_seconds ?? 0))}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            ) : (
              <div className="flex aspect-[9/16] items-center justify-center px-6 text-center text-sm text-white/70">
                재생 가능한 영상 URL이 없습니다.
              </div>
            )}
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={togglePlay} disabled={!videoUrl}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? "정지" : "재생"}
              </Button>
              <span className="font-mono text-sm text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration || Number(reel.duration_seconds ?? 0))}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(duration || Number(reel.duration_seconds ?? 0), 1)}
              step={0.1}
              value={currentTime}
              onChange={(event) => seekTo(Number(event.target.value))}
              className="w-full"
            />
            {activeSegment ? (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="font-semibold">{activeSegment.title}</p>
                <p className="mt-1 text-muted-foreground">{activeSegment.emotion}</p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>세그먼트 스크립트</CardTitle>
            <CardDescription>세그먼트를 클릭하면 해당 시간으로 이동해 재생합니다.</CardDescription>
          </CardHeader>
          <div className="max-h-[680px] overflow-auto divide-y rounded-md border">
            {segments.map((segment) => (
              <button
                key={`${segment.start}-${segment.title}`}
                type="button"
                onClick={() => seekTo(segment.start)}
                className={`block w-full p-4 text-left transition-colors hover:bg-muted ${
                  activeSegment === segment ? "bg-accent/60" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </p>
                    <p className="mt-1 font-semibold">{segment.title}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-3 text-sm leading-6">{segment.script}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <SmallNote label="컷 분석" value={segment.cut_analysis} />
                  <SmallNote label="감정 흐름" value={segment.emotion} />
                </div>
              </button>
            ))}
          </div>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>음성 스크립트 전문</CardTitle>
          <CardDescription>릴스 영상에서 음성을 추출한 뒤 전사한 전체 원문입니다.</CardDescription>
        </CardHeader>
        {audioTranscript ? (
          <div className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-4 whitespace-pre-wrap text-sm leading-7">
            {audioTranscript}
          </div>
        ) : (
          <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            아직 음성에서 추출한 스크립트 전문이 없습니다. 음성 스크립트 분석을 실행해주세요.
          </div>
        )}
      </Card>

      <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
        <Card className="p-3">
          <CardHeader>
            <CardTitle>전체 미리보기</CardTitle>
            <CardDescription>오른쪽 타임라인을 클릭하며 컷과 주제를 확인합니다.</CardDescription>
          </CardHeader>
          <div className="overflow-hidden rounded-lg bg-black">
            {videoUrl ? (
              <video className="aspect-[9/16] w-full object-contain" src={videoUrl} poster={poster ?? undefined} controls playsInline />
            ) : null}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>클릭형 타임라인</CardTitle>
            <CardDescription>시간대, 말하는 주제, 컷 분석을 함께 표시합니다.</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {segments.map((segment) => (
              <button
                key={`timeline-${segment.start}`}
                type="button"
                onClick={() => seekTo(segment.start)}
                className="grid w-full gap-3 rounded-md border bg-white p-4 text-left hover:bg-muted md:grid-cols-[96px_1fr]"
              >
                <span className="font-mono text-sm text-primary">{formatTime(segment.start)}</span>
                <span>
                  <span className="block font-semibold">{segment.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">{segment.cut_analysis}</span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </section>

      {analysis ? (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <TextCard icon={Target} title="타겟 분석" body={analysis.target_audience} />
            <TextCard icon={Heart} title="자극한 감정" body={analysis.target_emotion} />
            <TextCard icon={Scissors} title="부족했던 점" body={analysis.shortcomings} />
          </div>

          <CardGrid title="반응이 좋았던 6가지 장치" cards={analysis.six_success_devices} />
          <ListGrid title="처음 3초가 잡아끈 디테일" items={analysis.first_three_seconds} />
          <ListGrid title="컷 전환 디테일 분석" items={analysis.cut_transition_details} />
          <CardGrid title="잘 터지는 영상으로 재구성하는 5가지 방식" cards={analysis.remake_methods} icon={Wand2} />
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>분석 대기 중</CardTitle>
            <CardDescription>상단의 음성 스크립트 분석 버튼을 누르면 스크립트 전문, 후킹 구조, 컷 전환, 감정 흐름을 생성합니다.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <Card>
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold">{value}</p>
    </Card>
  );
}

function SmallNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm">{value}</p>
    </div>
  );
}

function TextCard({ icon: Icon, title, body }: { icon: typeof Target; title: string; body: string }) {
  return (
    <Card>
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="mt-3 text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </Card>
  );
}

function CardGrid({
  title,
  cards,
  icon: Icon = Sparkles
}: {
  title: string;
  cards: Array<{ title: string; detail: string }>;
  icon?: typeof Sparkles;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => (
          <Card key={`${card.title}-${index}`}>
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ListGrid({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <Card key={`${item}-${index}`}>
            <div className="flex items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <p className="text-sm leading-6">{item}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function buildPreviewSegments(reel: CompetitorReel | null, duration: number): DeepReelSegment[] {
  if (!reel) return [];
  const safeDuration = Math.max(Math.round(duration || Number(reel.duration_seconds ?? 45)), 15);
  const captionParts = (reel.caption || "음성 스크립트 분석을 실행하면 실제 전사 기반 세그먼트가 표시됩니다.")
    .split(/[\n.?!。！？]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const count = Math.min(Math.max(captionParts.length, 4), 6);
  const size = safeDuration / count;
  return Array.from({ length: count }, (_, index) => ({
    start: Math.round(index * size),
    end: index === count - 1 ? safeDuration : Math.round((index + 1) * size),
    title: index === 0 ? "초반 후킹" : index === count - 1 ? "결말/CTA" : `전개 구간 ${index}`,
    script: captionParts[index] ?? "음성 분석 후 이 구간의 대본 요약이 표시됩니다.",
    viewer_storyboard: "시청자가 내용을 자기 상황에 대입하는 구간입니다.",
    hook_role: index === 0 ? "스크롤 정지" : "관심 유지",
    cut_analysis: "분석 전 미리보기 컷입니다. 분석 실행 후 세부 컷 분할이 업데이트됩니다.",
    transition_detail: "장면 전환 디테일은 분석 실행 후 표시됩니다.",
    emotion: index === 0 ? "궁금함" : "이해"
  }));
}

function formatTime(value: number) {
  const safe = Math.max(0, Math.floor(value || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
