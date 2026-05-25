import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Eye, Heart, MessageCircle, Music, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstagramContentCard } from "@/components/instagram-content-card";
import { TranscriptExtractor } from "@/components/transcript-extractor";
import { buildReelDetailAnalysis } from "@/lib/reel-detail-analysis";
import { getLatestReelTranscript, getProject, getProjectReel } from "@/lib/projects";
import { formatNumber } from "@/lib/utils";

export default async function ReelDetailPage({
  params
}: {
  params: Promise<{ projectId: string; reelId: string }>;
}) {
  const { projectId, reelId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const reel = await getProjectReel(projectId, reelId);
  if (!reel) notFound();

  const savedTranscript = await getLatestReelTranscript(projectId, reel.id);
  const transcriptText = savedTranscript?.cleaned_transcript || savedTranscript?.raw_transcript || "";
  const analysis = buildReelDetailAnalysis(reel, transcriptText);
  const videoDownloadHref = `/api/projects/${projectId}/reels/${reel.id}/video`;
  const audioDownloadHref = `/api/projects/${projectId}/reels/${reel.id}/audio`;
  const transcriptEndpoint = `/api/projects/${projectId}/reels/${reel.id}/transcript`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Link
            href={`/projects/${projectId}/analysis`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            분석 데이터로 돌아가기
          </Link>
          <p className="mt-4 text-sm text-primary">{project.name}</p>
          <h1 className="text-3xl font-bold">릴스 상세 분석</h1>
          <p className="mt-2 text-muted-foreground">
            영상 다운로드, 음성 추출, 전사 텍스트, 시간대별 스크립트 구조를 확인합니다.
          </p>
        </div>
        <Link href={`/projects/${projectId}/generate`}>
          <Button>
            <Sparkles className="h-4 w-4" />이 프로젝트로 스크립트 생성
          </Button>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <InstagramContentCard item={reel} rank={1} />

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric icon={Eye} label="조회수" value={formatNumber(reel.view_count)} />
            <Metric icon={Heart} label="좋아요" value={formatNumber(reel.like_count)} />
            <Metric icon={MessageCircle} label="댓글" value={formatNumber(reel.comment_count)} />
            <Metric icon={Sparkles} label="성과 점수" value={String(Math.round(reel.performance_score * 100))} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>영상/음성 다운로드</CardTitle>
              <CardDescription>
                Apify가 제공한 영상 URL이 있으면 서버에서 영상을 받아오고, ffmpeg로 MP3 음성을 추출합니다.
              </CardDescription>
            </CardHeader>
            {reel.video_url ? (
              <div className="flex flex-wrap gap-2">
                <a href={videoDownloadHref}>
                  <Button variant="outline">
                    <Download className="h-4 w-4" />
                    영상 다운로드
                  </Button>
                </a>
                <a href={audioDownloadHref}>
                  <Button>
                    <Music className="h-4 w-4" />
                    음성 MP3 추출 다운로드
                  </Button>
                </a>
              </div>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                이 릴스에는 다운로드 가능한 영상 URL이 저장되어 있지 않습니다.
              </p>
            )}
          </Card>
        </div>
      </div>

      <TranscriptExtractor
        endpoint={transcriptEndpoint}
        disabled={!reel.video_url}
        initialTranscript={analysis.transcript}
        initialScenes={analysis.scenes}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <InsightCard title="후킹 요소" items={analysis.hookElements} emptyLabel="음성 텍스트 추출 후 표시됩니다." />
        <InsightCard title="화면 전환/편집 효과" items={analysis.transitionEffects} emptyLabel="음성 텍스트 추출 후 표시됩니다." />
        <InsightCard title="잘 된 이유" items={analysis.successReasons} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>주의</CardTitle>
        </CardHeader>
        <p className="text-sm leading-6 text-muted-foreground">{analysis.caution}</p>
      </Card>
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

function InsightCard({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {items.length ? (
        <ul className="space-y-2 text-sm leading-6">
          {items.map((item) => (
            <li key={item} className="rounded-lg bg-muted p-3">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          {emptyLabel ?? "분석 데이터가 없습니다."}
        </p>
      )}
    </Card>
  );
}
