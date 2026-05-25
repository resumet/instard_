import { NextRequest } from "next/server";

export const runtime = "nodejs";

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <rect width="800" height="800" fill="#f4f4f5"/>
  <rect x="180" y="238" width="440" height="324" rx="24" fill="#e4e4e7"/>
  <circle cx="302" cy="342" r="46" fill="#a1a1aa"/>
  <path d="M216 526l126-144 92 100 54-62 96 106H216z" fill="#71717a"/>
  <text x="400" y="632" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#52525b">이미지를 불러올 수 없습니다</text>
</svg>`;

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl) return placeholderResponse();

  let target: URL;
  try {
    target = new URL(rawUrl.replaceAll("&amp;", "&"));
  } catch {
    return placeholderResponse();
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return placeholderResponse();
  }

  try {
    const response = await fetch(target.toString(), {
      cache: "no-store",
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        referer: "https://www.instagram.com/",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
      }
    });

    if (!response.ok) return placeholderResponse();

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const body = await response.arrayBuffer();

    return new Response(body, {
      headers: {
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
        "content-type": contentType
      }
    });
  } catch {
    return placeholderResponse();
  }
}

function placeholderResponse() {
  return new Response(PLACEHOLDER_SVG, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "image/svg+xml; charset=utf-8"
    }
  });
}
