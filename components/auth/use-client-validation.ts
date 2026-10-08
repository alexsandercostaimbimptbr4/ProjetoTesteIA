import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import type { z } from "zod";
import { fieldErrorsFrom, type FieldErrors } from "@/lib/auth/form-state";

// Validates in the browser before the Server Action runs. The server runs the
// same schema again and remains the authority.
export function useClientValidation(schema: z.ZodType) {
  const formRef = useRef<HTMLFormElement>(null);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);

  // Next keeps a route mounted but hidden after the user leaves it, and React
  // runs layout-effect cleanups at that moment. Nothing typed or returned by
  // the server may wait in that hidden screen for whoever uses the browser
  // next, so the fields are emptied right away. form.reset() would not do: it
  // restores the e-mail the server sent back after a failed attempt. The form
  // itself is rebuilt once hidden (see useResetKeyOnHide), but not in the same
  // instant, which is why the fields are emptied here.
  //
  // In development, StrictMode runs this cleanup once right after mount, so
  // anything typed before the page finishes loading is cleared. Production
  // does not do that.
  //
  // This has to be an effect with no dependencies, not a callback ref: a ref
  // callback that changes between renders is cleaned up on every re-render,
  // which would erase the form each time a validation error is shown.
  useLayoutEffect(() => {
    const form = formRef.current;
    return () => {
      form
        ?.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])')
        .forEach((input) => {
          input.value = "";
        });
      // Redundant when the form is keyed with useResetKeyOnHide, as every
      // auth form is; kept so this hook is correct on its own.
      setClientErrors(null);
    };
  }, []);

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

  return { clientErrors, formRef, handleSubmit };
}
