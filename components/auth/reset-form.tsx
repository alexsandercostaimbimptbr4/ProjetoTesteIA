"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/(auth)/actions";
import { NEEDS_NEW_LINK } from "@/lib/auth/errors";
import { resetSchema } from "@/lib/auth/schemas";
import { FormField } from "./form-field";
import { NewLinkNotice } from "./new-link-notice";
import { SubmitButton } from "./submit-button";
import { useClientValidation } from "./use-client-validation";
import { useResetKeyOnHide } from "./use-reset-key-on-hide";

export function ResetForm({ tokenHash }: { tokenHash: string }) {
  const resetKey = useResetKeyOnHide();
  return <ResetFields key={resetKey} tokenHash={tokenHash} />;
}

function ResetFields({ tokenHash }: { tokenHash: string }) {
  const [state, formAction, pending] = useActionState(resetPassword, {});
  const { clientErrors, formRef, handleSubmit } =
    useClientValidation(resetSchema);
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
        NEEDS_NEW_LINK.includes(state.message) ? (
          <NewLinkNotice
            message={state.message}
            className="text-sm text-destructive"
          />
        ) : (
          <p role="alert" className="text-sm text-destructive">
            {state.message}
          </p>
        )
      ) : null}
      {/* The link from the e-mail. It is only checked when the form is sent. */}
      <input type="hidden" name="tokenHash" value={tokenHash} />
      <FormField
        name="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword}
      />
      <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
    </form>
  );
}
