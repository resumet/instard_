import type { CompetitorReel } from "@/lib/types";

export function normalizeMetric(value: number, max: number) {
  if (!max) return 0;
  return Math.min(value / max, 1);
}

export function freshnessScore(postedAt?: string | null) {
  if (!postedAt) return 0.5;
  const ageMs = Date.now() - new Date(postedAt).getTime();
  const ageDays = Math.max(ageMs / 86_400_000, 0);
  return Math.max(0, 1 - ageDays / 90);
}

export function scoreReels<T extends Omit<CompetitorReel, "performance_score" | "is_top_performer">>(
  reels: T[]
): Array<T & Pick<CompetitorReel, "performance_score" | "is_top_performer">> {
  const maxViews = Math.max(...reels.map((reel) => reel.view_count), 0);
  const maxLikes = Math.max(...reels.map((reel) => reel.like_count), 0);
  const maxComments = Math.max(...reels.map((reel) => reel.comment_count), 0);
  const avgViews = average(reels.map((reel) => reel.view_count));
  const avgEngagement = average(
    reels.map((reel) => engagementRate(reel.like_count, reel.comment_count, reel.view_count))
  );
  const sortedViews = [...reels].sort((a, b) => b.view_count - a.view_count);
  const topCount = Math.max(1, Math.ceil(reels.length * 0.2));
  const topShortcodes = new Set(sortedViews.slice(0, topCount).map((reel) => reel.shortcode));

  return reels.map((reel) => {
    const performance_score =
      normalizeMetric(reel.view_count, maxViews) * 0.5 +
      normalizeMetric(reel.like_count, maxLikes) * 0.25 +
      normalizeMetric(reel.comment_count, maxComments) * 0.15 +
      freshnessScore(reel.posted_at) * 0.1;
    const engagement = engagementRate(reel.like_count, reel.comment_count, reel.view_count);

    return {
      ...reel,
      performance_score: Number(performance_score.toFixed(4)),
      is_top_performer:
        reel.view_count >= avgViews * 2 ||
        topShortcodes.has(reel.shortcode) ||
        engagement >= avgEngagement * 1.5
    };
  });
}

export function summarizeAccount(reels: CompetitorReel[]) {
  return {
    avg_views: Math.round(average(reels.map((reel) => reel.view_count))),
    avg_likes: Math.round(average(reels.map((reel) => reel.like_count))),
    avg_comments: Math.round(average(reels.map((reel) => reel.comment_count)))
  };
}

export function engagementRate(likes: number, comments: number, views: number) {
  if (!views) return 0;
  return (likes + comments) / views;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
