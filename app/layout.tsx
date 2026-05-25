import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reels Insight Planner",
  description: "경쟁사 릴스 분석 기반 스크립트와 촬영 콘티 생성 MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
