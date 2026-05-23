// Tab-scoped storage for the active SupportSession id during impersonation.
//
// The __Host-impersonation-token cookie is browser-global; the only thing
// gating per-tab opt-in is the X-Impersonation-Session header that mirrors
// the cookie's supportSessionId claim. sessionStorage holds it because:
//   - it survives page reloads inside the same tab
//   - it is NOT shared with other tabs (each tab gets its own bucket)
//
// The id itself is not secret (a UUID). The capability is the HttpOnly
// cookie that JS cannot read. Storing the id in sessionStorage is safe.
const KEY = 'cloudanzen.impersonationSessionId';

function hasBrowserStorage(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.sessionStorage !== 'undefined'
  );
}

export function readImpersonationSessionId(): string | null {
  if (!hasBrowserStorage()) return null;
  return window.sessionStorage.getItem(KEY);
}

export function writeImpersonationSessionId(sessionId: string): void {
  if (!hasBrowserStorage()) return;
  window.sessionStorage.setItem(KEY, sessionId);
}

export function clearImpersonationSessionId(): void {
  if (!hasBrowserStorage()) return;
  window.sessionStorage.removeItem(KEY);
}
