import { ProjectForm } from "@/components/project-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>새 프로젝트 만들기</CardTitle>
          <CardDescription>내 콘텐츠 주제와 목표를 먼저 정리합니다.</CardDescription>
        </CardHeader>
        <ProjectForm />
      </Card>
    </div>
  );
}
