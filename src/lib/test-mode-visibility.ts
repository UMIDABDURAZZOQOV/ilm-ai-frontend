/** Public policy pages are documents, not the interactive site beta. */
export function shouldShowTestModeBanner(pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  return path !== "/privacy";
}
