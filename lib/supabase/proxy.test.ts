import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";

type SetAll = (
  cookies: { name: string; value: string; options: object }[],
  headers: Record<string, string>,
) => void;

const fake = vi.hoisted(() => ({
  claims: null as object | null,
}));

// Stands in for Supabase refreshing a session: it writes cookies in two
// calls, and only the first call carries the cache headers.
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { setAll: SetAll } },
  ) => ({
    auth: {
      getClaims: async () => {
        options.cookies.setAll([{ name: "sb-a", value: "1", options: {} }], {
          "Cache-Control": "private, no-store",
        });
        options.cookies.setAll([{ name: "sb-b", value: "2", options: {} }], {});
        return { data: fake.claims ? { claims: fake.claims } : null };
      },
    },
  }),
}));

import { updateSession } from "./proxy";

beforeEach(() => {
  fake.claims = null;
});

it("mantém cookies e cabeçalhos de cache quando deixa a requisição passar", async () => {
  fake.claims = { sub: "user-1" };
  const response = await updateSession(
    new NextRequest("http://localhost/dashboard"),
  );

  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.cookies.get("sb-a")?.value).toBe("1");
  expect(response.cookies.get("sb-b")?.value).toBe("2");
});

it("leva cookies e cabeçalhos de cache junto no redirecionamento", async () => {
  const response = await updateSession(
    new NextRequest("http://localhost/dashboard/contatos?x=1"),
  );

  expect(response.headers.get("location")).toBe("http://localhost/login");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.cookies.get("sb-a")?.value).toBe("1");
  expect(response.cookies.get("sb-b")?.value).toBe("2");
});
