"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/(auth)/actions";
import { loginSchema } from "@/lib/auth/schemas";
import { FormField } from "./form-field";
import { SubmitButton } from "./submit-button";
import { useClientValidation } from "./use-client-validation";
import { useResetKeyOnHide } from "./use-reset-key-on-hide";

export function LoginForm() {
  const resetKey = useResetKeyOnHide();
  return <LoginFields key={resetKey} />;
}

function LoginFields() {
  const [state, formAction, pending] = useActionState(login, {});
  const { clientErrors, formRef, handleSubmit } =
    useClientValidation(loginSchema);
  const errors = clientErrors ?? state.fieldErrors ?? {};
  // The last server answer is stale once a new attempt starts.
  const showServerState = !clientErrors && !pending;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-4"
    >
      {showServerState && state.message ? (
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
