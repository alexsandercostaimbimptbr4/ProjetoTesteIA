import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirect } from "@/lib/auth/routes";
import { SESSION_COOKIE_OPTIONS } from "./cookie-options";

type SessionCookie = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Everything Supabase asked to write during this request. setAll can run
  // more than once and only its first call carries the cache headers, so they
  // are kept here and reapplied to whichever response is finally returned.
  const sessionCookies = new Map<string, SessionCookie>();
  const cacheHeaders: Record<string, string> = {};

  function applySession(response: NextResponse) {
    sessionCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options),
    );
    // A response that sets a session must never be stored by a CDN or shared
    // proxy, or one user's token could be served to another.
    Object.entries(cacheHeaders).forEach(([key, value]) =>
      response.headers.set(key, value),
    );
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: SESSION_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach((cookie) => {
            request.cookies.set(cookie.name, cookie.value);
            sessionCookies.set(cookie.name, cookie);
          });
          Object.assign(cacheHeaders, headers);
          // Rebuilt so Server Components see the refreshed request cookies.
          supabaseResponse = applySession(NextResponse.next({ request }));
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims(): it refreshes
  // the session and validates the JWT signature.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);

  const destination = resolveRedirect(
    request.nextUrl.pathname,
    isAuthenticated,
  );
  if (!destination) return supabaseResponse;

  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = "";
  // The redirect carries the refreshed session too, or it would be lost.
  return applySession(NextResponse.redirect(url));
}
