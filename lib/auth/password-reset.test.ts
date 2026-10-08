import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AUTH_MESSAGES, NEEDS_NEW_LINK } from "./errors";
import {
  redeemResetLink,
  requestPasswordReset,
  type RecoverAuth,
  type ResetAuth,
} from "./password-reset";

type Result = { error: object | null };

// Records the calls in order and answers each one as the test dictates.
function fakeAuth(answers: {
  resetPasswordForEmail?: Result | Error;
  verifyOtp?: Result | Error;
  updateUser?: Result | Error;
  signOut?: Result | Error;
}) {
  const calls: [string, ...unknown[]][] = [];
  const answer = (name: keyof typeof answers, ...args: unknown[]) => {
    calls.push([name, ...args]);
    const result = answers[name] ?? { error: null };
    if (result instanceof Error) throw result;
    return Promise.resolve(result);
  };
  const auth = {
    resetPasswordForEmail: (email: string) =>
      answer("resetPasswordForEmail", email),
    verifyOtp: (params: object) => answer("verifyOtp", params),
    updateUser: (attributes: object) => answer("updateUser", attributes),
    signOut: (options: object) => answer("signOut", options),
  } as unknown as RecoverAuth & ResetAuth;
  return { auth, calls };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

it("pede o e-mail de recuperação ao Supabase", async () => {
  const { auth, calls } = fakeAuth({});
  await expect(requestPasswordReset(auth, "ana@email.com")).resolves.toBe(
    "sent",
  );
  expect(calls).toEqual([["resetPasswordForEmail", "ana@email.com"]]);
});

it.each([
  {
    status: 400,
    code: "email_address_invalid",
    message: `Email address "ana@email.com" is invalid`,
  },
  { status: 400, code: "email_address_not_authorized" },
  { status: 429, code: "over_email_send_rate_limit" },
])(
  "responde igual quando o Supabase recusa o envio (%o), e registra a causa",
  async (error) => {
    const { auth } = fakeAuth({ resetPasswordForEmail: { error } });
    await expect(requestPasswordReset(auth, "ana@email.com")).resolves.toBe(
      "sent",
    );
    // The log gets the code, never the message, which can quote the address.
    expect(console.error).toHaveBeenCalledExactlyOnceWith(expect.any(String), {
      code: error.code,
      status: error.status,
      name: undefined,
    });
  },
);

it.each([
  { error: { status: 500, code: "unexpected_failure" } },
  new TypeError("fetch failed"),
])("avisa quando o Supabase está fora do ar (%o)", async (answer) => {
  const { auth } = fakeAuth({ resetPasswordForEmail: answer });
  await expect(requestPasswordReset(auth, "ana@email.com")).resolves.toBe(
    "unavailable",
  );
  expect(console.error).toHaveBeenCalledOnce();
});

it("valida o link, troca a senha e encerra as outras sessões", async () => {
  const { auth, calls } = fakeAuth({});
  await expect(
    redeemResetLink(auth, "hash-1", "senha-nova-1"),
  ).resolves.toEqual({ ok: true });
  expect(calls).toEqual([
    ["verifyOtp", { token_hash: "hash-1", type: "recovery" }],
    ["updateUser", { password: "senha-nova-1" }],
    ["signOut", { scope: "others" }],
  ]);
});

it("link vencido não troca a senha", async () => {
  const { auth, calls } = fakeAuth({
    verifyOtp: { error: { status: 403, code: "otp_expired" } },
  });
  await expect(
    redeemResetLink(auth, "hash-1", "senha-nova-1"),
  ).resolves.toEqual({ ok: false, message: AUTH_MESSAGES.linkExpired });
  expect(calls.map(([name]) => name)).toEqual(["verifyOtp"]);
});

it.each([
  ["vazio", ""],
  ["longo demais", "a".repeat(257)],
])("link %s nem chega ao Supabase", async (_name, tokenHash) => {
  const { auth, calls } = fakeAuth({});
  await expect(
    redeemResetLink(auth, tokenHash, "senha-nova-1"),
  ).resolves.toEqual({ ok: false, message: AUTH_MESSAGES.linkExpired });
  expect(calls).toEqual([]);
});

it("limite de tentativas ao conferir o link não o dá por perdido", async () => {
  const { auth, calls } = fakeAuth({
    verifyOtp: { error: { status: 429, code: "over_request_rate_limit" } },
  });
  const result = await redeemResetLink(auth, "hash-1", "senha-nova-1");
  expect(result).toEqual({ ok: false, message: AUTH_MESSAGES.rateLimited });
  expect(NEEDS_NEW_LINK).not.toContain(AUTH_MESSAGES.rateLimited);
  expect(calls.map(([name]) => name)).toEqual(["verifyOtp"]);
});

it("falha inesperada ao conferir o link é registrada", async () => {
  const { auth } = fakeAuth({
    verifyOtp: { error: { status: 500, code: "unexpected_failure" } },
  });
  await expect(
    redeemResetLink(auth, "hash-1", "senha-nova-1"),
  ).resolves.toEqual({ ok: false, message: AUTH_MESSAGES.generic });
  expect(console.error).toHaveBeenCalledOnce();
});

it("senha igual à atual conta como troca feita", async () => {
  const { auth } = fakeAuth({
    updateUser: { error: { status: 422, code: "same_password" } },
  });
  await expect(
    redeemResetLink(auth, "hash-1", "senha-nova-1"),
  ).resolves.toEqual({ ok: true });
});

it.each([
  [{ status: 422, code: "weak_password" }, AUTH_MESSAGES.resetWeakPassword],
  [{ status: 500, code: "unexpected_failure" }, AUTH_MESSAGES.resetFailed],
])(
  "se a troca falha (%o), sai da sessão aberta pelo link e pede outro",
  async (error, message) => {
    const { auth, calls } = fakeAuth({ updateUser: { error } });
    await expect(
      redeemResetLink(auth, "hash-1", "senha-nova-1"),
    ).resolves.toEqual({ ok: false, message });
    expect(calls.at(-1)).toEqual(["signOut", { scope: "local" }]);
  },
);

it("se a troca lança um erro, também sai da sessão aberta pelo link", async () => {
  const { auth, calls } = fakeAuth({
    updateUser: new TypeError("fetch failed"),
  });
  await expect(
    redeemResetLink(auth, "hash-1", "senha-nova-1"),
  ).resolves.toEqual({ ok: false, message: AUTH_MESSAGES.resetFailed });
  expect(calls.at(-1)).toEqual(["signOut", { scope: "local" }]);
});

it("se nem sair da sessão funciona, ainda responde que a troca falhou", async () => {
  const { auth } = fakeAuth({
    updateUser: { error: { status: 500, code: "unexpected_failure" } },
    signOut: new TypeError("fetch failed"),
  });
  await expect(
    redeemResetLink(auth, "hash-1", "senha-nova-1"),
  ).resolves.toEqual({ ok: false, message: AUTH_MESSAGES.resetFailed });
  // One entry for the password, one for the sign-out.
  expect(console.error).toHaveBeenCalledTimes(2);
});

it.each([
  { error: { status: 500, code: "unexpected_failure" } },
  new TypeError("fetch failed"),
])("falha ao encerrar as outras sessões (%o) não desfaz a troca", async (signOut) => {
  const { auth } = fakeAuth({ signOut });
  await expect(
    redeemResetLink(auth, "hash-1", "senha-nova-1"),
  ).resolves.toEqual({ ok: true });
  expect(console.error).toHaveBeenCalledOnce();
});
