"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export function ProjectForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    const payload = await response.json();
    router.push(`/projects/${payload.project?.id ?? "demo-project"}`);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Input name="name" placeholder="프로젝트명" defaultValue="부동산 투자 릴스 기획" required />
      <Textarea name="topic" placeholder="콘텐츠 주제" defaultValue="40대 직장인을 위한 부동산 투자" />
      <Textarea name="target_audience" placeholder="타깃 고객" defaultValue="퇴직 후 노후가 걱정되는 직장인" />
      <Select name="goal" defaultValue="상담 신청">
        <option>조회수 증가</option>
        <option>팔로워 증가</option>
        <option>상품 판매</option>
        <option>브랜딩</option>
        <option>상담 신청</option>
      </Select>
      <Input name="tone" placeholder="톤앤매너" defaultValue="현실적이고 친근한 조언형" />
      <Button disabled={isPending}>{isPending ? "생성 중..." : "프로젝트 만들기"}</Button>
    </form>
  );
}
