/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
/**
 * Access → Users
 *
 * Enterprise user management with:
 * - Full user table with role badges, lifecycle status, onboarding
 * - Inline role assignment (dropdown) for admins
 * - User lifecycle: Active / Suspended / Invited
 * - Detail slide-over: role change, permissions, onboarding tasks, GitHub
 * - Invite user flow
 * - Audit log actions
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
  Search,
  X,
  ChevronRight,
  CheckCircle2,
  Clock,
  Circle,
  Github,
  Loader2,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { usersService, UserWithGit } from '@/services/api/users';
import {
  onboardingService,
  UserOnboardingSummary,
} from '@/services/api/onboarding';
import { Role } from '@/services/api/types';
import { ROLE_LABELS, ROLE_CONFIG, AppRole } from '@/lib/rbac/permissions';
import { RoleBadge } from '@/app/components/rbac/RequirePermission';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { useCurrentUser, useHasPermission } from '@/hooks/useCurrentUser';

import { initials, ALL_ROLES } from './accessUsers/helpers';
import { fmtDate } from '@/lib/format-date';
import { KpiCard } from './accessUsers/KpiCard';
import { UserDetailPanel } from './accessUsers/UserDetailPanel';
import { InviteUserModal } from './accessUsers/InviteUserModal';

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AccessUsersPage() {
  const { t } = useTranslation('access');
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const canManageUsers = useHasPermission(PERMISSIONS.USERS_MANAGE);
  const canAssignRoles = useHasPermission(PERMISSIONS.USERS_ROLES_ASSIGN);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | ''>('');
  const [selectedUser, setSelectedUser] = useState<UserWithGit | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const {
    data: usersData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      return usersService.listUsers();
    },
    staleTime: STALE.USERS,
  });

  const { data: onboardingData } = useQuery({
    queryKey: QK.onboardingUsers(),
    queryFn: async () => {
      const res = await onboardingService.listUsersOnboarding();
      return (res.data ?? []) as UserOnboardingSummary[];
    },
    staleTime: STALE.USERS,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.users() });
      setSelectedUser(null);
    },
  });

  const users: UserWithGit[] = usersData ?? [];
  const onboardingMap = new Map<string, UserOnboardingSummary>();
  for (const u of onboardingData ?? []) onboardingMap.set(u.id, u);

  // Filtered + searched users
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // KPIs
  const totalUsers = users.length;
  const adminCount = users.filter((u) =>
    ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'].includes(u.role),
  ).length;
  const onboardedCount = Array.from(onboardingMap.values()).filter(
    (u) => u.onboarding.allComplete,
  ).length;
  const roleBreakdown = ALL_ROLES.map((r) => ({
    role: r,
    count: users.filter((u) => u.role === r).length,
  })).filter((x) => x.count > 0);

  const handleRoleUpdated = (userId: string, newRole: Role) => {
    qc.invalidateQueries({ queryKey: QK.users() });
    // Update selected user if it's the one being edited
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(t('users.confirmRemove', { name: name || t('users.thisUser') }))
    )
      return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Detail panel */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onboarding={onboardingMap.get(selectedUser.id)}
          onClose={() => setSelectedUser(null)}
          onRoleUpdated={handleRoleUpdated}
        />
      )}

      {/* Invite modal */}
      {showInvite && <InviteUserModal onClose={() => setShowInvite(false)} />}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            {t('users.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('users.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              qc.invalidateQueries({ queryKey: QK.users() });
            }}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            {t('users.refresh')}
          </button>
          {canManageUsers && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              {t('users.inviteUser')}
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard label={t('users.kpi.totalUsers')} value={totalUsers} />
          <KpiCard
            label={t('users.kpi.privilegedUsers')}
            value={adminCount}
            sub={t('users.kpi.privilegedSub')}
            color="text-orange-600"
          />
          <KpiCard
            label={t('users.kpi.fullyOnboarded')}
            value={onboardedCount}
            sub={t('users.kpi.onboardedPercent', {
              percent:
                totalUsers > 0
                  ? Math.round((onboardedCount / totalUsers) * 100)
                  : 0,
            })}
            color="text-green-600"
          />
          <KpiCard
            label={t('users.kpi.rolesInUse')}
            value={roleBreakdown.length}
            sub={roleBreakdown
              .map((r) => t(`users.roles.${r.role}`, ROLE_LABELS[r.role]))
              .join(', ')}
          />
        </div>

        {/* Role distribution mini-bar */}
        {users.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('users.roleDistribution')}
            </p>
            <div className="flex gap-3 flex-wrap">
              {ALL_ROLES.map((r) => {
                const count = users.filter((u) => u.role === r).length;
                if (!count) return null;
                const rc = ROLE_CONFIG[r];
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(roleFilter === r ? '' : r)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      roleFilter === r
                        ? `${rc.bg} ${rc.text} ${rc.border} ring-2 ring-current ring-offset-1`
                        : `bg-white border-gray-200 text-gray-600 hover:${rc.bg}`
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${rc.dot}`} />
                    {t(`users.roles.${r}`, ROLE_LABELS[r])}{' '}
                    <span className="font-bold">{count}</span>
                  </button>
                );
              })}
              {roleFilter && (
                <button
                  onClick={() => setRoleFilter('')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-gray-500 border border-gray-200 hover:bg-gray-50"
                >
                  <X className="w-3 h-3" /> {t('users.clearFilter')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search + table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('users.searchPlaceholder')}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('users.columns.user')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('users.columns.role')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('users.columns.onboarding')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('users.columns.github')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('users.columns.joined')}
                  </th>
                  {(canManageUsers || canAssignRoles) && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('users.columns.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-red-500"
                    >
                      {(error as any)?.message ?? t('users.failedToLoad')}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      {t('users.noUsers')}
                    </td>
                  </tr>
                ) : (
                  filtered.map((user) => {
                    const ob = onboardingMap.get(user.id);
                    const isMe = currentUser?.id === user.id;
                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        {/* User */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${ROLE_CONFIG[user.role as AppRole]?.bg ?? 'bg-gray-100'} ${ROLE_CONFIG[user.role as AppRole]?.text ?? 'text-gray-600'}`}
                            >
                              {initials(user.name, user.email)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.name ?? (
                                  <span className="italic text-gray-400">
                                    {t('users.noName')}
                                  </span>
                                )}
                                {isMe && (
                                  <span className="ml-1.5 text-xs text-blue-500 font-normal">
                                    {t('users.you')}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canAssignRoles && !isMe ? (
                            <select
                              value={user.role}
                              onChange={async (e) => {
                                const newRole = e.target.value as Role;
                                await usersService.updateUser(user.id, {
                                  role: newRole,
                                });
                                qc.invalidateQueries({ queryKey: QK.users() });
                              }}
                              className="text-xs font-medium px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              style={{
                                borderColor: ROLE_CONFIG[
                                  user.role as AppRole
                                ]?.border.replace('border-', ''),
                              }}
                              title={t('users.changeRole')}
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {t(`users.roles.${r}`, ROLE_LABELS[r])}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <RoleBadge role={user.role as AppRole} />
                          )}
                        </td>

                        {/* Onboarding — [T-91] N/A chip for role-exempt users (totalCount === 0). */}
                        <td className="px-4 py-3.5">
                          {ob ? (
                            ob.onboarding.totalCount === 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                {t('users.exempt', { defaultValue: 'N/A' })}
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                {ob.onboarding.allComplete ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : ob.onboarding.completedCount > 0 ? (
                                  <Clock className="w-4 h-4 text-amber-500" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300" />
                                )}
                                <span className="text-xs text-gray-600 font-medium">
                                  {ob.onboarding.completedCount}/
                                  {ob.onboarding.totalCount}
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* GitHub */}
                        <td className="px-4 py-3.5">
                          {user.gitAccounts.length > 0 ? (
                            <span className="flex items-center gap-1 text-xs text-gray-600">
                              <Github className="w-3.5 h-3.5" />
                              {user.gitAccounts.length}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {fmtDate(user.createdAt)}
                        </td>

                        {/* Actions */}
                        {(canManageUsers || canAssignRoles) && (
                          <td
                            className="px-4 py-3.5 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title={t('users.viewDetails')}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              {canManageUsers && !isMe && (
                                <button
                                  onClick={() =>
                                    handleDelete(
                                      user.id,
                                      user.name ?? user.email,
                                    )
                                  }
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title={t('users.removeUserAction')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && users.length > 0 && (
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
              {t('users.showing', {
                filtered: filtered.length,
                total: users.length,
              })}
              {roleFilter && (
                <span className="ml-1 text-gray-400">
                  ·{' '}
                  {t('users.filteredBy', {
                    role: t(
                      `users.roles.${roleFilter}`,
                      ROLE_LABELS[roleFilter],
                    ),
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
