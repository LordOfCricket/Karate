import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { demoAcademyOverview } from "@/lib/mock-data";

export default function AcademyOverviewPage() {
  const data = demoAcademyOverview;

  return (
    <div className="flex flex-col gap-6">
      {data.pendingMembershipRequests > 0 && (
        <Alert tone="info" title={`${data.pendingMembershipRequests} pending membership requests`}>
          <Button size="sm" variant="secondary" className="mt-2">
            Review requests
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Players" value={data.stats.playerCount} />
        <StatTile label="Coaches" value={data.stats.coachCount} />
        <StatTile label="Tournaments hosted" value={data.stats.tournamentsHosted} />
        <StatTile label="Tournaments entered" value={data.stats.tournamentsParticipated} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-secondary">
            Organization overview, live tournament activity, and academy-wide performance will surface here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
