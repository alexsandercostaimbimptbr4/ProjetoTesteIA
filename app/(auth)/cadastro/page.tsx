import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-center text-sm text-muted-foreground">Criar conta</h1>
      <SignupForm />
    </div>
  );
}
