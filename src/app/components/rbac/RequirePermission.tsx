/**
 * RBAC guard components.
 *
 * <RequirePermission permission="risks:write">
 *   <WriteButton />
 * </RequirePermission>
 *
 * <RequireRole roles={['ORG_ADMIN', 'SECURITY_OWNER']}>
 *   <AdminPanel />
 * </RequireRole>
 *
 * <AccessDenied /> — standalone "not enough permissions" screen
 */

import React from 'react';
import { ShieldOff } from 'lucide-react';
import {
  useHasPermission,
  useHasRole,
} from '@/hooks/useCurrentUser';
import type { Permission, AppRole } from '@/lib/rbac/permissions';

// ── RequirePermission ──────────────────────────────────────────────────────────

interface RequirePermissionProps {
  permission: Permission;
  /** Rendered when the user lacks the permission. Defaults to null (hidden). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders children based on whether the current user
 * has the specified permission.
 * If not, renders `fallback` (default: nothing).
 */
export function RequirePermission({
  permission,
  fallback = null,
  children,
}: RequirePermissionProps) {
  const has = useHasPermission(permission);
  return has ? <>{children}</> : <>{fallback}</>;
}

// ── RequireRole ────────────────────────────────────────────────────────────────

interface RequireRoleProps {
  roles: AppRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally renders children if the user has ANY of the given roles.
 */
export function RequireRole({
  roles,
  fallback = null,
  children,
}: RequireRoleProps) {
  const has = useHasRole(...roles);
  return has ? <>{children}</> : <>{fallback}</>;
}

// ── AccessDenied ───────────────────────────────────────────────────────────────

interface AccessDeniedProps {
  title?: string;
  message?: string;
  requiredRole?: string;
}

export function AccessDenied({
  title = 'Access Denied',
  message = "You don't have permission to view this page.",
  requiredRole,
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-5">
        <ShieldOff className="w-8 h-8 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
        {message}
      </p>
      {requiredRole && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-600 border border-gray-200">
          Required role:{' '}
          <span className="font-semibold text-gray-800">{requiredRole}</span>
        </div>
      )}
    </div>
  );
}

// ── RoleBadge ─────────────────────────────────────────────────────────────────

import { ROLE_CONFIG, ROLE_LABELS } from '@/lib/rbac/permissions';

interface RoleBadgeProps {
  role: AppRole;
  size?: 'sm' | 'md';
}

export function RoleBadge({ role, size = 'sm' }: RoleBadgeProps) {
  const cfg = ROLE_CONFIG[role];
  const label = ROLE_LABELS[role] ?? role;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${cfg.bg} ${cfg.text} ${cfg.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {label}
    </span>
  );
}
