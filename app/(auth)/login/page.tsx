import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>Supabase가 연결되어 있지 않으면 데모 모드로 이동합니다.</CardDescription>
        </CardHeader>
        <AuthForm mode="login" />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          계정이 없나요? <Link className="font-medium text-primary" href="/signup">회원가입</Link>
        </p>
      </Card>
    </main>
  );
}
