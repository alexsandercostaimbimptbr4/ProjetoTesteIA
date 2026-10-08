"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AUTH_MESSAGES,
  translateAuthError,
  type AuthContext,
} from "@/lib/auth/errors";
import { fieldErrorsFrom, type AuthFormState } from "@/lib/auth/form-state";
import {
  redeemResetLink,
  requestPasswordReset,
  type RedeemResult,
} from "@/lib/auth/password-reset";
import {
  loginSchema,
  recoverSchema,
  resetSchema,
  signupSchema,
} from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";
import { createStatelessClient } from "@/lib/supabase/stateless";

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

// Translates a Supabase failure for the screen. When all the user gets is the
// generic message, the cause goes to the server log. Only the error object
// is logged; the form data is never passed to the log.
function failureMessage(error: unknown, context: AuthContext) {
  const message = translateAuthError(error, context);
  if (message === AUTH_MESSAGES.generic) {
    console.error(`Falha inesperada (${context}):`, error);
  }
  return message;
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    email: text(formData, "email"),
    password: text(formData, "password"),
  };
  const values = { email: raw.email };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { message: failureMessage(error, "login"), values };
  } catch (error) {
    return { message: failureMessage(error, "login"), values };
  }

  // redirect() works by throwing, so it must stay outside the try/catch.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  };
  const values = { name: raw.name, email: raw.email };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { full_name: parsed.data.name } },
    });
    if (error) return { message: failureMessage(error, "signup"), values };
    if (!data.session) {
      // Only happens if "Confirm email" is enabled in the Supabase project.
      return {
        info: "Conta criada. Confirme seu e-mail para entrar.",
        values,
      };
    }
  } catch (error) {
    return { message: failureMessage(error, "signup"), values };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function recoverPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const raw = { email: text(formData, "email") };
  const values = { email: raw.email };

  const parsed = recoverSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error), values };
  }

  // No cookies are read or written here, so the response is the same
  // whether or not the account exists.
  const outcome = await requestPasswordReset(
    createStatelessClient().auth,
    parsed.data.email,
  );
  if (outcome === "unavailable") {
    return { message: AUTH_MESSAGES.generic, values };
  }
  // The typed address is not sent back: the form empties itself.
  return { info: AUTH_MESSAGES.recoverySent };
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  // Validated before the link is touched: a link works once, and a typo in
  // the confirmation must not cost it.
  const parsed = resetSchema.safeParse({
    password: text(formData, "password"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  let result: RedeemResult;
  try {
    const supabase = await createClient();
    result = await redeemResetLink(
      supabase.auth,
      text(formData, "tokenHash"),
      parsed.data.password,
    );
  } catch (error) {
    return { message: failureMessage(error, "reset") };
  }
  if (!result.ok) return { message: result.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
