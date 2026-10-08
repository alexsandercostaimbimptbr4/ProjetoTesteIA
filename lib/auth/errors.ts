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

// Shown with a shortcut to ask for another link: after any of these the link
// in hand is of no use, either spent or never valid.
export const NEEDS_NEW_LINK: readonly string[] = [
  AUTH_MESSAGES.linkExpired,
  AUTH_MESSAGES.resetFailed,
  AUTH_MESSAGES.resetWeakPassword,
];

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

// True when Supabase could not be reached or broke, as opposed to having
// answered with a refusal (a 4xx). The library reports network failures as an
// error without a 4xx status, or throws.
export function isServiceFailure(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return true;
  const { status } = error as { status?: unknown };
  return !(typeof status === "number" && status >= 400 && status < 500);
}
