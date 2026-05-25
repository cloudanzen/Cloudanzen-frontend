import { redirect } from 'react-router';
import { getCachedUser, hasAuthToken } from '@/services/authStorage';
import { readImpersonationSessionId } from '@/services/impersonationStorage';

/**
 * Tenant requires EITHER:
 *   - a normal tenant token in storage, OR
 *   - an impersonation sessionId in sessionStorage (popup tab opened
 *     via /support-session/exchange — the __Host-impersonation-token
 *     cookie is HttpOnly so this guard can't read it directly; the
 *     sessionStorage flag is the per-tab opt-in marker that mirrors
 *     the cookie's presence on the api host).
 */
function isAuthenticatedTab(): boolean {
  return hasAuthToken() || readImpersonationSessionId() !== null;
}

export function requireAuth() {
  if (!isAuthenticatedTab()) {
    return redirect('/login');
  }

  return null;
}

export function requireRoles(roles: string[], redirectTo = '/') {
  return function requireRoleAccess() {
    if (!isAuthenticatedTab()) {
      return redirect('/login');
    }

    // Impersonation flows: cached user is the support actor row in the
    // target org; its on-disk role is the EXTERNAL_AUDITOR sentinel.
    // The session's effectiveRole (loaded by backend middleware) is
    // what actually applies. The role gate here would block legit
    // impersonation traffic — skip it when the tab is in impersonation
    // mode. Server-side RBAC still enforces the real effective role.
    if (readImpersonationSessionId()) {
      return null;
    }

    const user = getCachedUser<{ role?: string }>();
    if (!user?.role || !roles.includes(user.role)) {
      return redirect(redirectTo);
    }

    return null;
  };
}
