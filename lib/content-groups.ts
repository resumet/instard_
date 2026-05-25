import type { CompetitorReel } from "@/lib/types";

export function getRecentTopContent(reels: CompetitorReel[], limit = 10) {
  const recent = reels.filter((item) => isWithinDays(item.posted_at, 30));
  const sorted = recent.slice().sort(compareContentPerformance);

  return {
    recent,
    topReelsOverall: sorted
      .filter((item) => isReelLike(item))
      .slice(0, 3),
    topPosts: sorted
      .filter((item) => isPostLike(item))
      .slice(0, limit),
    topReels: sorted
      .filter((item) => isReelLike(item))
      .slice(0, limit)
  };
}

export function isReelLike(item: CompetitorReel) {
  return item.media_type === "reel" || item.media_type === "video" || Boolean(item.video_url);
}

export function isPostLike(item: CompetitorReel) {
  return item.media_type === "post" || item.media_type === "carousel" || !isReelLike(item);
}

function compareContentPerformance(a: CompetitorReel, b: CompetitorReel) {
  const aScore = a.performance_score * 100_000 + a.like_count * 2 + a.comment_count * 8 + a.view_count;
  const bScore = b.performance_score * 100_000 + b.like_count * 2 + b.comment_count * 8 + b.view_count;
  return bScore - aScore;
}

function isWithinDays(value: string | null | undefined, days: number) {
  if (!value) return true;
  const postedAt = new Date(value).getTime();
  if (Number.isNaN(postedAt)) return true;
  return Date.now() - postedAt <= days * 86_400_000;
}
