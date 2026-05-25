import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listProjects } from "@/lib/projects";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">프로젝트</h1>
          <p className="mt-2 text-muted-foreground">
            경쟁사 분석 데이터와 생성 스크립트는 각 프로젝트 안에서만 사용됩니다.
          </p>
        </div>
        <Link href="/projects/new">
          <Button>새 프로젝트</Button>
        </Link>
      </div>

      {projects.length ? (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.topic || "주제가 아직 입력되지 않았습니다."}</CardDescription>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                <Link href={`/projects/${project.id}`}>
                  <Button>프로젝트 열기</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>아직 프로젝트가 없습니다</CardTitle>
            <CardDescription>프로젝트를 만든 뒤 그 안에서 경쟁사 릴스를 분석해 데이터를 쌓으세요.</CardDescription>
          </CardHeader>
          <Link href="/projects/new">
            <Button>첫 프로젝트 만들기</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
