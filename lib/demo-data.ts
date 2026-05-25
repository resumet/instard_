import type { CompetitorAccount, CompetitorReel, GeneratedReel, Project } from "@/lib/types";

export const demoProject: Project = {
  id: "demo-project",
  name: "부동산 투자 릴스 기획",
  topic: "40대 직장인을 위한 현실적인 부동산 투자",
  target_audience: "퇴직 이후 노후 자산이 걱정되는 직장인",
  goal: "상담 신청",
  tone: "현실적이고 친근한 조언형"
};

export const demoAccount: CompetitorAccount = {
  id: "demo-account",
  project_id: demoProject.id,
  instagram_handle: "sample_reels_lab",
  profile_url: "https://instagram.com/sample_reels_lab",
  display_name: "Sample Reels Lab",
  bio: "릴스 구조 분석용 데모 계정",
  follower_count: 48200,
  following_count: 312,
  post_count: 284,
  avg_views: 58500,
  avg_likes: 1820,
  avg_comments: 96
};

export const demoReels: CompetitorReel[] = [
  {
    id: "demo-reel-1",
    competitor_account_id: demoAccount.id,
    reel_url: "https://instagram.com/reel/demo1",
    shortcode: "demo1",
    caption: "월급만 믿고 있으면 50대에 가장 먼저 막히는 것이 있습니다. #노후준비 #부동산투자",
    hashtags: ["노후준비", "부동산투자"],
    thumbnail_url: null,
    video_url: null,
    duration_seconds: 31,
    view_count: 183000,
    like_count: 6200,
    comment_count: 410,
    posted_at: new Date(Date.now() - 8 * 86_400_000).toISOString(),
    performance_score: 0.94,
    is_top_performer: true
  },
  {
    id: "demo-reel-2",
    competitor_account_id: demoAccount.id,
    reel_url: "https://instagram.com/reel/demo2",
    shortcode: "demo2",
    caption: "초보 투자자가 가장 많이 착각하는 임대 수익률 계산법",
    hashtags: ["투자공부", "수익률"],
    thumbnail_url: null,
    video_url: null,
    duration_seconds: 45,
    view_count: 91200,
    like_count: 2900,
    comment_count: 132,
    posted_at: new Date(Date.now() - 16 * 86_400_000).toISOString(),
    performance_score: 0.71,
    is_top_performer: true
  },
  {
    id: "demo-reel-3",
    competitor_account_id: demoAccount.id,
    reel_url: "https://instagram.com/reel/demo3",
    shortcode: "demo3",
    caption: "대출이 무서운 게 아니라 계획 없는 대출이 무서운 겁니다.",
    hashtags: ["자산관리", "대출"],
    thumbnail_url: null,
    video_url: null,
    duration_seconds: 28,
    view_count: 39200,
    like_count: 870,
    comment_count: 44,
    posted_at: new Date(Date.now() - 22 * 86_400_000).toISOString(),
    performance_score: 0.43,
    is_top_performer: false
  }
];

export const demoGeneratedReel: GeneratedReel = {
  title: "40대가 월급만 믿으면 위험한 이유",
  target_duration_seconds: 30,
  hook: "40대인데 아직도 월급만 믿고 계세요?",
  full_script:
    "40대인데 아직도 월급만 믿고 계세요? 노후 준비는 소득의 크기보다 자산 구조가 먼저입니다. 월급은 멈출 수 있지만 현금흐름은 설계할 수 있습니다. 지금 해야 할 일은 큰 투자가 아니라 내 지출, 대출, 투자 가능 금액을 한 장에 정리하는 겁니다. 막막하다면 오늘부터 숫자 하나만 확인해보세요. 내 월 고정비입니다.",
  scene_lines: [
    {
      time: "0~3초",
      visual: "정면 클로즈업",
      dialogue: "40대인데 아직도 월급만 믿고 계세요?",
      caption: "월급만 믿으면 위험합니다",
      edit_point: "빠른 줌인과 강한 첫 자막",
      b_roll: "급여명세서가 닫히는 화면",
      camera: "눈높이 고정샷"
    },
    {
      time: "3~12초",
      visual: "노트북/메모장 B-roll",
      dialogue: "노후 준비는 소득의 크기보다 자산 구조가 먼저입니다.",
      caption: "노후 = 자산 구조",
      edit_point: "키워드 자막 강조",
      b_roll: "자산표에 형광펜 표시",
      camera: "손 근접 탑샷"
    },
    {
      time: "12~30초",
      visual: "정면 설명 장면",
      dialogue: "오늘은 내 월 고정비부터 확인해보세요.",
      caption: "첫 단계: 월 고정비 확인",
      edit_point: "체크리스트 효과음",
      b_roll: "계산기, 통장 앱 화면",
      camera: "상반신 미디엄샷"
    }
  ],
  captions: ["월급만 믿으면 위험합니다", "노후 = 자산 구조", "첫 단계: 월 고정비 확인"],
  cta: "저장해두고 오늘 저녁에 내 고정비부터 적어보세요.",
  alternative_hooks: [
    "퇴직 후가 걱정된다면 이 숫자부터 보세요.",
    "40대 투자 준비, 거창하게 시작하지 마세요.",
    "월급이 끊겨도 버티는 사람들의 공통점입니다."
  ],
  alternative_titles: [
    "월급만 믿으면 위험한 이유",
    "40대 노후 준비 첫 단계",
    "퇴직 전 반드시 봐야 할 숫자",
    "부동산 투자 전 체크할 것",
    "현금흐름 설계의 시작"
  ],
  thumbnail_text: "40대, 월급만 믿지 마세요",
  video_style: {
    concept: "현실 조언형 미니 강의",
    location: "책상 앞 또는 조용한 사무실",
    subtitle_style: "굵은 흰색 자막과 핵심 단어 빨간 강조",
    music_mood: "낮은 긴장감의 미니멀 비트",
    editing_tempo: "초반 빠르게, 중반은 설명이 들리도록 안정적으로"
  },
  disclaimer: "경쟁사 원본 문장을 복제하지 않고 성과 구조만 참고해 재작성한 생성물입니다."
};
