import { afterEach, beforeEach, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => [] as string[]);

const record = (name: string) => async (): Promise<{ error: null }> => {
  calls.push(name);
  return { error: null };
};

// What verifyOtp answers, and what creating the cookie client throws; null
// means success.
const verifyError = vi.hoisted(() => ({ current: null as object | null }));
const cookieClientThrows = vi.hoisted(() => ({ current: null as Error | null }));

// The client that reads and writes the session cookies.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    calls.push("cookie-client");
    if (cookieClientThrows.current) throw cookieClientThrows.current;
    return {
      auth: {
        verifyOtp: async () => {
          calls.push("verifyOtp");
          return { error: verifyError.current };
        },
        updateUser: record("updateUser"),
        signOut: record("signOut"),
        resetPasswordForEmail: record("cookie-client.resetPasswordForEmail"),
      },
    };
  },
}));
// What the stateless client's link request answers; null means success.
const recoverError = vi.hoisted(() => ({ current: null as object | null }));
vi.mock("@/lib/supabase/stateless", () => ({
  createStatelessClient: () => ({
    auth: {
      resetPasswordForEmail: async () => {
        calls.push("resetPasswordForEmail");
        return { error: recoverError.current };
      },
    },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// The real redirect() also interrupts by throwing.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

import { login, recoverPassword, resetPassword } from "./actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

beforeEach(() => {
  calls.length = 0;
  recoverError.current = null;
  verifyError.current = null;
  cookieClientThrows.current = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

it.each([
  ["curta", { password: "curta", confirmPassword: "curta" }, "password"],
  [
    "diferente da confirmação",
    { password: "senha-nova-1234", confirmPassword: "senha-outra-1234" },
    "confirmPassword",
  ],
])("senha %s não gasta o link", async (_name, passwords, field) => {
  const state = await resetPassword(
    {},
    form({ tokenHash: "hash-1", ...passwords }),
  );
  expect(state.fieldErrors).toHaveProperty(field);
  expect(calls).toEqual([]);
});

it("senha válida gasta o link, troca a senha e leva ao dashboard", async () => {
  await expect(
    resetPassword(
      {},
      form({
        tokenHash: "hash-1",
        password: "senha-nova-1234",
        confirmPassword: "senha-nova-1234",
      }),
    ),
  ).rejects.toThrow("REDIRECT:/dashboard");
  expect(calls).toEqual([
    "cookie-client",
    "verifyOtp",
    "updateUser",
    "signOut",
  ]);
});

it("o pedido do link não passa pelo cliente que grava cookies", async () => {
  const state = await recoverPassword({}, form({ email: " Ana@Email.com " }));
  expect(state).toEqual({
    info: "Se existir uma conta com este e-mail, enviamos um link para criar uma nova senha.",
  });
  expect(calls).toEqual(["resetPasswordForEmail"]);
});

it("e-mail inválido não chega ao Supabase", async () => {
  const state = await recoverPassword({}, form({ email: "ana@" }));
  expect(state.fieldErrors).toHaveProperty("email");
  expect(state.values).toEqual({ email: "ana@" });
  expect(calls).toEqual([]);
});

it("Supabase sem resposta no pedido do link mantém o e-mail digitado", async () => {
  recoverError.current = { status: 0, name: "AuthRetryableFetchError" };
  const state = await recoverPassword({}, form({ email: "ana@email.com" }));
  expect(state).toEqual({
    message: "Não foi possível conectar. Tente novamente.",
    values: { email: "ana@email.com" },
  });
});

const validReset = {
  tokenHash: "hash-1",
  password: "senha-nova-1234",
  confirmPassword: "senha-nova-1234",
};

it("link vencido devolve a mensagem com o atalho para pedir outro", async () => {
  verifyError.current = { status: 403, code: "otp_expired" };
  const state = await resetPassword({}, form(validReset));
  expect(state).toEqual({
    message: "Este link expirou ou já foi usado",
    needsNewLink: true,
  });
});

it("limite de tentativas ao conferir o link não oferece outro link", async () => {
  verifyError.current = { status: 429, code: "over_request_rate_limit" };
  const state = await resetPassword({}, form(validReset));
  expect(state).toEqual({ message: "Muitas tentativas. Aguarde alguns minutos." });
});

it("falha lançada na troca registra só o código, o status e o tipo", async () => {
  cookieClientThrows.current = Object.assign(new Error("ana@email.com"), {
    code: "boom",
    status: 500,
  });
  const state = await resetPassword({}, form(validReset));
  expect(state).toEqual({ message: "Não foi possível conectar. Tente novamente." });
  expect(console.error).toHaveBeenCalledExactlyOnceWith(expect.any(String), {
    code: "boom",
    status: 500,
    name: "Error",
  });
});

it("falha lançada no login também não leva o e-mail ao log", async () => {
  cookieClientThrows.current = Object.assign(new Error("ana@email.com"), {
    status: 500,
  });
  const state = await login(
    {},
    form({ email: "ana@email.com", password: "senha-1234" }),
  );
  expect(state.message).toBe("Não foi possível conectar. Tente novamente.");
  expect(console.error).toHaveBeenCalledExactlyOnceWith(expect.any(String), {
    code: undefined,
    status: 500,
    name: "Error",
  });
});

it("link vencido lançado como erro também oferece outro link", async () => {
  cookieClientThrows.current = Object.assign(new Error("expired"), {
    status: 403,
    code: "otp_expired",
  });
  const state = await resetPassword({}, form(validReset));
  expect(state).toEqual({
    message: "Este link expirou ou já foi usado",
    needsNewLink: true,
  });
});
