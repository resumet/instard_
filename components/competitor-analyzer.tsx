"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, Play, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstagramContentCard } from "@/components/instagram-content-card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getRecentTopContent } from "@/lib/content-groups";
import { formatNumber } from "@/lib/utils";
import type { CompetitorAccount, CompetitorReel } from "@/lib/types";

type StepState = "idle" | "running" | "success" | "error";

type ProgressEvent = {
  time: string;
  label: string;
  detail?: string;
  state: StepState;
};

const terminalStatuses = new Set(["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]);

export function CompetitorAnalyzer({ projectId }: { projectId: string }) {
  const [targets, setTargets] = useState("https://www.instagram.com/lisakkwon_/");
  const [limit, setLimit] = useState("30");
  const [runId, setRunId] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [apifyStatus, setApifyStatus] = useState("대기 중");
  const [accounts, setAccounts] = useState<CompetitorAccount[]>([]);
  const [items, setItems] = useState<CompetitorReel[]>([]);
  const [events, setEvents] = useState<ProgressEvent[]>([
    { time: currentTime(), label: "분석 대기", detail: "계정 URL을 한 줄에 하나씩 입력하세요.", state: "idle" }
  ]);
  const [isPending, setIsPending] = useState(false);

  const grouped = useMemo(() => getRecentTopContent(items, 10), [items]);
  const targetList = useMemo(
    () => targets.split(/\r?\n|,/).map((target) => target.trim()).filter(Boolean),
    [targets]
  );

  function pushEvent(label: string, state: StepState, detail?: string) {
    setEvents((previous) => [{ time: currentTime(), label, detail, state }, ...previous].slice(0, 18));
  }

  async function runAnalysis() {
    setIsPending(true);
    setAccounts([]);
    setItems([]);
    setRunId(null);
    setDatasetId(null);
    setApifyStatus("RUNNING");
    setEvents([]);

    try {
      if (!targetList.length) throw new Error("분석할 인스타그램 계정을 입력하세요.");

      const allAccounts: CompetitorAccount[] = [];
      const allItems: CompetitorReel[] = [];

      for (const [index, target] of targetList.entries()) {
        pushEvent(`계정 ${index + 1}/${targetList.length} Apify 실행 요청`, "running", target);
        const runResponse = await fetch("/api/apify/run", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ projectId, target, limit: Number(limit) })
        });
        const runPayload = await parseResponse(runResponse);

        setRunId(runPayload.runId ?? null);
        setDatasetId(runPayload.datasetId ?? null);
        setApifyStatus(runPayload.status ?? "UNKNOWN");
        pushEvent(
          "실행 생성 완료",
          runPayload.demo ? "success" : "running",
          `runId: ${runPayload.runId ?? "-"}, status: ${runPayload.status ?? "-"}`
        );

        let finalStatus = runPayload.status ?? "UNKNOWN";
        let finalDatasetId = runPayload.datasetId ?? null;

        if (!runPayload.demo && runPayload.runId && !terminalStatuses.has(finalStatus)) {
          for (let attempt = 1; attempt <= 60; attempt += 1) {
            await sleep(5000);
            const statusResponse = await fetch(`/api/apify/status?runId=${encodeURIComponent(runPayload.runId)}`);
            const statusPayload = await parseResponse(statusResponse);
            finalStatus = statusPayload.status ?? "UNKNOWN";
            finalDatasetId = statusPayload.datasetId ?? finalDatasetId;
            setApifyStatus(finalStatus);
            setDatasetId(finalDatasetId);
            pushEvent(`계정 ${index + 1} 상태 확인 ${attempt}`, "running", `status: ${finalStatus}`);

            if (terminalStatuses.has(finalStatus)) break;
          }
        }

        if (finalStatus !== "SUCCEEDED") {
          throw new Error(`Apify 실행이 완료되지 않았습니다. 현재 상태: ${finalStatus}`);
        }

        pushEvent("최근 30일 게시물/릴스 정리", "running", finalDatasetId ?? "datasetId 없음");
        const resultResponse = await fetch("/api/apify/results", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            projectId,
            datasetId: finalDatasetId ?? "demo-dataset",
            target
          })
        });
        const resultPayload = await parseResponse(resultResponse);
        if (resultPayload.account) allAccounts.push(resultPayload.account);
        allItems.push(...(resultPayload.reels ?? []));

        setAccounts([...allAccounts]);
        setItems([...allItems]);
      }

      const groupedResult = getRecentTopContent(allItems, 10);
      pushEvent(
        "분석 완료",
        "success",
        `${allAccounts.length}개 계정 · 최근 30일 콘텐츠 ${groupedResult.recent.length}개 · 터진 릴스 TOP 3 선별 완료`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      setApifyStatus("ERROR");
      pushEvent("분석 실패", "error", message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>여러 계정 분석</CardTitle>
          <CardDescription>
            인스타그램 계정을 여러 개 입력하면 각 계정의 최근 30일 게시물/릴스를 분석하고, 가장 잘 터진 릴스 3개를 뽑습니다.
          </CardDescription>
        </CardHeader>
        <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
          <Textarea
            value={targets}
            onChange={(event) => setTargets(event.target.value)}
            placeholder={"https://www.instagram.com/account1/\nhttps://www.instagram.com/account2/"}
            className="min-h-24"
          />
          <Select value={limit} onChange={(event) => setLimit(event.target.value)}>
            <option value="10">계정당 기본 10</option>
            <option value="30">계정당 기본 30</option>
            <option value="50">계정당 기본 50</option>
            <option value="100">계정당 기본 100</option>
          </Select>
          <Button onClick={runAnalysis} disabled={isPending}>
            {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            분석 실행
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <RunInfo label="Apify 상태" value={apifyStatus} />
          <RunInfo label="최근 Run ID" value={runId ?? "-"} mono />
          <RunInfo label="최근 Dataset ID" value={datasetId ?? "-"} mono />
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>진행 결과</CardTitle>
          <CardDescription>여러 계정 분석 진행 상황을 순서대로 보여줍니다.</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={`${event.time}-${index}`} className="flex gap-3 rounded-lg border p-3">
              <StatusIcon state={event.state} />
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

      {accounts.length ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Metric label="분석 계정" value={`${accounts.length}개`} />
          <Metric label="최근 30일 콘텐츠" value={`${grouped.recent.length}개`} />
          <Metric label="게시물 TOP" value={`${grouped.topPosts.length}개`} />
          <Metric label="릴스 TOP" value={`${grouped.topReels.length}개`} />
          <Metric label="터진 릴스" value={`${grouped.topReelsOverall.length}개`} />
        </div>
      ) : null}

      {grouped.topReelsOverall.length ? (
        <Card>
          <CardHeader>
            <CardTitle>여러 계정에서 가장 잘 터진 릴스 TOP 3</CardTitle>
            <CardDescription>상세보기를 누르면 스크립트, 시간대별 구성, 후킹 요소, 화면 전환 효과를 분석합니다.</CardDescription>
          </CardHeader>
          <div className="grid gap-4 md:grid-cols-3">
            {grouped.topReelsOverall.map((item, index) => (
              <InstagramContentCard
                key={item.id}
                item={item}
                rank={index + 1}
                detailHref={`/projects/${projectId}/reels/${item.id}`}
              />
            ))}
          </div>
        </Card>
      ) : null}

      {items.length ? (
        <div className="flex justify-end">
          <Link href={`/projects/${projectId}/analysis`}>
            <Button variant="outline">
              <Eye className="h-4 w-4" />분석 데이터 View 열기
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function StatusIcon({ state }: { state: StepState }) {
  if (state === "success") return <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />;
  if (state === "error") return <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />;
  if (state === "running") return <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary" />;
  return <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />;
}

function RunInfo({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </Card>
  );
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
    throw new Error(payload.error ?? "요청 실패");
  }
  return payload;
}
