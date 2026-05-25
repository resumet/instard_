"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  ImageIcon,
  MessageCircle,
  Play,
  RefreshCw,
  Search,
  Video,
  XCircle,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import { proxiedMediaUrl } from "@/lib/media-proxy";
import type { CompetitorAccount, CompetitorReel } from "@/lib/types";

type StepState = "idle" | "running" | "success" | "error";

type ProgressEvent = {
  time: string;
  label: string;
  detail?: string;
  state: StepState;
};

const terminalStatuses = new Set(["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]);

export function AccountAnalyzer() {
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("대기 중");
  const [account, setAccount] = useState<CompetitorAccount | null>(null);
  const [recent, setRecent] = useState<CompetitorReel[]>([]);
  const [topContent, setTopContent] = useState<CompetitorReel[]>([]);
  const [events, setEvents] = useState<ProgressEvent[]>([
    {
      time: currentTime(),
      label: "인스타그램 계정 주소를 입력하세요.",
      detail: "최근 30일 게시물과 릴스 중 반응이 좋은 콘텐츠 10개를 정리합니다.",
      state: "idle"
    }
  ]);
  const [isPending, setIsPending] = useState(false);

  const totals = useMemo(
    () => ({
      posts: recent.filter((item) => !isVideoLike(item)).length,
      reels: recent.filter((item) => isVideoLike(item)).length,
      likes: topContent.reduce((sum, item) => sum + item.like_count, 0),
      comments: topContent.reduce((sum, item) => sum + item.comment_count, 0)
    }),
    [recent, topContent]
  );

  function pushEvent(label: string, state: StepState, detail?: string) {
    setEvents((previous) => [{ time: currentTime(), label, detail, state }, ...previous].slice(0, 12));
  }

  async function runAnalysis() {
    setIsPending(true);
    setStatus("RUNNING");
    setAccount(null);
    setRecent([]);
    setTopContent([]);
    setEvents([]);

    try {
      const normalizedTarget = target.trim();
      if (!normalizedTarget) throw new Error("인스타그램 계정 주소를 입력해주세요.");

      pushEvent("Apify 수집을 시작했습니다.", "running", normalizedTarget);
      const runResponse = await fetch("/api/account-analyzer/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target: normalizedTarget, limit: 30 })
      });
      const runPayload = await parseResponse(runResponse);

      let finalStatus = runPayload.status ?? "UNKNOWN";
      let finalDatasetId = runPayload.datasetId ?? null;
      setStatus(finalStatus);

      if (!runPayload.demo && runPayload.runId && !terminalStatuses.has(finalStatus)) {
        for (let attempt = 1; attempt <= 60; attempt += 1) {
          await sleep(5000);
          const statusResponse = await fetch(`/api/apify/status?runId=${encodeURIComponent(runPayload.runId)}`);
          const statusPayload = await parseResponse(statusResponse);
          finalStatus = statusPayload.status ?? "UNKNOWN";
          finalDatasetId = statusPayload.datasetId ?? finalDatasetId;
          setStatus(finalStatus);
          pushEvent(`수집 상태 확인 ${attempt}`, "running", finalStatus);
          if (terminalStatuses.has(finalStatus)) break;
        }
      }

      if (finalStatus !== "SUCCEEDED") {
        throw new Error(`인스타그램 수집이 완료되지 않았습니다. 현재 상태: ${finalStatus}`);
      }

      pushEvent("최근 30일 콘텐츠를 정리합니다.", "running", finalDatasetId ?? "dataset 없음");
      const resultResponse = await fetch("/api/account-analyzer/results", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ datasetId: finalDatasetId ?? "demo-dataset" })
      });
      const resultPayload = await parseResponse(resultResponse);

      setAccount(resultPayload.account ?? null);
      setRecent(resultPayload.recent ?? []);
      setTopContent(resultPayload.topContent ?? []);
      setStatus("완료");
      pushEvent("계정 분석이 완료되었습니다.", "success", `TOP ${resultPayload.topContent?.length ?? 0}개 콘텐츠`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      setStatus("ERROR");
      pushEvent("분석에 실패했습니다.", "error", message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Instagram account analyzer</p>
          <h1 className="text-3xl font-bold">계정분석기</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            인스타그램 계정 주소를 넣으면 최근 30일 게시물과 릴스에서 반응이 가장 좋은 콘텐츠 10개를
            인스타그램 피드처럼 볼 수 있게 정리합니다.
          </p>
        </div>
        <div className="flex w-full gap-2 md:w-[520px]">
          <Input
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            placeholder="https://www.instagram.com/account/"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isPending) void runAnalysis();
            }}
          />
          <Button onClick={runAnalysis} disabled={isPending} className="shrink-0">
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            분석
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric label="상태" value={status} />
        <Metric label="최근 30일" value={`${recent.length}개`} />
        <Metric label="게시물" value={`${totals.posts}개`} />
        <Metric label="릴스/영상" value={`${totals.reels}개`} />
        <Metric label="TOP 반응" value={`${formatNumber(totals.likes + totals.comments)}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>진행 상황</CardTitle>
          <CardDescription>계정 수집, 최근 30일 필터링, 반응 순위 산정 과정을 표시합니다.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 md:grid-cols-2">
          {events.map((event, index) => (
            <div key={`${event.time}-${index}`} className="flex gap-3 rounded-md border bg-white p-3">
              <StateIcon state={event.state} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{event.label}</p>
                  <span className="text-xs text-muted-foreground">{event.time}</span>
                </div>
                {event.detail ? <p className="mt-1 break-all text-sm text-muted-foreground">{event.detail}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {topContent.length ? (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold">반응 좋은 콘텐츠 TOP 10</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {account?.instagram_handle ? `@${account.instagram_handle}` : "분석 계정"}의 최근 30일 콘텐츠 기준입니다.
              </p>
            </div>
            {account?.profile_url ? (
              <a href={account.profile_url} target="_blank" rel="noreferrer">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4" />
                  계정 열기
                </Button>
              </a>
            ) : null}
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {topContent.map((item, index) => (
              <FeedCard key={item.id} item={item} rank={index + 1} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function FeedCard({ item, rank }: { item: CompetitorReel; rank: number }) {
  const media = getMediaItems(item);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex];
  const isVideo = active?.type === "video";

  return (
    <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">#{rank} {item.shortcode}</p>
          <p className="text-xs text-muted-foreground">{formatDate(item.posted_at)}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium">
          {isVideoLike(item) ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
          {isVideoLike(item) ? "Reels" : item.media_type === "carousel" ? "Carousel" : "Post"}
        </span>
      </div>

      <div className="relative aspect-square bg-black">
        {active ? (
          isVideo ? (
            <video
              className="h-full w-full object-contain"
              src={active.url}
              poster={proxiedMediaUrl(active.thumbnail_url) ?? undefined}
              controls
              playsInline
              preload="metadata"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-full w-full object-contain"
              src={proxiedMediaUrl(active.url) ?? active.url}
              alt={item.caption || item.shortcode}
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
            표시할 사진 또는 영상이 없습니다.
          </div>
        )}

        {media.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="이전 미디어"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white"
              onClick={() => setActiveIndex((value) => (value === 0 ? media.length - 1 : value - 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="다음 미디어"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/65 text-white"
              onClick={() => setActiveIndex((value) => (value + 1) % media.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {media.map((entry, index) => (
                <button
                  key={`${entry.url}-${index}`}
                  type="button"
                  aria-label={`${index + 1}번째 미디어`}
                  className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-white" : "bg-white/45"}`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Engagement icon={Heart} label="좋아요" value={formatNumber(item.like_count)} />
          <Engagement icon={MessageCircle} label="댓글" value={formatNumber(item.comment_count)} />
          <Engagement icon={Play} label="조회" value={formatNumber(item.view_count)} />
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6">{item.caption || "캡션 없음"}</p>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
            반응 점수 {Math.round(item.performance_score * 100)}
          </span>
          <a href={item.reel_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary">
            인스타그램에서 보기
          </a>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-xl font-semibold">{value}</p>
    </Card>
  );
}

function Engagement({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-2 py-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function StateIcon({ state }: { state: StepState }) {
  if (state === "running") return <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />;
  if (state === "success") return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />;
  if (state === "error") return <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />;
  return <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />;
}

function getMediaItems(item: CompetitorReel) {
  const media = item.media_items?.length ? item.media_items : [];
  if (media.length) return media;
  if (item.video_url) return [{ type: "video" as const, url: item.video_url, thumbnail_url: item.thumbnail_url }];
  if (item.thumbnail_url) return [{ type: "image" as const, url: item.thumbnail_url }];
  return [];
}

function isVideoLike(item: CompetitorReel) {
  return item.media_type === "reel" || item.media_type === "video" || Boolean(item.video_url);
}

function formatDate(value?: string | null) {
  if (!value) return "게시일 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "게시일 정보 없음";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(date);
}

function currentTime() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseResponse(response: Response) {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "요청에 실패했습니다.");
  }
  return payload;
}
