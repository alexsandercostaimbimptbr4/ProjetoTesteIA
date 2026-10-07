import type { z } from "zod";

export type AuthField = "name" | "email" | "password" | "confirmPassword";

export type FieldErrors = Partial<Record<AuthField, string>>;

export type AuthFormState = {
  message?: string;
  fieldErrors?: FieldErrors;
  values?: { name?: string; email?: string };
};

// Keeps the first message of each field, which is what the forms display.
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as AuthField;
    errors[field] ??= issue.message;
  }
  return errors;
}
