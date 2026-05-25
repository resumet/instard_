import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CompetitorAnalyzer } from "@/components/competitor-analyzer";
import { getProject } from "@/lib/projects";

export default async function CompetitorsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm text-primary">{project.name}</p>
          <h1 className="text-3xl font-bold">경쟁사 분석</h1>
          <p className="mt-2 text-muted-foreground">
            분석 결과는 이 프로젝트에만 저장되고, 이 프로젝트의 스크립트 생성에만 사용됩니다.
          </p>
        </div>
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline">프로젝트로 돌아가기</Button>
        </Link>
      </div>
      <CompetitorAnalyzer projectId={projectId} />
    </div>
  );
}
