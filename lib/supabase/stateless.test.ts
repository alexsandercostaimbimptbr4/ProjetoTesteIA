import { afterEach, expect, it, vi } from "vitest";
import { createStatelessClient } from "./stateless";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("pede o e-mail de recuperação sem guardar nada entre requisições", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projeto.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_teste");
  const requests: { url: string; body: unknown }[] = [];
  vi.stubGlobal("fetch", async (url: string | URL, init?: RequestInit) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const { error } =
    await createStatelessClient().auth.resetPasswordForEmail("ana@email.com");

  expect(error).toBeNull();
  expect(requests).toHaveLength(1);
  expect(requests[0].url).toContain("/auth/v1/recover");
  // No PKCE challenge: nothing has to be remembered for the link to work,
  // which is what lets this client live without cookies.
  expect(requests[0].body).toMatchObject({
    email: "ana@email.com",
    code_challenge: null,
  });
});
