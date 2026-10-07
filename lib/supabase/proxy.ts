import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolveRedirect } from "@/lib/auth/routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // Cache headers sent with auth cookies: a response that sets a
          // session must never be stored by a CDN or shared proxy.
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
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
  const redirectResponse = NextResponse.redirect(url);
  // Carry over refreshed session cookies, or the renewed session is lost,
  // along with the cache headers that came with them.
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => redirectResponse.cookies.set(cookie));
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(key);
    if (value) redirectResponse.headers.set(key, value);
  }
  return redirectResponse;
}
