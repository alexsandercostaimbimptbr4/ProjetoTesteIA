import { useLayoutEffect, useState, type FormEvent } from "react";
import type { z } from "zod";
import { fieldErrorsFrom, type FieldErrors } from "@/lib/auth/form-state";

// Validates in the browser before the Server Action runs. The server runs the
// same schema again and remains the authority.
export function useClientValidation(schema: z.ZodType) {
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);

  // Next keeps a route mounted but hidden after the user leaves it, and React
  // runs effect cleanups at that moment. Typed credentials and their errors
  // must not wait there for whoever uses the browser next.
  useLayoutEffect(() => () => setClientErrors(null), []);

  function resetOnHide(form: HTMLFormElement | null) {
    return () => form?.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(form)));
    if (parsed.success) {
      setClientErrors(null);
      return;
    }

    event.preventDefault();
    const errors = fieldErrorsFrom(parsed.error);
    setClientErrors(errors);

    // Move focus to the first invalid field, in the order shown on screen.
    const firstInvalid = Array.from(form.elements).find(
      (element): element is HTMLInputElement =>
        element instanceof HTMLInputElement && element.name in errors,
    );
    firstInvalid?.focus();
  }

  return { clientErrors, handleSubmit, resetOnHide };
}
