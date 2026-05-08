import { authService } from '@/services/api/auth';
import {
  AppRole,
  Permission,
  roleHasPermission,
  getPermissionsForRole,
} from '@/lib/rbac/permissions';

// Re-export for convenience so consumers don't need two imports
export type { AppRole, Permission };

// Lightweight synchronous hook — reads the cached user from localStorage.
// No React state; components using this will get the value at render time.
// For reactive updates (e.g. after login), components should re-mount or
// use a parent state that refreshes on route change.

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  organizationId: string;
  preferredLocale: 'en' | 'ja';
}

export function useCurrentUser(): CurrentUser | null {
  const raw = authService.getCachedUser();
  if (!raw) return null;
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? null,
    role: raw.role as AppRole,
    organizationId: raw.organizationId,
    preferredLocale: raw.preferredLocale === 'ja' ? 'ja' : 'en',
  };
}

// ── Role helpers ───────────────────────────────────────────────────────────────

export function useIsAdmin(): boolean {
  const user = useCurrentUser();
  return ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'].includes(
    user?.role ?? '',
  );
}

export function useIsAuditor(): boolean {
  return useCurrentUser()?.role === 'AUDITOR';
}

export function useCanAudit(): boolean {
  const user = useCurrentUser();
  return ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER', 'AUDITOR', 'EXTERNAL_AUDITOR'].includes(
    user?.role ?? '',
  );
}

/** Returns true if the user has any of the given roles */
export function useHasRole(...roles: AppRole[]): boolean {
  const user = useCurrentUser();
  return roles.includes(user?.role as AppRole);
}

// ── Permission helpers ─────────────────────────────────────────────────────────

/**
 * Returns true if the current user's role grants the given permission.
 * Usage: const canWrite = useHasPermission(PERMISSIONS.RISKS_WRITE)
 */
export function useHasPermission(permission: Permission): boolean {
  const user = useCurrentUser();
  if (!user) return false;
  return roleHasPermission(user.role as AppRole, permission);
}

/**
 * Returns all permissions for the current user's role.
 */
export function usePermissions(): Permission[] {
  const user = useCurrentUser();
  if (!user) return [];
  return getPermissionsForRole(user.role as AppRole);
}

/**
 * Returns a permission checker function — useful when you need
 * to check multiple permissions without calling the hook repeatedly.
 *
 * Usage:
 *   const can = usePermissionChecker();
 *   if (can(PERMISSIONS.USERS_MANAGE)) { ... }
 */
export function usePermissionChecker(): (permission: Permission) => boolean {
  const perms = usePermissions();
  return (permission: Permission) => perms.includes(permission);
}

// ── Typed role info ────────────────────────────────────────────────────────────

export {
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_CONFIG,
  PERMISSIONS,
} from '@/lib/rbac/permissions';
