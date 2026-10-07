import { Suspense } from "react";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getCurrentUser } from "@/lib/auth/current-user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The whole shell sits behind the session check: nothing of the dashboard
  // is shown until getCurrentUser() resolves (or redirects to /login).
  return (
    <Suspense
      fallback={<p className="p-6 text-muted-foreground">Carregando…</p>}
    >
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}

async function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-svh flex-1">
      <aside className="hidden border-r md:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title="Visão geral" user={user} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
