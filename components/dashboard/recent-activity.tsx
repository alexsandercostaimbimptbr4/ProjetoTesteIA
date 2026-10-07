import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Activity } from "@/lib/dashboard/sample-data";

export function RecentActivity({ activities }: { activities: Activity[] }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-medium">Atividades recentes</h2>
      </CardHeader>
      <CardContent>
        <ul className="divide-y text-sm">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3"
            >
              <span>{activity.description}</span>
              <span className="text-muted-foreground">{activity.when}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
