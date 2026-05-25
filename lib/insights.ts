import type { CompetitorAccount, CompetitorReel, Project } from "@/lib/types";

export function buildProjectInsightSummary(
  project: Project,
  accounts: CompetitorAccount[],
  reels: CompetitorReel[]
) {
  const topReels = reels
    .slice()
    .sort((a, b) => b.performance_score - a.performance_score)
    .slice(0, 10);
  const avgViews = average(reels.map((reel) => reel.view_count));
  const avgLikes = average(reels.map((reel) => reel.like_count));
  const avgComments = average(reels.map((reel) => reel.comment_count));
  const topHashtags = topItems(reels.flatMap((reel) => reel.hashtags), 10);
  const hookPatterns = inferHookPatterns(topReels);
  const contentFormats = inferContentFormats(topReels);
  const readiness =
    reels.length >= 10
      ? "충분"
      : reels.length >= 3
        ? "기본 가능"
        : reels.length > 0
          ? "보강 필요"
          : "분석 필요";

  return {
    projectName: project.name,
    projectTopic: project.topic,
    accountCount: accounts.length,
    reelCount: reels.length,
    topReelCount: topReels.length,
    avgViews: Math.round(avgViews),
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    topHashtags,
    hookPatterns,
    contentFormats,
    readiness,
    summaryText: buildSummaryText(project, reels.length, topReels, hookPatterns, contentFormats),
    generationFitText: buildGenerationFitText(project, topReels.length, readiness)
  };
}

function buildSummaryText(
  project: Project,
  reelCount: number,
  topReels: CompetitorReel[],
  hookPatterns: Array<{ label: string; count: number }>,
  contentFormats: Array<{ label: string; count: number }>
) {
  if (!reelCount) {
    return "아직 분석된 릴스가 없습니다. 경쟁사 분석을 먼저 실행하면 프로젝트 전용 벤치마킹 데이터가 쌓입니다.";
  }

  const bestHook = hookPatterns[0]?.label ?? "문제 제기형 훅";
  const bestFormat = contentFormats[0]?.label ?? "문제 해결형";
  const bestCaption = topReels[0]?.caption ? ` 최고 성과 릴스는 "${topReels[0].caption.slice(0, 80)}" 흐름을 보입니다.` : "";
  return `${project.name} 프로젝트에는 ${reelCount}개 릴스가 분석되어 있습니다. 상위 릴스에서는 ${bestHook}과 ${bestFormat} 구성이 두드러집니다.${bestCaption}`;
}

function buildGenerationFitText(project: Project, topReelCount: number, readiness: string) {
  if (!topReelCount) {
    return "현재 생성은 프로젝트 주제와 사용자 입력만으로 가능합니다. 경쟁사 분석을 추가하면 실제 성과 패턴을 더 강하게 반영합니다.";
  }
  return `스크립트 생성은 "${project.topic || project.name}" 주제에 대해 이 프로젝트 안의 상위 ${topReelCount}개 릴스 패턴만 참고합니다. 현재 데이터 준비도는 ${readiness}입니다.`;
}

function inferHookPatterns(reels: CompetitorReel[]) {
  const patterns = reels.map((reel) => {
    const caption = reel.caption ?? "";
    if (/[?？]/.test(caption)) return "질문형 훅";
    if (/(주의|위험|실패|하지 마|손해|망하는)/.test(caption)) return "위험 경고형 훅";
    if (/(방법|하는 법|팁|체크|정리)/.test(caption)) return "실행 팁형 훅";
    if (/(왜|이유|진짜|사실)/.test(caption)) return "궁금증 유발형 훅";
    if (/(전후|before|after|비교)/i.test(caption)) return "전후 비교형 훅";
    return "문제 제기형 훅";
  });
  return topItems(patterns, 6);
}

function inferContentFormats(reels: CompetitorReel[]) {
  const formats = reels.map((reel) => {
    const caption = reel.caption ?? "";
    if (/(가지|리스트|체크리스트|첫째|둘째)/.test(caption)) return "리스트형";
    if (/(방법|하는 법|팁|체크)/.test(caption)) return "튜토리얼형";
    if (/(사례|예시|경험|했더니)/.test(caption)) return "사례형";
    if (/(오해|진실|사실|착각)/.test(caption)) return "반박/진실형";
    if (/(공감|힘들|막막|걱정)/.test(caption)) return "공감형";
    return "문제 해결형";
  });
  return topItems(formats, 6);
}

function topItems(items: string[], limit: number) {
  const counts = new Map<string, number>();
  items.filter(Boolean).forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
