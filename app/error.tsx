"use client"; // Error boundaries must be Client Components

import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Algo deu errado</h1>
      <p className="text-muted-foreground">
        Não foi possível concluir a operação. Tente novamente.
      </p>
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </main>
  );
}
