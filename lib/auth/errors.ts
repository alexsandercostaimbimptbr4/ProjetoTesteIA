export const AUTH_MESSAGES = {
  invalidCredentials: "E-mail ou senha incorretos",
  emailTaken: "Não foi possível criar a conta com este e-mail",
  rateLimited: "Muitas tentativas. Aguarde alguns minutos.",
  weakPassword: "Escolha uma senha mais forte",
  invalidEmail: "Informe um e-mail válido",
  invalidData: "Verifique os dados informados",
  generic: "Não foi possível conectar. Tente novamente.",
  // The same answer whether or not the account exists.
  recoverySent:
    "Se existir uma conta com este e-mail, enviamos um link para criar uma nova senha.",
  linkExpired: "Este link expirou ou já foi usado",
  resetFailed: "Não foi possível trocar a senha",
  resetWeakPassword: "A senha foi recusada por ser fraca",
} as const;

export type AuthContext = "login" | "signup" | "reset";

const BY_CODE: Record<string, string> = {
  invalid_credentials: AUTH_MESSAGES.invalidCredentials,
  user_already_exists: AUTH_MESSAGES.emailTaken,
  email_exists: AUTH_MESSAGES.emailTaken,
  over_request_rate_limit: AUTH_MESSAGES.rateLimited,
  over_email_send_rate_limit: AUTH_MESSAGES.rateLimited,
  // Retrying never fixes these, so they must not read as a connection error.
  weak_password: AUTH_MESSAGES.weakPassword,
  email_address_invalid: AUTH_MESSAGES.invalidEmail,
  validation_failed: AUTH_MESSAGES.invalidData,
  otp_expired: AUTH_MESSAGES.linkExpired,
};

const BY_CODE_ON_RESET: Record<string, string> = {
  // When a reset link is checked, the only data sent is the link itself: a
  // malformed one is a dead link to the user, not bad form data.
  validation_failed: AUTH_MESSAGES.linkExpired,
  // By then the link is spent, so "choose another password" is not enough.
  weak_password: AUTH_MESSAGES.resetWeakPassword,
};

// `context` identifies the form for callers; only "reset" changes messages.
export function translateAuthError(
  error: unknown,
  context: AuthContext,
): string {
  if (typeof error !== "object" || error === null) return AUTH_MESSAGES.generic;

  const { code, status } = error as { code?: unknown; status?: unknown };
  if (typeof code === "string") {
    if (context === "reset" && Object.hasOwn(BY_CODE_ON_RESET, code)) {
      return BY_CODE_ON_RESET[code];
    }
    if (Object.hasOwn(BY_CODE, code)) return BY_CODE[code];
  }
  if (status === 429) return AUTH_MESSAGES.rateLimited;
  return AUTH_MESSAGES.generic;
}

// Supabase quotes the address in some error messages, and what a person typed
// must not reach the log: only the code, the status and the kind of error are
// recorded, never the message.
export function logFailure(what: string, error: unknown) {
  const { code, status, name } = (error ?? {}) as Record<string, unknown>;
  console.error(what, { code, status, name });
}

// True when no answer from Supabase Auth came back, as opposed to a refusal or
// a failure of its own. The library throws, or reports status 0 when the
// request failed or the body could not be read, and no status at all when
// what answered was not Supabase Auth (a proxy, a wrong address).
export function isUnreachable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return true;
  const { status } = error as { status?: unknown };
  return typeof status !== "number" || status === 0;
}
