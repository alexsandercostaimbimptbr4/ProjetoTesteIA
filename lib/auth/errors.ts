export const AUTH_MESSAGES = {
  invalidCredentials: "E-mail ou senha incorretos",
  emailTaken: "Não foi possível criar a conta com este e-mail",
  rateLimited: "Muitas tentativas. Aguarde alguns minutos.",
  weakPassword: "Escolha uma senha mais forte",
  invalidEmail: "Informe um e-mail válido",
  invalidData: "Verifique os dados informados",
  generic: "Não foi possível conectar. Tente novamente.",
} as const;

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
};

// `context` identifies the form for callers; no message depends on it yet.
export function translateAuthError(
  error: unknown,
  context: "login" | "signup",
): string {
  void context;
  if (typeof error !== "object" || error === null) return AUTH_MESSAGES.generic;

  const { code, status } = error as { code?: unknown; status?: unknown };
  if (typeof code === "string" && code in BY_CODE) return BY_CODE[code];
  if (status === 429) return AUTH_MESSAGES.rateLimited;
  return AUTH_MESSAGES.generic;
}
