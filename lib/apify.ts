import { scoreReels, summarizeAccount } from "@/lib/analysis";
import { demoAccount, demoReels } from "@/lib/demo-data";
import { env } from "@/lib/env";
import type { CompetitorAccount, CompetitorReel } from "@/lib/types";

type ApifyRunResponse = {
  data?: {
    id: string;
    status: string;
    defaultDatasetId?: string;
  };
};

type ApifyDatasetItem = Record<string, unknown>;

const RECENT_DAYS = 30;

export async function startInstagramScrape(input: {
  projectId: string;
  target: string;
  limit: number;
}) {
  if (!env.apifyToken) {
    return {
      runId: `demo-run-${Date.now()}`,
      status: "SUCCEEDED",
      datasetId: "demo-dataset",
      demo: true
    };
  }

  const profileUrl = toProfileUrl(input.target);
  const reelsUrl = toReelsUrl(input.target);
  const body = {
    directUrls: Array.from(new Set([profileUrl, reelsUrl])),
    resultsLimit: Math.max(input.limit * 6, 60),
    resultsType: "posts",
    addParentData: true
  };

  const response = await fetch(
    `https://api.apify.com/v2/acts/${encodeURIComponent(env.apifyInstagramActorId)}/runs?token=${env.apifyToken}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Apify 실행 실패: ${response.status} ${detail.slice(0, 500)}`);
  }

  const payload = (await response.json()) as ApifyRunResponse;
  return {
    runId: payload.data?.id,
    status: payload.data?.status ?? "READY",
    datasetId: payload.data?.defaultDatasetId,
    demo: false
  };
}

export async function getApifyRunStatus(runId: string) {
  if (runId.startsWith("demo-run")) {
    return { runId, status: "SUCCEEDED", datasetId: "demo-dataset", demo: true };
  }
  if (!env.apifyToken) throw new Error("APIFY_TOKEN이 설정되지 않았습니다.");

  const response = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${env.apifyToken}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Apify 상태 조회 실패: ${response.status} ${detail.slice(0, 500)}`);
  }

  const payload = (await response.json()) as ApifyRunResponse;
  return {
    runId,
    status: payload.data?.status ?? "UNKNOWN",
    datasetId: payload.data?.defaultDatasetId,
    demo: false
  };
}

export async function getApifyDataset(datasetId: string) {
  if (datasetId === "demo-dataset" || !env.apifyToken) {
    return normalizeScrapeResult(demoReels, "demo-project", "sample_reels_lab");
  }

  const response = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${env.apifyToken}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Apify dataset 조회 실패: ${response.status} ${detail.slice(0, 500)}`);
  }

  const items = (await response.json()) as ApifyDatasetItem[];
  return normalizeScrapeResult(items, "runtime-project", inferHandle(items));
}

export function normalizeScrapeResult(
  items: ApifyDatasetItem[] | CompetitorReel[],
  projectId: string,
  handle: string
): { account: CompetitorAccount; reels: CompetitorReel[] } {
  if (items.length && "performance_score" in items[0]) {
    return {
      account: demoAccount,
      reels: (items as CompetitorReel[]).map((item) => ({
        ...item,
        media_type: item.media_type ?? (item.video_url ? "reel" : "post")
      }))
    };
  }

  const seen = new Set<string>();
  const normalizedBase = (items as ApifyDatasetItem[])
    .map((item, index) => normalizeItem(item, index))
    .filter((item) => {
      if (!isWithinRecentDays(item.posted_at, RECENT_DAYS)) return false;
      if (seen.has(item.shortcode)) return false;
      seen.add(item.shortcode);
      return true;
    });

  const scored = scoreReels(normalizedBase);
  const accountStats = summarizeAccount(scored);
  const account: CompetitorAccount = {
    id: `account-${handle}`,
    project_id: projectId,
    instagram_handle: handle,
    profile_url: `https://instagram.com/${handle}`,
    display_name: handle,
    bio: null,
    follower_count: null,
    following_count: null,
    post_count: scored.length,
    ...accountStats
  };

  return {
    account,
    reels: scored.map((item) => ({
      ...item,
      competitor_account_id: account.id
    }))
  };
}

function normalizeItem(item: ApifyDatasetItem, index: number) {
  const url = pickString(item, ["url", "displayUrl", "inputUrl"]) ?? `https://instagram.com/p/${index}`;
  const caption = pickString(item, ["caption", "text", "title"]) ?? "";
  const hashtags = caption.match(/#[\p{L}\p{N}_]+/gu)?.map((tag) => tag.slice(1)) ?? [];
  const shortcode = pickString(item, ["shortCode", "shortcode", "id"]) ?? `post-${index}`;
  const media_type = inferMediaType(item);
  const viewCount = pickNumber(item, ["videoViewCount", "videoPlayCount", "viewCount", "views", "plays"]) ?? 0;

  return {
    id: `reel-${shortcode}`,
    competitor_account_id: "pending-account",
    reel_url: url,
    shortcode,
    media_type,
    caption,
    hashtags,
    thumbnail_url: pickString(item, ["thumbnailUrl", "displayUrl", "imageUrl", "image"]),
    video_url: pickString(item, ["videoUrl", "video_url"]),
    duration_seconds: pickNumber(item, ["videoDuration", "duration", "durationSeconds"]),
    view_count: viewCount,
    like_count: pickNumber(item, ["likesCount", "likeCount", "likes"]) ?? 0,
    comment_count: pickNumber(item, ["commentsCount", "commentCount", "comments"]) ?? 0,
    posted_at: pickString(item, ["timestamp", "postedAt", "takenAt"]) ?? null
  };
}

function inferMediaType(item: ApifyDatasetItem): "post" | "reel" | "video" | "carousel" {
  const type = pickString(item, ["type"])?.toLowerCase() ?? "";
  const productType = pickString(item, ["productType"])?.toLowerCase() ?? "";
  const url = pickString(item, ["url", "inputUrl"]) ?? "";
  if (productType === "clips" || url.includes("/reel/")) return "reel";
  if (type === "video" || pickString(item, ["videoUrl", "video_url"])) return "video";
  if (type === "sidecar" || type === "carousel") return "carousel";
  return "post";
}

function isWithinRecentDays(value: string | null | undefined, days: number) {
  if (!value) return true;
  const postedAt = new Date(value).getTime();
  if (Number.isNaN(postedAt)) return true;
  return Date.now() - postedAt <= days * 86_400_000;
}

function pickString(item: ApifyDatasetItem, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.length) return value;
  }
  return null;
}

function pickNumber(item: ApifyDatasetItem, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function inferHandle(items: ApifyDatasetItem[]) {
  const first = items[0];
  if (!first) return "instagram_account";
  const ownerObject = first.owner && typeof first.owner === "object" ? (first.owner as Record<string, unknown>) : null;
  const owner = first.ownerUsername ?? first.username ?? first.ownerFullName ?? ownerObject?.username;
  return typeof owner === "string" ? owner : "instagram_account";
}

function toProfileUrl(target: string) {
  try {
    const url = new URL(target);
    if (!url.hostname.includes("instagram.com")) return target;
    if (url.pathname.includes("/reel/") || url.pathname.includes("/p/")) return target;
    const handle = url.pathname.split("/").filter(Boolean)[0];
    return handle ? `https://www.instagram.com/${handle}/` : target;
  } catch {
    const handle = target.replace("@", "").replace(/^\/+|\/+$/g, "");
    return `https://www.instagram.com/${handle}/`;
  }
}

function toReelsUrl(target: string) {
  try {
    const url = new URL(target);
    if (!url.hostname.includes("instagram.com")) return target;
    if (url.pathname.includes("/reel/") || url.pathname.includes("/p/")) return target;
    const handle = url.pathname.split("/").filter(Boolean)[0];
    return handle ? `https://www.instagram.com/${handle}/reels/` : target;
  } catch {
    const handle = target.replace("@", "").replace(/^\/+|\/+$/g, "");
    return `https://www.instagram.com/${handle}/reels/`;
  }
}
