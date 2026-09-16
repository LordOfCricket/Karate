import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { demoCoachOverview } from "@/lib/mock-data";

export default function CoachOverviewPage() {
  const data = demoCoachOverview;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Students" value={data.stats.studentCount} />
        <StatTile label="Student wins" value={data.stats.studentWins} />
        <StatTile label="Student losses" value={data.stats.studentLosses} />
        <StatTile label="Medals" value={data.stats.medalsWon} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students competing now</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.studentsCompetingNow.length === 0 ? (
            <EmptyState title="No students competing right now" />
          ) : (
            data.studentsCompetingNow.map((student) => (
              <div key={student.name} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-text-primary">{student.name}</p>
                  <p className="text-text-muted">{student.tournament}</p>
                </div>
                <Badge tone={student.status === "LIVE" ? "danger" : "neutral"}>{student.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
