import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { demoPlayerOverview } from "@/lib/mock-data";
import { getCurrentUserOrRedirect } from "@/lib/server/current-user";

export default async function PlayerOverviewPage() {
  const user = await getCurrentUserOrRedirect("/dashboard/player");
  const data = demoPlayerOverview;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Signed in as</CardTitle>
          <Badge tone="success">Live account data</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p className="font-medium text-text-primary">{user.fullName}</p>
          <p className="text-text-secondary">{user.email}</p>
        </CardContent>
      </Card>

      <Card className="border-accent/30">
        <CardHeader>
          <CardTitle>Upcoming bout</CardTitle>
          <Badge tone="neutral">Demo data</Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <p className="font-medium text-text-primary">{data.upcomingBout.tournament}</p>
          <p className="text-text-secondary">
            {data.upcomingBout.round} · {data.upcomingBout.tatami} · {data.upcomingBout.scheduledAt}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Bouts" value={data.stats.bouts} />
        <StatTile label="Wins" value={data.stats.wins} />
        <StatTile label="Losses" value={data.stats.losses} />
        <StatTile label="Ranking" value={`#${data.stats.ranking}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current belt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary">{data.currentBelt}</p>
            <p className="mt-1 text-xs text-text-muted">{data.academy}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most recent result</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-text-primary">vs {data.recentResult.opponent}</p>
            <Badge tone={data.recentResult.outcome === "WIN" ? "success" : "danger"}>
              {data.recentResult.outcome} · {data.recentResult.method}
            </Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
