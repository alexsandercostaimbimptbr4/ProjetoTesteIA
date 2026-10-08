import { beforeEach, expect, it, vi } from "vitest";

const calls = vi.hoisted(() => [] as string[]);

const record = (name: string) => async (): Promise<{ error: null }> => {
  calls.push(name);
  return { error: null };
};

// The client that reads and writes the session cookies.
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    calls.push("cookie-client");
    return {
      auth: {
        verifyOtp: record("verifyOtp"),
        updateUser: record("updateUser"),
        signOut: record("signOut"),
        resetPasswordForEmail: record("cookie-client.resetPasswordForEmail"),
      },
    };
  },
}));
vi.mock("@/lib/supabase/stateless", () => ({
  createStatelessClient: () => ({
    auth: { resetPasswordForEmail: record("resetPasswordForEmail") },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
// The real redirect() also interrupts by throwing.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));

import { recoverPassword, resetPassword } from "./actions";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
}

beforeEach(() => {
  calls.length = 0;
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
