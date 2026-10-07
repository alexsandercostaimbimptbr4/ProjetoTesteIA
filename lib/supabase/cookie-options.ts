import type { CookieOptionsWithName } from "@supabase/ssr";

// The library default leaves session cookies readable by page scripts. This
// app only talks to Supabase from the server, so the tokens stay HTTP-only.
export const SESSION_COOKIE_OPTIONS: CookieOptionsWithName = {
  httpOnly: true,
};
