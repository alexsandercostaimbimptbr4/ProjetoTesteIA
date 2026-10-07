import { z } from "zod";

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
    name: z.string().trim().min(1, "Informe seu nome"),
    email,
    password: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .max(72, "A senha deve ter no máximo 72 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
