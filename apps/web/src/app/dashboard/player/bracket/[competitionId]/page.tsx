import { getCurrentUserOrRedirect } from "@/lib/server/current-user";
import { getDraw } from "@/lib/server/domain";
import { BracketViewer } from "@/components/domain/BracketViewer";

export default async function PlayerBracketPage({ params }: { params: { competitionId: string } }) {
  await getCurrentUserOrRedirect(`/dashboard/player/bracket/${params.competitionId}`);
  const draw = await getDraw(params.competitionId);
  return <BracketViewer draw={draw} />;
}
