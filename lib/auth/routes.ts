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
