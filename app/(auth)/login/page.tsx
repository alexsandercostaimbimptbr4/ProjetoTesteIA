import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-center text-sm text-muted-foreground">
        Entre com seu e-mail e senha
      </h1>
      <LoginForm />
    </div>
  );
}
