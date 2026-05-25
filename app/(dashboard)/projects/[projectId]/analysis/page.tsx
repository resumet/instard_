import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clapperboard, Sparkles, Tags, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstagramContentCard } from "@/components/instagram-content-card";
import { getRecentTopContent } from "@/lib/content-groups";
import { buildProjectInsightSummary } from "@/lib/insights";
import { getProject, getProjectAnalysisData } from "@/lib/projects";
import { formatNumber } from "@/lib/utils";

export default async function ProjectAnalysisPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const { accounts, reels } = await getProjectAnalysisData(projectId);
  const insights = buildProjectInsightSummary(project, accounts, reels);
  const { recent, topPosts, topReels } = getRecentTopContent(reels, 10);
  const top3Reels = getRecentTopContent(reels, 3).topReelsOverall;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />프로젝트로 돌아가기
          </Link>
          <p className="mt-4 text-sm text-primary">{project.name}</p>
          <h1 className="text-3xl font-bold">분석 데이터 View</h1>
          <p className="mt-2 text-muted-foreground">
            이 프로젝트에 쌓인 경쟁사 릴스 데이터와 생성에 참고될 요약 내용을 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/projects/${projectId}/competitors`}>
            <Button variant="outline">
              <Clapperboard className="h-4 w-4" />분석 추가
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/generate`}>
            <Button>
              <Sparkles className="h-4 w-4" />이 데이터로 생성
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Clapperboard} label="분석 계정" value={`${insights.accountCount}개`} />
        <Metric icon={TrendingUp} label="최근 30일 콘텐츠" value={`${recent.length}개`} />
        <Metric icon={Sparkles} label="생성 준비도" value={insights.readiness} />
        <Metric icon={Tags} label="상위 해시태그" value={`${insights.topHashtags.length}개`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>요약</CardTitle>
          <CardDescription>스크립트 생성 전에 확인할 프로젝트 전용 분석 요약입니다.</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          <p className="leading-7">{insights.summaryText}</p>
          <p className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{insights.generationFitText}</p>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>여러 계정에서 가장 잘 터진 릴스 TOP 3</CardTitle>
          <CardDescription>상세보기에서 스크립트, 시간대별 구성, 후킹 요소, 화면전환 효과를 확인합니다.</CardDescription>
        </CardHeader>
        {top3Reels.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {top3Reels.map((item, index) => (
              <InstagramContentCard
                key={item.id}
                item={item}
                rank={index + 1}
                detailHref={`/projects/${projectId}/reels/${item.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="최근 30일 안에 표시할 릴스 데이터가 없습니다." />
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>평균 성과</CardTitle>
            <CardDescription>현재 프로젝트 데이터 기준</CardDescription>
          </CardHeader>
          <div className="grid gap-3">
            <Stat label="평균 조회수" value={formatNumber(insights.avgViews)} />
            <Stat label="평균 좋아요" value={formatNumber(insights.avgLikes)} />
            <Stat label="평균 댓글" value={formatNumber(insights.avgComments)} />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>후킹 패턴</CardTitle>
            <CardDescription>상위 릴스 캡션 기반 추정</CardDescription>
          </CardHeader>
          <TagList items={insights.hookPatterns} empty="후킹 패턴을 계산할 릴스가 없습니다." />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>콘텐츠 포맷</CardTitle>
            <CardDescription>생성 프롬프트에 참고되는 구조</CardDescription>
          </CardHeader>
          <TagList items={insights.contentFormats} empty="콘텐츠 포맷을 계산할 릴스가 없습니다." />
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 30일 반응 좋은 게시물 TOP 10</CardTitle>
          <CardDescription>사진/캐러셀 게시물 중 좋아요, 댓글, 성과 점수가 높은 콘텐츠입니다.</CardDescription>
        </CardHeader>
        {topPosts.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {topPosts.map((item, index) => (
              <InstagramContentCard key={item.id} item={item} rank={index + 1} />
            ))}
          </div>
        ) : (
          <EmptyState text="최근 30일 안에 표시할 게시물 데이터가 없습니다." />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 30일 반응 좋은 릴스 TOP 10</CardTitle>
          <CardDescription>릴스/영상 중 조회수, 좋아요, 댓글, 성과 점수가 높은 콘텐츠입니다.</CardDescription>
        </CardHeader>
        {topReels.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {topReels.map((item, index) => (
              <InstagramContentCard
                key={item.id}
                item={item}
                rank={index + 1}
                detailHref={`/projects/${projectId}/reels/${item.id}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="최근 30일 안에 표시할 릴스 데이터가 없습니다." />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>분석된 전체 데이터</CardTitle>
          <CardDescription>최근 30일 필터를 포함해 정규화된 콘텐츠입니다. 이 데이터가 스크립트 생성에 전달됩니다.</CardDescription>
        </CardHeader>
        {recent.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2">콘텐츠</th>
                  <th>타입</th>
                  <th>해시태그</th>
                  <th>조회수</th>
                  <th>좋아요</th>
                  <th>댓글</th>
                  <th>점수</th>
                  <th>인기</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice().sort((a, b) => b.performance_score - a.performance_score).map((reel) => (
                  <tr key={reel.id} className="border-t align-top">
                    <td className="max-w-md py-3">
                      <a href={reel.reel_url} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">
                        {reel.shortcode}
                      </a>
                      <p className="mt-1 line-clamp-3 text-muted-foreground">{reel.caption || "캡션 없음"}</p>
                    </td>
                    <td className="py-3">{reel.media_type ?? "post"}</td>
                    <td className="max-w-[180px] py-3 text-muted-foreground">
                      {reel.hashtags?.slice(0, 4).join(", ") || "-"}
                    </td>
                    <td className="py-3">{formatNumber(reel.view_count)}</td>
                    <td className="py-3">{formatNumber(reel.like_count)}</td>
                    <td className="py-3">{formatNumber(reel.comment_count)}</td>
                    <td className="py-3">{Math.round(reel.performance_score * 100)}</td>
                    <td className="py-3">{reel.is_top_performer ? "TOP" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="아직 분석된 콘텐츠가 없습니다. 경쟁사 분석을 먼저 실행하세요." />
        )}
      </Card>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">{text}</div>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Clapperboard; label: string; value: string }) {
  return (
    <Card>
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold">{value}</p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function TagList({ items, empty }: { items: Array<{ label: string; count: number }>; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item.label} className="rounded-full bg-muted px-3 py-1 text-sm">
          {item.label} · {item.count}
        </span>
      ))}
    </div>
  );
}
