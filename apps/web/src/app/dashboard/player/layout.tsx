import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { demoPlayerOverview } from "@/lib/mock-data";

export default function PlayerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="PLAYER" userName={demoPlayerOverview.name}>
      {children}
    </DashboardShell>
  );
}
