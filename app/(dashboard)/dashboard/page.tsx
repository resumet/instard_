import Link from "next/link";
import { FolderKanban, FolderPlus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listProjects } from "@/lib/projects";

export default async function DashboardPage() {
  const projects = await listProjects();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Project-scoped workflow</p>
          <h1 className="text-3xl font-bold">프로젝트별로 분석하고, 그 데이터로만 스크립트를 생성합니다</h1>
          <p className="mt-2 text-muted-foreground">
            새 프로젝트를 만들면 경쟁사 릴스를 다시 분석해 해당 프로젝트 전용 데이터셋을 쌓습니다.
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <FolderPlus className="h-4 w-4" />새 프로젝트
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={FolderKanban} label="프로젝트 수" value={`${projects.length}개`} />
        <Metric icon={TrendingUp} label="데이터 범위" value="프로젝트 내부 전용" />
        <Metric icon={FolderPlus} label="다음 작업" value="프로젝트 선택 후 분석" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 프로젝트</CardTitle>
          <CardDescription>경쟁사 분석과 스크립트 생성은 프로젝트 상세 화면에서 진행합니다.</CardDescription>
        </CardHeader>
        <div className="space-y-3">
          {projects.slice(0, 5).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted"
            >
              <p className="font-semibold">{project.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{project.topic || "주제 없음"}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof FolderKanban; label: string; value: string }) {
  return (
    <Card>
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold">{value}</p>
    </Card>
  );
}
