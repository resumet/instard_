import { AccountReelAnalysis } from "@/components/account-reel-analysis";

export default async function AccountReelAnalysisPage({
  params
}: {
  params: Promise<{ reelId: string }>;
}) {
  const { reelId } = await params;
  return <AccountReelAnalysis reelId={reelId} />;
}
