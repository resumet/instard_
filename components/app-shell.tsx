import Link from "next/link";
import { BarChart3, FolderKanban } from "lucide-react";
import { env, hasSupabaseAdminEnv } from "@/lib/env";

const nav = [
  { href: "/dashboard", label: "대시보드", icon: BarChart3 },
  { href: "/projects", label: "프로젝트", icon: FolderKanban }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const supabaseConnected = hasSupabaseAdminEnv();
  const statusText = supabaseConnected
    ? env.authRequired
      ? "Supabase 연결됨 · 로그인 저장 모드"
      : "Supabase 연결됨 · 로그인 없는 분석 모드"
    : "Supabase 미연결 · 데모 데이터 모드";

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white/92 p-5 md:block">
        <Link href="/dashboard" className="block">
          <p className="text-sm font-medium text-primary">Reels Insight</p>
          <h1 className="mt-1 text-xl font-bold">Planner</h1>
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-lg bg-accent p-3 text-xs text-accent-foreground">
          {statusText}
        </div>
      </aside>
      <main className="px-4 py-5 md:ml-64 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
