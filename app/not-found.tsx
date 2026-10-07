import Link from "next/link";

export const metadata = { title: "Página não encontrada" };

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground">
        O endereço que você abriu não existe no Painel CRM.
      </p>
      <Link href="/" className="underline">
        Voltar ao início
      </Link>
    </main>
  );
}
