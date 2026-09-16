import type { ReactNode } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { demoAcademyOverview } from "@/lib/mock-data";

export default function AcademyLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell role="ACADEMY" userName={demoAcademyOverview.name}>
      {children}
    </DashboardShell>
  );
}
