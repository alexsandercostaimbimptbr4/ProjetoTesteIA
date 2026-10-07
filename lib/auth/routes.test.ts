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
  ["/", true, "/dashboard"],
  ["/dashboard", true, null],
  ["/dashboard/contatos", true, null],
  ["/dashboardx", false, null],
])("%s autenticado=%s -> %s", (path, auth, expected) =>
  expect(resolveRedirect(path, auth)).toBe(expected));
