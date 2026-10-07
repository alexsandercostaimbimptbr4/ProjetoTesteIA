import { Suspense } from "react";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/current-user";

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1>Visão geral</h1>
      <Suspense fallback={<p>Carregando…</p>}>
        <CurrentUser />
      </Suspense>
    </main>
  );
}

async function CurrentUser() {
  const user = await getCurrentUser();

  return (
    <>
      <p>{user.name}</p>
      <p>{user.email}</p>
      <form action={logout}>
        <Button type="submit">Sair</Button>
      </form>
    </>
  );
}
