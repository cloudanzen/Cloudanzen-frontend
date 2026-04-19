/**
 * Access → Roles & Permissions
 *
 * Enterprise role management page with:
 * - Role cards with descriptions + user counts
 * - Full permission matrix table (modules × roles)
 * - Role detail slide-over with permission breakdown
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Key,
  X,
  ChevronRight,
  Users,
  Lock,
  Check,
  Minus,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { usersService } from '@/services/api/users';
import {
  AppRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_CONFIG,
  PERMISSION_MATRIX,
  getPermissionsForRole,
} from '@/lib/rbac/permissions';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';

const ALL_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ORG_ADMIN',
  'SECURITY_OWNER',
  'AUDITOR',
  'CONTRIBUTOR',
  'VIEWER',
];

function roleLabel(role: AppRole, t: TFunction<'access'>) {
  return t(`users.roles.${role}`, { defaultValue: ROLE_LABELS[role] });
}

function roleDescription(role: AppRole, t: TFunction<'access'>) {
  return t(`roles.roleDescriptions.${role}`, {
    defaultValue: ROLE_DESCRIPTIONS[role],
  });
}

function moduleLabel(module: string, t: TFunction<'access'>) {
  const key = module.toLowerCase().replace(/\s+/g, '');
  return t(`roles.modules.${key}`, { defaultValue: module });
}

function permissionLabel(
  permission: string,
  fallback: string,
  t: TFunction<'access'>,
) {
  const action = permission.split(':')[1] ?? fallback;
  return t(`roles.permissionLabels.${action}`, { defaultValue: fallback });
}

// ── Role Detail Slide-over ─────────────────────────────────────────────────────

function RoleDetailPanel({
  role,
  userCount,
  onClose,
}: {
  role: AppRole;
  userCount: number;
  onClose: () => void;
}) {
  const { t } = useTranslation('access');
  const permissions = getPermissionsForRole(role);
  const cfg = ROLE_CONFIG[role];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-200 bg-white">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}
          >
            <Shield className={`w-6 h-6 ${cfg.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {roleLabel(role, t)}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">
              {roleDescription(role, t)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {permissions.length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('roles.detail.permissionsLabel')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{userCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('roles.detail.usersAssigned')}
            </p>
          </div>
        </div>

        {/* Permissions list */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('roles.detail.grantedPermissions')}
          </p>

          {/* Group by module */}
          {PERMISSION_MATRIX.map(({ module, permissions: modulePerms }) => {
            const granted = modulePerms.filter((p) => p.roles[role]);
            if (!granted.length) return null;
            return (
              <div key={module} className="mb-4">
                <p className="text-xs font-bold text-gray-600 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> {moduleLabel(module, t)}
                </p>
                <div className="space-y-1">
                  {granted.map((p) => (
                    <div
                      key={p.permission}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-100"
                    >
                      <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700">
                        {permissionLabel(p.permission, p.label, t)}
                      </span>
                      <span className="text-xs font-mono text-gray-400 ml-auto">
                        {p.permission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Denied permissions */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-5">
            {t('roles.detail.deniedPermissions')}
          </p>
          {PERMISSION_MATRIX.map(({ module, permissions: modulePerms }) => {
            const denied = modulePerms.filter((p) => !p.roles[role]);
            if (!denied.length) return null;
            return (
              <div key={module} className="mb-4">
                <p className="text-xs font-bold text-gray-400 mb-1.5">
                  {moduleLabel(module, t)}
                </p>
                <div className="space-y-1">
                  {denied.map((p) => (
                    <div
                      key={p.permission}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <Minus className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                      <span className="text-xs text-gray-400">
                        {permissionLabel(p.permission, p.label, t)}
                      </span>
                      <span className="text-xs font-mono text-gray-300 ml-auto">
                        {p.permission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Permission Matrix Table ────────────────────────────────────────────────────

function PermissionMatrixTable({ focusRole }: { focusRole?: AppRole }) {
  const { t } = useTranslation('access');
  const roles = focusRole ? [focusRole] : ALL_ROLES;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 min-w-[200px]">
                {t('roles.modulePermission')}
              </th>
              {roles.map((r) => {
                const rc = ROLE_CONFIG[r];
                return (
                  <th
                    key={r}
                    className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]"
                  >
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text} ${rc.border} border`}
                    >
                      {roleLabel(r, t).split(' ')[0]}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MATRIX.map(({ module, permissions }) => (
              <React.Fragment key={module}>
                {/* Module header row */}
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <td
                    className="px-4 py-2 font-semibold text-xs text-gray-600 uppercase tracking-wide sticky left-0 bg-gray-50/50"
                    colSpan={roles.length + 1}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-gray-400" />
                      {moduleLabel(module, t)}
                    </div>
                  </td>
                </tr>
                {/* Permission rows */}
                {permissions.map(({ label, permission, roles: roleMap }) => (
                  <tr
                    key={permission}
                    className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-700 sticky left-0 bg-white">
                      <div>
                        <span className="font-medium">
                          {permissionLabel(permission, label, t)}
                        </span>
                        <span className="ml-2 text-xs font-mono text-gray-400">
                          {permission}
                        </span>
                      </div>
                    </td>
                    {roles.map((r) => (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {roleMap[r] ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50">
                            <Minus className="w-3.5 h-3.5 text-gray-300" />
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AccessRolesPage() {
  const { t } = useTranslation('access');
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [matrixFocus, setMatrixFocus] = useState<AppRole | undefined>(
    undefined,
  );

  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      return usersService.listUsers();
    },
    staleTime: STALE.USERS,
  });

  const users = usersData ?? [];
  const roleUserCount = (role: AppRole) =>
    users.filter((u) => u.role === role).length;

  return (
    <div className="flex flex-col bg-gray-50">
      {selectedRole && (
        <RoleDetailPanel
          role={selectedRole}
          userCount={roleUserCount(selectedRole)}
          onClose={() => setSelectedRole(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          {t('roles.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('roles.description')}</p>
      </div>

      <div className="px-6 py-5 space-y-6">
        <Tabs defaultValue="roles">
          <TabsList className="rounded-xl bg-white border border-gray-200 p-1 shadow-sm h-auto mb-5">
            <TabsTrigger value="roles">{t('roles.tabs.roleCards')}</TabsTrigger>
            <TabsTrigger value="matrix">
              {t('roles.tabs.permissionMatrix')}
            </TabsTrigger>
          </TabsList>

          {/* Role Cards */}
          <TabsContent value="roles" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALL_ROLES.map((role) => {
                const rc = ROLE_CONFIG[role];
                const count = roleUserCount(role);
                const permCount = getPermissionsForRole(role).length;
                return (
                  <div
                    key={role}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                    onClick={() => setSelectedRole(role)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${rc.bg} border ${rc.border}`}
                      >
                        <Shield className={`w-5 h-5 ${rc.text}`} />
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
                    </div>

                    {/* Title */}
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text} ${rc.border} border`}
                      >
                        {roleLabel(role, t)}
                      </span>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">
                        {roleDescription(role, t)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${rc.bg} ${rc.text}`}
                      >
                        <Key className="w-3.5 h-3.5" />
                        {t('roles.permissionsCount', { count: permCount })}
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                        <Users className="w-3.5 h-3.5" />
                        {t('roles.usersCount', { count })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Permission Matrix */}
          <TabsContent value="matrix" className="mt-0 space-y-4">
            {/* Role filter for matrix */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-500">
                {t('roles.filterByRole')}
              </span>
              <button
                onClick={() => setMatrixFocus(undefined)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${!matrixFocus ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
              >
                {t('roles.allRoles')}
              </button>
              {ALL_ROLES.map((r) => {
                const rc = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    onClick={() =>
                      setMatrixFocus(matrixFocus === r ? undefined : r)
                    }
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${matrixFocus === r ? `${rc.bg} ${rc.text} ${rc.border}` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                  >
                    {roleLabel(r, t)}
                  </button>
                );
              })}
            </div>
            <PermissionMatrixTable focusRole={matrixFocus} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
