import { beforeEach, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  claims: null as Record<string, unknown> | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({
        data: session.claims ? { claims: session.claims } : null,
      }),
    },
  }),
}));
vi.mock("next/server", () => ({ connection: async () => {} }));
// The real redirect() also interrupts by throwing.
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
}));
// Outside a React server render there is no request to memoise per.
vi.mock("react", () => ({ cache: <T>(fn: T) => fn }));

import { getCurrentUser } from "./current-user";

beforeEach(() => {
  session.claims = null;
});

it("sem sessão redireciona para /login", async () => {
  await expect(getCurrentUser()).rejects.toThrow("REDIRECT:/login");
});

it("com sessão devolve nome e e-mail", async () => {
  session.claims = {
    email: "ana@email.com",
    user_metadata: { full_name: "Ana Souza" },
  };
  await expect(getCurrentUser()).resolves.toEqual({
    name: "Ana Souza",
    email: "ana@email.com",
  });
});
