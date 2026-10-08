import { expect, it } from "vitest";
import { resolveRedirect } from "./routes";

it.each([
  ["/dashboard", false, "/login"],
  ["/dashboard/contatos", false, "/login"],
  ["/login", false, null],
  ["/cadastro", false, null],
  ["/", false, "/login"],
  ["/login", true, "/dashboard"],
  ["/cadastro", true, "/dashboard"],
  // The reset pages stay reachable with a session: the link may belong to
  // another account, and an expired one leads back to asking for a new one.
  ["/recuperar-senha", false, null],
  ["/recuperar-senha", true, null],
  ["/redefinir-senha", false, null],
  ["/redefinir-senha", true, null],
  ["/", true, "/dashboard"],
  ["/dashboard", true, null],
  ["/dashboard/contatos", true, null],
  ["/dashboardx", false, null],
])("%s autenticado=%s -> %s", (path, auth, expected) =>
  expect(resolveRedirect(path, auth)).toBe(expected));
