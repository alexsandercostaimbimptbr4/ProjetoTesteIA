export type DisplayUser = { name: string; email: string };

type Claims = {
  email?: string;
  user_metadata?: { full_name?: unknown };
};

export function getDisplayUser(claims: Claims | null | undefined): DisplayUser {
  const email = claims?.email ?? "";
  const fullName = claims?.user_metadata?.full_name;
  const name =
    typeof fullName === "string" && fullName.trim()
      ? fullName.trim()
      : email.split("@")[0] || "Usuário";
  return { name, email };
}
