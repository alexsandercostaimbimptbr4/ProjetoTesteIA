import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getDisplayUser, type DisplayUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

// Reads the session, so with Cache Components it must be called from a
// component rendered inside a <Suspense> boundary.
export async function getCurrentUser(): Promise<DisplayUser> {
  // Validating the session compares the token expiry with the current time,
  // so it has to run at request time, never in a prerender.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");
  return getDisplayUser(data.claims);
}
