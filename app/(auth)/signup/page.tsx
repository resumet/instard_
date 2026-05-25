import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>이메일 기반 인증을 사용합니다.</CardDescription>
        </CardHeader>
        <AuthForm mode="signup" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          이미 계정이 있나요? <Link className="font-medium text-primary" href="/login">로그인</Link>
        </p>
      </Card>
    </main>
  );
}
