import { Suspense } from "react";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboardData } from "@/lib/dashboard/sample-data";

export const metadata = { title: "Visão geral" };

export default function DashboardPage() {
  const { stats, activities } = getDashboardData();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Suspense fallback={<h1 className="text-2xl font-semibold">Olá</h1>}>
          <Greeting />
        </Suspense>
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

async function Greeting() {
  const user = await getCurrentUser();
  return <h1 className="text-2xl font-semibold">Olá, {user.name}</h1>;
}
