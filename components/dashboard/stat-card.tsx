import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Stat } from "@/lib/dashboard/sample-data";

export function StatCard({ stat }: { stat: Stat }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-muted-foreground">{stat.label}</p>
      </CardHeader>
      <CardContent className="grid gap-1">
        <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
        <p className="text-xs text-muted-foreground">{stat.change}</p>
      </CardContent>
    </Card>
  );
}
