import { expect, it } from "vitest";
import { translateAuthError } from "./errors";

const GENERIC = "Não foi possível conectar. Tente novamente.";

it.each([
  [{ code: "invalid_credentials" }, "login", "E-mail ou senha incorretos"],
  [
    { code: "user_already_exists" },
    "signup",
    "Não foi possível criar a conta com este e-mail",
  ],
  [
    { code: "email_exists" },
    "signup",
    "Não foi possível criar a conta com este e-mail",
  ],
  [
    { code: "over_request_rate_limit" },
    "login",
    "Muitas tentativas. Aguarde alguns minutos.",
  ],
  [{ status: 429 }, "signup", "Muitas tentativas. Aguarde alguns minutos."],
  [{ code: "unexpected_failure", message: "Database error" }, "login", GENERIC],
  [new TypeError("fetch failed"), "login", GENERIC],
  [null, "signup", GENERIC],
])("traduz %o em %s", (error, context, expected) =>
  expect(translateAuthError(error, context as "login" | "signup")).toBe(
    expected,
  ));
