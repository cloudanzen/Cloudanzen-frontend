import { redirect } from 'react-router';
import { getCachedUser, hasAuthToken } from '@/services/authStorage';

export function requireAuth() {
  if (!hasAuthToken()) {
    return redirect('/login');
  }

  return null;
}

export function requireRoles(
  roles: string[],
  redirectTo = '/',
) {
  return function requireRoleAccess() {
    if (!hasAuthToken()) {
      return redirect('/login');
    }

    const user = getCachedUser<{ role?: string }>();
    if (!user?.role || !roles.includes(user.role)) {
      return redirect(redirectTo);
    }

    return null;
  };
}
