"use client";

import Link from "next/link";
import { useActionState } from "react";
import { recoverPassword } from "@/app/(auth)/actions";
import { recoverSchema } from "@/lib/auth/schemas";
import { FormField } from "./form-field";
import { SubmitButton } from "./submit-button";
import { useClientValidation } from "./use-client-validation";
import { useResetKeyOnHide } from "./use-reset-key-on-hide";

export function RecoverForm() {
  const resetKey = useResetKeyOnHide();
  return <RecoverFields key={resetKey} />;
}

function RecoverFields() {
  const [state, formAction, pending] = useActionState(recoverPassword, {});
  const { clientErrors, formRef, handleSubmit } =
    useClientValidation(recoverSchema);
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
      {/* Always in the page, so screen readers announce the text when it
          arrives; kept out of the layout while empty. */}
      <p
        role="status"
        className={
          showServerState && state.info
            ? "text-sm text-muted-foreground"
            : "sr-only"
        }
      >
        {showServerState ? state.info : null}
      </p>
      <FormField
        key={`email-${state.values?.email ?? ""}`}
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        error={errors.email}
      />
      <SubmitButton pending={pending}>Enviar link</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-foreground underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
