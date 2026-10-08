import type { CookieOptionsWithName } from "@supabase/ssr";

// The library default leaves session cookies readable by page scripts. This
// app only talks to Supabase from the server, so the tokens stay HTTP-only.
// A production build also marks them Secure, so outside localhost the browser
// neither stores nor sends them over plain HTTP. Chromium and Firefox still
// accept Secure cookies on http://localhost, which keeps `next start` and the
// e2e suite working; `next dev` leaves the flag off.
export const SESSION_COOKIE_OPTIONS: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};
