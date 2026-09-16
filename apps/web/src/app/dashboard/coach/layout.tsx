import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { demoCoachOverview } from "@/lib/mock-data";

export default function CoachLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="COACH" userName={demoCoachOverview.name}>
      {children}
    </DashboardShell>
  );
}
