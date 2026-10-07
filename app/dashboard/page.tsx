import { Suspense } from "react";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboardData } from "@/lib/dashboard/sample-data";

export const metadata = { title: "Visão geral" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Carregando…</p>}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const [user, { stats, activities }] = await Promise.all([
    getCurrentUser(),
    getDashboardData(),
  ]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>
        <Badge variant="secondary">Dados de demonstração</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} stat={stat} />
        ))}
      </div>
      <RecentActivity activities={activities} />
    </div>
  );
}
