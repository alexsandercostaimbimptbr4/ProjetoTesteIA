import { expect, it } from "vitest";
import {
  isServiceFailure,
  translateAuthError,
  type AuthContext,
} from "./errors";

const GENERIC = "Não foi possível conectar. Tente novamente.";
const LINK_EXPIRED = "Este link expirou ou já foi usado";

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
  [{ status: 500, code: "unexpected_failure" }, true],
  // The library reports a network failure with status 0.
  [{ status: 0, name: "AuthRetryableFetchError" }, true],
  [{ name: "AuthRetryableFetchError" }, true],
  [new TypeError("fetch failed"), true],
  [null, true],
])("isServiceFailure(%o) é %s", (error, expected) =>
  expect(isServiceFailure(error)).toBe(expected));
