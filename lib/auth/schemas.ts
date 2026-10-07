import { z } from "zod";

// Supabase hashes passwords with bcrypt, which reads at most 72 bytes.
const MAX_PASSWORD_BYTES = 72;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido"));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha"),
});

export const signupSchema = z
  .object({
    // The name travels inside the session token and its cookies on every
    // request, so it needs a ceiling.
    name: z
      .string()
      .trim()
      .min(1, "Informe seu nome")
      .max(100, "O nome deve ter no máximo 100 caracteres"),
    email,
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .max(72, "A senha deve ter no máximo 72 caracteres")
      .refine(
        (value) =>
          new TextEncoder().encode(value).length <= MAX_PASSWORD_BYTES,
        "A senha é longa demais: letras acentuadas contam em dobro",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
