import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { demoScorerOverview } from "@/lib/mock-data";

export default function ScorerOverviewPage() {
  const data = demoScorerOverview;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Current assignment</CardTitle>
          <Badge tone={data.connectionState === "CONNECTED" ? "success" : "danger"}>
            {data.connectionState}
          </Badge>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium text-text-primary">{data.assignment.tournament}</p>
          <p className="text-text-secondary">
            {data.assignment.tatami} · Function: {data.assignment.function}
          </p>
        </CardContent>
      </Card>

      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle>Current bout</CardTitle>
          <Badge tone="danger">{data.currentBout.status}</Badge>
        </CardHeader>
        <CardContent className="flex items-center justify-between text-sm font-medium text-text-primary">
          <span>{data.currentBout.redPlayer}</span>
          <span className="text-text-muted">vs</span>
          <span>{data.currentBout.bluePlayer}</span>
        </CardContent>
      </Card>

      <p className="text-xs text-text-muted">
        The full scoring interface is a Phase 2+ deliverable — this overview only surfaces assignment and
        connection state, per the low-navigation-depth requirement for officiating workflows.
      </p>
    </div>
  );
}
