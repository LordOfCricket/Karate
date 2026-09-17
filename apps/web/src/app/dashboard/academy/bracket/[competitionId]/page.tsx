import { getCurrentUserOrRedirect } from "@/lib/server/current-user";
import { getDraw } from "@/lib/server/domain";
import { BracketViewer } from "@/components/domain/BracketViewer";
import { DrawManagementPanel } from "@/components/domain/DrawManagementPanel";

export default async function AcademyBracketPage({ params }: { params: { competitionId: string } }) {
  await getCurrentUserOrRedirect(`/dashboard/academy/bracket/${params.competitionId}`);
  const draw = await getDraw(params.competitionId);
  return (
    <div className="flex flex-col gap-6">
      <DrawManagementPanel competitionId={params.competitionId} draw={draw} />
      <BracketViewer draw={draw} />
    </div>
  );
}
