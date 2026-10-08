// Pages that only make sense signed out. The password reset pages are not
// among them: a reset link may be opened while signed in, even as another
// account, and from there the person must be able to ask for a new one.
const AUTH_PAGES = ["/login", "/cadastro"];

function isDashboard(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function resolveRedirect(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  if (isAuthenticated) {
    return pathname === "/" || AUTH_PAGES.includes(pathname)
      ? "/dashboard"
      : null;
  }
  return pathname === "/" || isDashboard(pathname) ? "/login" : null;
}
