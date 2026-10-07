"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { signup } from "@/app/(auth)/actions";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { fieldErrorsFrom, type FieldErrors } from "@/lib/auth/form-state";
import { signupSchema } from "@/lib/auth/schemas";
import { FormField } from "./form-field";
import { SubmitButton } from "./submit-button";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, {});
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const errors = clientErrors ?? state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = signupSchema.safeParse(data);
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
          {state.message === AUTH_MESSAGES.emailTaken ? (
            <>
              .{" "}
              <Link href="/login" className="underline">
                Entrar
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
      <FormField
        key={`name-${state.values?.name ?? ""}`}
        name="name"
        label="Nome"
        autoComplete="name"
        defaultValue={state.values?.name}
        error={errors.name}
      />
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
        autoComplete="new-password"
        error={errors.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      <SubmitButton pending={pending}>Criar conta</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-foreground underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
