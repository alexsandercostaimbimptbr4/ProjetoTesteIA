import { RecoverForm } from "@/components/auth/recover-form";

export const metadata = { title: "Recuperar senha" };

export default function RecoverPasswordPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-center text-sm text-muted-foreground">
        Informe seu e-mail para receber um link e criar uma nova senha
      </h1>
      <RecoverForm />
    </div>
  );
}
