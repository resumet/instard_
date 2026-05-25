import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GenerateForm } from "@/components/generate-form";
import { getProject, getProjectAnalysisData } from "@/lib/projects";

export default async function GeneratePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  const { reels } = await getProjectAnalysisData(projectId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-primary">{project.name}</p>
          <h1 className="text-3xl font-bold">릴스 스크립트 생성</h1>
          <p className="mt-2 text-muted-foreground">
            이 프로젝트에서 분석한 {reels.length}개 릴스의 성과 구조만 참고합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/projects/${projectId}/competitors`}>
            <Button variant="outline">분석 추가</Button>
          </Link>
          <Link href={`/projects/${projectId}`}>
            <Button variant="outline">프로젝트로 돌아가기</Button>
          </Link>
        </div>
      </div>
      <GenerateForm
        projectId={projectId}
        defaultTopic={project.topic}
        defaultAudience={project.target_audience}
        defaultTone={project.tone}
        analyzedReelCount={reels.length}
      />
    </div>
  );
}
