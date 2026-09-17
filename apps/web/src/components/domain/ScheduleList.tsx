import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ScheduleEntryRow } from "@/lib/server/domain";

export function ScheduleList({
  title,
  entries,
  emptyDescription = "Nothing scheduled yet.",
}: {
  title: string;
  entries: ScheduleEntryRow[];
  emptyDescription?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {entries.length === 0 ? (
          <EmptyState title="No upcoming bouts" description={emptyDescription} />
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {e.roundName ?? `Round ${e.roundNumber}`} · {e.redPlayerName ?? "BYE"} vs{" "}
                  {e.bluePlayerName ?? "BYE"}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(e.scheduledAt).toLocaleString()} · {e.estimatedDurationMinutes} min
                  {e.tatami ? ` · ${e.tatami.label}` : ""}
                </p>
              </div>
              <Badge tone="info">{e.boutStatus}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
