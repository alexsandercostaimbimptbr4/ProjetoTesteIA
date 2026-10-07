"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "@/app/(auth)/actions";
import { AUTH_MESSAGES } from "@/lib/auth/errors";
import { signupSchema } from "@/lib/auth/schemas";
import { FormField } from "./form-field";
import { SubmitButton } from "./submit-button";
import { useClientValidation } from "./use-client-validation";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, {});
  const { clientErrors, handleSubmit } = useClientValidation(signupSchema);
  const errors = clientErrors ?? state.fieldErrors ?? {};
  // The last server answer is stale once a new attempt starts.
  const showServerState = !clientErrors && !pending;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-4"
    >
      {showServerState && state.message ? (
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
      {showServerState && state.info ? (
        <p role="status" className="text-sm text-muted-foreground">
          {state.info}
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
