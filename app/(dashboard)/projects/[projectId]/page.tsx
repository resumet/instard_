import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, Clapperboard, Eye, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildProjectInsightSummary } from "@/lib/insights";
import { getProject, getProjectAnalysisData } from "@/lib/projects";
import { formatNumber } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const { accounts, reels, outputs } = await getProjectAnalysisData(projectId);
  const insights = buildProjectInsightSummary(project, accounts, reels);
  const topReels = reels.slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm text-primary">{project.id}</p>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="mt-2 text-muted-foreground">{project.topic || "프로젝트 주제가 비어 있습니다."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/projects/${projectId}/competitors`}>
            <Button variant="outline">
              <Clapperboard className="h-4 w-4" />경쟁사 분석
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/analysis`}>
            <Button variant="outline">
              <Eye className="h-4 w-4" />분석 데이터 보기
            </Button>
          </Link>
          <Link href={`/projects/${projectId}/generate`}>
            <Button>
              <Sparkles className="h-4 w-4" />스크립트 생성
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={Clapperboard} label="분석 계정" value={`${accounts.length}개`} />
        <Metric icon={BarChart3} label="분석 릴스" value={`${reels.length}개`} />
        <Metric icon={Sparkles} label="생성 결과" value={`${outputs.length}개`} />
        <Metric icon={FileText} label="데이터 범위" value="프로젝트 전용" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>분석 요약</CardTitle>
          <CardDescription>현재 프로젝트 안에 쌓인 릴스 데이터만 요약합니다.</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          <p className="leading-7">{insights.summaryText}</p>
          <p className="rounded-lg bg-accent p-3 text-sm text-accent-foreground">{insights.generationFitText}</p>
          <Link href={`/projects/${projectId}/analysis`}>
            <Button variant="outline">
              <Eye className="h-4 w-4" />분석 데이터 전체 보기
            </Button>
          </Link>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 내 분석 데이터</CardTitle>
          <CardDescription>
            이 목록의 릴스만 스크립트 생성에 참고됩니다. 다른 프로젝트의 분석 데이터는 섞이지 않습니다.
          </CardDescription>
        </CardHeader>
        {topReels.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2">릴스</th>
                  <th>조회수</th>
                  <th>좋아요</th>
                  <th>댓글</th>
                  <th>점수</th>
                  <th>인기</th>
                </tr>
              </thead>
              <tbody>
                {topReels.map((reel) => (
                  <tr key={reel.id} className="border-t">
                    <td className="max-w-md py-3">
                      <a href={reel.reel_url} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">
                        {reel.shortcode}
                      </a>
                      <p className="line-clamp-2 text-muted-foreground">{reel.caption || "캡션 없음"}</p>
                    </td>
                    <td>{formatNumber(reel.view_count)}</td>
                    <td>{formatNumber(reel.like_count)}</td>
                    <td>{formatNumber(reel.comment_count)}</td>
                    <td>{Math.round(reel.performance_score * 100)}</td>
                    <td>{reel.is_top_performer ? "TOP" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
            아직 분석된 릴스가 없습니다. 먼저 이 프로젝트에서 경쟁사 분석을 실행하세요.
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>생성 흐름</CardTitle>
          <CardDescription>분석 데이터가 쌓일수록 이 프로젝트의 스크립트 생성 품질이 좋아집니다.</CardDescription>
        </CardHeader>
        <div className="grid gap-3 md:grid-cols-3">
          <Step title="1. 프로젝트 생성" description="주제와 타깃을 프로젝트에 저장합니다." done />
          <Step title="2. 경쟁사 릴스 분석" description="이 프로젝트 전용 릴스 데이터셋을 쌓습니다." done={reels.length > 0} />
          <Step title="3. 스크립트 생성" description="프로젝트 내 인기 릴스 구조만 참고합니다." done={outputs.length > 0} />
        </div>
      </Card>
    </div>
  );
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

function Step({ title, description, done }: { title: string; description: string; done: boolean }) {
  return (
    <div className="rounded-lg border p-4">
      <span className={done ? "text-sm font-semibold text-primary" : "text-sm font-semibold text-muted-foreground"}>
        {done ? "완료/가능" : "대기"}
      </span>
      <p className="mt-2 font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
