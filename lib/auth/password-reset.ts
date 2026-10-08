import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AUTH_MESSAGES,
  isServiceFailure,
  translateAuthError,
} from "./errors";

// The parts of the Supabase client the reset flow uses, so the tests can
// stand in for them.
type Auth = SupabaseClient["auth"];
export type RecoverAuth = Pick<Auth, "resetPasswordForEmail">;
export type ResetAuth = Pick<Auth, "verifyOtp" | "updateUser" | "signOut">;

// Longer than any link Supabase issues. Anything above it is not a link.
const MAX_TOKEN_HASH_LENGTH = 256;

// Supabase quotes the address in some error messages, and what a person typed
// must not reach the log: only the code and the status are recorded.
function logFailure(what: string, error: unknown) {
  const { code, status, name } = (error ?? {}) as Record<string, unknown>;
  console.error(what, { code, status, name });
}

// Asks Supabase to e-mail a reset link. The answer is "sent" for every
// refusal too (sending limit, address the mail server will not deliver to),
// just as it is for an address no account uses, which Supabase accepts
// without sending anything. The cause of a refusal goes to the server log.
// Only Supabase being unreachable or failing is reported as such.
export async function requestPasswordReset(
  auth: RecoverAuth,
  email: string,
): Promise<"sent" | "unavailable"> {
  try {
    const { error } = await auth.resetPasswordForEmail(email);
    if (!error) return "sent";
    logFailure("Falha ao pedir o e-mail de recuperação:", error);
    return isServiceFailure(error) ? "unavailable" : "sent";
  } catch (error) {
    logFailure("Falha ao pedir o e-mail de recuperação:", error);
    return "unavailable";
  }
}

export type RedeemResult = { ok: true } | { ok: false; message: string };

// Spends the link from the e-mail and sets the new password in one step. The
// link is only checked here, when the form is submitted: opening it does not
// sign anyone in, and a mail scanner that follows links cannot use it up.
// On success the caller is left signed in.
export async function redeemResetLink(
  auth: ResetAuth,
  tokenHash: string,
  password: string,
): Promise<RedeemResult> {
  if (!tokenHash || tokenHash.length > MAX_TOKEN_HASH_LENGTH) {
    return { ok: false, message: AUTH_MESSAGES.linkExpired };
  }

  const { error: linkError } = await auth.verifyOtp({
    token_hash: tokenHash,
    type: "recovery",
  });
  if (linkError) {
    const message = translateAuthError(linkError, "reset");
    if (message === AUTH_MESSAGES.generic) {
      logFailure("Falha inesperada (reset):", linkError);
    }
    return { ok: false, message };
  }

  // From here on the link is spent and has opened a session. If the password
  // does not change, that session must not stay.
  let failure: unknown;
  try {
    const { error } = await auth.updateUser({ password });
    // Asking for the password the account already has leaves it as requested.
    failure = error?.code === "same_password" ? null : error;
  } catch (error) {
    failure = error ?? new Error("updateUser failed");
  }
  if (failure) {
    logFailure("Falha ao trocar a senha:", failure);
    await signOutQuietly(auth, "local");
    const message = translateAuthError(failure, "reset");
    return {
      ok: false,
      message:
        message === AUTH_MESSAGES.resetWeakPassword
          ? message
          : AUTH_MESSAGES.resetFailed,
    };
  }

  // Whoever knew the old password, or held a session, is signed out. The
  // password is already changed, so a failure here does not undo the reset.
  await signOutQuietly(auth, "others");
  return { ok: true };
}

async function signOutQuietly(auth: ResetAuth, scope: "local" | "others") {
  try {
    const { error } = await auth.signOut({ scope });
    if (error) logFailure(`Falha ao encerrar a sessão (${scope}):`, error);
  } catch (error) {
    logFailure(`Falha ao encerrar a sessão (${scope}):`, error);
  }
}
