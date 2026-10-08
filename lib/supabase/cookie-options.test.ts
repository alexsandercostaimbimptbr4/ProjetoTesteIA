import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

// The options are computed when the module loads, so each case imports it
// again under its own NODE_ENV.
it.each([
  ["production", true],
  ["development", false],
  ["test", false],
])("com NODE_ENV=%s, secure é %s", async (nodeEnv, secure) => {
  vi.stubEnv("NODE_ENV", nodeEnv);
  vi.resetModules();
  const { SESSION_COOKIE_OPTIONS } = await import("./cookie-options");
  expect(SESSION_COOKIE_OPTIONS).toEqual({ httpOnly: true, secure });
});
