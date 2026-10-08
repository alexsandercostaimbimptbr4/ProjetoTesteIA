import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  loginSchema,
  recoverSchema,
  resetSchema,
  signupSchema,
} from "./schemas";

const valid = {
  name: "Ana Souza",
  email: "ana@email.com",
  password: "senha1234",
  confirmPassword: "senha1234",
};

const firstError = (
  result: { success: boolean; error?: z.ZodError },
  field: string,
) => {
  const errors = result.error?.flatten().fieldErrors as
    | Record<string, string[] | undefined>
    | undefined;
  return errors?.[field]?.[0];
};

describe("signupSchema", () => {
  it("aceita dados válidos", () =>
    expect(signupSchema.safeParse(valid).success).toBe(true));

  it("normaliza o e-mail", () =>
    expect(
      signupSchema.parse({ ...valid, email: "  Ana@Email.com " }).email,
    ).toBe("ana@email.com"));

  it("remove espaços do nome", () =>
    expect(signupSchema.parse({ ...valid, name: "  Ana  " }).name).toBe("Ana"));

  it("exige nome", () =>
    expect(
      firstError(signupSchema.safeParse({ ...valid, name: "   " }), "name"),
    ).toBe("Informe seu nome"));

  it("limita o nome a 100 caracteres", () => {
    expect(
      firstError(
        signupSchema.safeParse({ ...valid, name: "a".repeat(101) }),
        "name",
      ),
    ).toBe("O nome deve ter no máximo 100 caracteres");
    expect(
      signupSchema.safeParse({ ...valid, name: "a".repeat(100) }).success,
    ).toBe(true);
  });

  it("rejeita e-mail inválido", () =>
    expect(
      firstError(signupSchema.safeParse({ ...valid, email: "ana@" }), "email"),
    ).toBe("Informe um e-mail válido"));

  it("exige 8 caracteres na senha", () =>
    expect(
      firstError(
        signupSchema.safeParse({
          ...valid,
          password: "1234567",
          confirmPassword: "1234567",
        }),
        "password",
      ),
    ).toBe("A senha deve ter no mínimo 8 caracteres"));

  it("limita a senha a 72 caracteres", () => {
    const long = "a".repeat(73);
    expect(
      firstError(
        signupSchema.safeParse({
          ...valid,
          password: long,
          confirmPassword: long,
        }),
        "password",
      ),
    ).toBe("A senha deve ter no máximo 72 caracteres");
  });

  it("limita a senha a 72 bytes, contando acentos", () => {
    const accented = "ã".repeat(40); // 40 characters, 80 bytes
    expect(
      firstError(
        signupSchema.safeParse({
          ...valid,
          password: accented,
          confirmPassword: accented,
        }),
        "password",
      ),
    ).toBe("A senha é longa demais: letras acentuadas contam em dobro");
  });

  it("aceita senha acentuada dentro do limite de bytes", () => {
    const accented = "ã".repeat(36); // 72 bytes
    expect(
      signupSchema.safeParse({
        ...valid,
        password: accented,
        confirmPassword: accented,
      }).success,
    ).toBe(true);
  });

  it("não altera espaços da senha", () =>
    expect(
      signupSchema.parse({
        ...valid,
        password: " senha123 ",
        confirmPassword: " senha123 ",
      }).password,
    ).toBe(" senha123 "));

  it("exige confirmação igual", () =>
    expect(
      firstError(
        signupSchema.safeParse({ ...valid, confirmPassword: "outra1234" }),
        "confirmPassword",
      ),
    ).toBe("As senhas não coincidem"));
});

describe("loginSchema", () => {
  it("normaliza o e-mail", () =>
    expect(
      loginSchema.parse({ email: " Ana@Email.com", password: "x" }).email,
    ).toBe("ana@email.com"));

  it("exige senha, sem regra de tamanho", () => {
    expect(
      loginSchema.safeParse({ email: "ana@email.com", password: "x" }).success,
    ).toBe(true);
    expect(
      firstError(
        loginSchema.safeParse({ email: "ana@email.com", password: "" }),
        "password",
      ),
    ).toBe("Informe sua senha");
  });
});

describe("recoverSchema", () => {
  it("normaliza o e-mail", () =>
    expect(recoverSchema.parse({ email: "  Ana@Email.com " }).email).toBe(
      "ana@email.com",
    ));

  it("rejeita e-mail inválido", () =>
    expect(
      firstError(recoverSchema.safeParse({ email: "ana@" }), "email"),
    ).toBe("Informe um e-mail válido"));
});

describe("resetSchema", () => {
  const reset = { password: "senha1234", confirmPassword: "senha1234" };

  it("aceita senha e confirmação iguais", () =>
    expect(resetSchema.safeParse(reset).success).toBe(true));

  it("aplica as regras de senha do cadastro", () => {
    expect(
      firstError(
        resetSchema.safeParse({ password: "curta", confirmPassword: "curta" }),
        "password",
      ),
    ).toBe("A senha deve ter no mínimo 8 caracteres");
    const long = "ã".repeat(40);
    expect(
      firstError(
        resetSchema.safeParse({ password: long, confirmPassword: long }),
        "password",
      ),
    ).toBe("A senha é longa demais: letras acentuadas contam em dobro");
  });

  it("exige confirmação igual", () =>
    expect(
      firstError(
        resetSchema.safeParse({ ...reset, confirmPassword: "outra-senha" }),
        "confirmPassword",
      ),
    ).toBe("As senhas não coincidem"));
});
