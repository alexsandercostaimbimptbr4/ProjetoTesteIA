import { afterEach, expect, it, vi } from "vitest";
import {
  isUnreachable,
  logFailure,
  translateAuthError,
  type AuthContext,
} from "./errors";

const GENERIC = "Não foi possível conectar. Tente novamente.";
const LINK_EXPIRED = "Este link expirou ou já foi usado";

afterEach(() => {
  vi.restoreAllMocks();
});

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
  [{ code: "weak_password" }, "signup", "Escolha uma senha mais forte"],
  [{ code: "email_address_invalid" }, "signup", "Informe um e-mail válido"],
  [{ code: "validation_failed" }, "login", "Verifique os dados informados"],
  [
    { code: "over_email_send_rate_limit" },
    "signup",
    "Muitas tentativas. Aguarde alguns minutos.",
  ],
  [{ status: 429 }, "signup", "Muitas tentativas. Aguarde alguns minutos."],
  [{ code: "unexpected_failure", message: "Database error" }, "login", GENERIC],
  [{ code: "constructor" }, "login", GENERIC],
  [new TypeError("fetch failed"), "login", GENERIC],
  [null, "signup", GENERIC],
  [{ code: "otp_expired" }, "reset", LINK_EXPIRED],
  // A malformed link is a dead link to the user, not bad form data.
  [{ code: "validation_failed" }, "reset", LINK_EXPIRED],
  [
    { code: "over_request_rate_limit" },
    "reset",
    "Muitas tentativas. Aguarde alguns minutos.",
  ],
  [{ code: "weak_password" }, "reset", "A senha foi recusada por ser fraca"],
  [new TypeError("fetch failed"), "reset", GENERIC],
])("traduz %o em %s", (error, context, expected) =>
  expect(translateAuthError(error, context as AuthContext)).toBe(expected));

it.each([
  [{ status: 400, code: "email_address_not_authorized" }, false],
  [{ status: 429, code: "over_email_send_rate_limit" }, false],
  // Supabase answered, even if with a failure of its own.
  [{ status: 500, code: "unexpected_failure" }, false],
  [{ status: 503, name: "AuthRetryableFetchError" }, false],
  // The library reports a network failure, or a body it could not read,
  // with status 0.
  [{ status: 0, name: "AuthRetryableFetchError" }, true],
  // Something other than Supabase Auth answered: no status at all.
  [{ name: "AuthUnknownError" }, true],
  [new TypeError("fetch failed"), true],
  [null, true],
])("isUnreachable(%o) é %s", (error, expected) =>
  expect(isUnreachable(error)).toBe(expected));

it("logFailure registra o código, o status e o tipo, nunca a mensagem", () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const error = Object.assign(new Error(`Email "ana@email.com" is invalid`), {
    code: "email_address_invalid",
    status: 400,
  });
  logFailure("Falha:", error);
  expect(log).toHaveBeenCalledExactlyOnceWith("Falha:", {
    code: "email_address_invalid",
    status: 400,
    name: "Error",
  });
});
