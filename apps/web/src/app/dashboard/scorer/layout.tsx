import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { demoScorerOverview } from "@/lib/mock-data";

export default function ScorerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="SCORER" userName={demoScorerOverview.name}>
      {children}
    </DashboardShell>
  );
}
