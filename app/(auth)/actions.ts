"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AUTH_MESSAGES, translateAuthError } from "@/lib/auth/errors";
import { fieldErrorsFrom, type AuthFormState } from "@/lib/auth/form-state";
import { loginSchema, signupSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

// Translates a Supabase failure for the screen. When all the user gets is the
// generic message, the cause goes to the server log. Only the error object
// is logged; the form data is never passed to the log.
function failureMessage(error: unknown, context: "login" | "signup") {
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

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
