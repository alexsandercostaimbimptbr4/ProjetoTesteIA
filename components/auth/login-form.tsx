"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { login } from "@/app/(auth)/actions";
import { fieldErrorsFrom, type FieldErrors } from "@/lib/auth/form-state";
import { loginSchema } from "@/lib/auth/schemas";
import { FormField } from "./form-field";
import { SubmitButton } from "./submit-button";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const errors = clientErrors ?? state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = loginSchema.safeParse(data);
    if (parsed.success) {
      setClientErrors(null);
      return;
    }
    event.preventDefault();
    setClientErrors(fieldErrorsFrom(parsed.error));
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-4"
    >
      {state.message && !clientErrors ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <FormField
        key={`email-${state.values?.email ?? ""}`}
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <FormField
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password}
      />
      <SubmitButton pending={pending}>Entrar</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-foreground underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
