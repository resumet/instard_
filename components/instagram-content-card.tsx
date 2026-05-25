import Link from "next/link";
import { Eye, Heart, MessageCircle, Play } from "lucide-react";
import type { CompetitorReel } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { proxiedMediaUrl } from "@/lib/media-proxy";
import { Button } from "@/components/ui/button";

export function InstagramContentCard({
  item,
  rank,
  detailHref
}: {
  item: CompetitorReel;
  rank: number;
  detailHref?: string;
}) {
  const isVideo = item.media_type === "reel" || item.media_type === "video" || Boolean(item.video_url);
  const proxiedThumbnail = proxiedMediaUrl(item.thumbnail_url);
  const mediaSrc = proxiedThumbnail || item.video_url;

  return (
    <article className="overflow-hidden rounded-lg border bg-white">
      <a href={item.reel_url} target="_blank" rel="noreferrer" className="block">
        <div className="relative aspect-square bg-muted">
          {item.video_url ? (
            <video
              className="h-full w-full object-cover"
              src={item.video_url}
              poster={proxiedThumbnail ?? undefined}
              muted
              playsInline
              preload="metadata"
            />
          ) : mediaSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="h-full w-full object-cover" src={mediaSrc} alt={item.caption || item.shortcode} />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
              미디어 미리보기 없음
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
            #{rank}
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white">
            {isVideo ? "Reels" : item.media_type === "carousel" ? "Carousel" : "Post"}
          </div>
          {isVideo ? (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/70 p-2 text-white">
              <Play className="h-4 w-4 fill-current" />
            </div>
          ) : null}
        </div>
      </a>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold">{item.shortcode}</span>
          <span className="rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground">
            점수 {Math.round(item.performance_score * 100)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
          <Metric icon={Eye} label="조회" value={formatNumber(item.view_count)} />
          <Metric icon={Heart} label="좋아요" value={formatNumber(item.like_count)} />
          <Metric icon={MessageCircle} label="댓글" value={formatNumber(item.comment_count)} />
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-foreground">{item.caption || "캡션 없음"}</p>
        <div className="flex flex-wrap gap-1">
          {item.hashtags?.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
              #{tag}
            </span>
          ))}
        </div>
        {detailHref ? (
          <Link href={detailHref} className="block">
            <Button className="w-full" variant="outline">
              상세보기
            </Button>
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted px-2 py-2">
      <div className="flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}
