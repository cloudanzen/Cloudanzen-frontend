/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  RefreshCw,
  Github,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  X,
  ShieldCheck,
  Laptop,
  BookOpen,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { usersService, UserWithGit } from '@/services/api/users';
import {
  onboardingService,
  UserOnboardingSummary,
} from '@/services/api/onboarding';
import { Role } from '@/services/api/types';
import { ROLE_LABELS, AppRole } from '@/lib/rbac/permissions';
import { useHasPermission, useCurrentUser } from '@/hooks/useCurrentUser';
import { PERMISSIONS } from '@/lib/rbac/permissions';
import { fmtDateTime } from '@/lib/format-date';

// ─── Role badge colour map ─────────────────────────────────────────────────

const ROLE_VARIANT: Record<
  string,
  'destructive' | 'default' | 'secondary' | 'outline'
> = {
  SUPER_ADMIN: 'destructive',
  ORG_ADMIN: 'destructive',
  SECURITY_OWNER: 'default',
  AUDITOR: 'secondary',
  CONTRIBUTOR: 'secondary',
  VIEWER: 'outline',
};

function roleLabel(role: string): string {
  return role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Onboarding progress mini-badge ──────────────────────────────────────────

function OnboardingBadge({ count, total }: { count: number; total: number }) {
  if (count === total)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3 h-3" /> {count}/{total}
      </span>
    );
  if (count > 0)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" /> {count}/{total}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground/70 border border-border">
      <Circle className="w-3 h-3" /> {count}/{total}
    </span>
  );
}

// ─── User Detail Side Panel ──────────────────────────────────────────────────

interface TaskRowProps {
  icon: React.ElementType;
  title: string;
  done: boolean;
  inProgress?: boolean;
  detail?: string | null;
  subDetail?: string | null;
}

function TaskRow({
  icon: Icon,
  title,
  done,
  inProgress,
  detail,
  subDetail,
}: TaskRowProps) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border ${done ? 'border-green-200 bg-green-50/40' : inProgress ? 'border-amber-200 bg-amber-50/30' : 'border-border bg-card'}`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${done ? 'bg-green-100' : inProgress ? 'bg-amber-100' : 'bg-muted'}`}
      >
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : inProgress ? (
          <Clock className="w-4 h-4 text-amber-600" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground/70" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="w-3.5 h-3.5 text-muted-foreground/70 flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          {done && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-1.5 py-0.5">
              Completed
            </span>
          )}
          {!done && inProgress && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
              In Progress
            </span>
          )}
          {!done && !inProgress && (
            <span className="text-xs text-muted-foreground bg-muted border border-border rounded-full px-1.5 py-0.5">
              Not Started
            </span>
          )}
        </div>
        {detail && (
          <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
        )}
        {subDetail && (
          <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
            {subDetail}
          </p>
        )}
      </div>
    </div>
  );
}

function UserDetailPanel({
  user,
  onClose,
}: {
  user: UserOnboardingSummary;
  onClose: () => void;
}) {
  const { t } = useTranslation('personnel');
  const ob = user.onboarding;
  const policyIds: string[] = (() => {
    try {
      return JSON.parse(ob.policyVersionAccepted ?? '[]');
    } catch {
      return [];
    }
  })();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-md bg-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm flex-shrink-0">
            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user.name ?? (
                <span className="italic text-muted-foreground/70">
                  {t('people.noName')}
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground/70"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="px-5 py-3 bg-muted border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-foreground">
              {t('people.detail.securityOnboarding')}
            </span>
            <span className="text-xs font-bold text-blue-700">
              {t('people.detail.complete', {
                count: ob.completedCount,
                total: ob.totalCount,
              })}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${ob.allComplete ? 'bg-green-500' : ob.completedCount > 0 ? 'bg-blue-500' : 'bg-muted'}`}
              style={{
                width: `${Math.round((ob.completedCount / ob.totalCount) * 100)}%`,
              }}
            />
          </div>
          {ob.allComplete && (
            <p className="text-xs text-green-700 font-medium mt-1.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />{' '}
              {t('people.detail.allTasksComplete')}
            </p>
          )}
        </div>

        {/* Task detail */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t('people.detail.taskStatus')}
          </p>

          {/* Task 1 */}
          <TaskRow
            icon={FileText}
            title={t('people.detail.tasks.acceptPolicies.title')}
            done={ob.policyAccepted}
            detail={
              ob.policyAccepted
                ? t('people.detail.tasks.acceptPolicies.acceptedOn', {
                    date: fmtDateTime(ob.policyAcceptedAt),
                  })
                : undefined
            }
            subDetail={
              ob.policyAccepted && policyIds.length > 0
                ? t('people.detail.tasks.acceptPolicies.acknowledged', {
                    count: policyIds.length,
                  })
                : ob.policyAccepted
                  ? undefined
                  : t('people.detail.tasks.acceptPolicies.notYetAccepted')
            }
          />

          {/* Task 2 */}
          <TaskRow
            icon={Laptop}
            title={t('people.detail.tasks.installMdm.title')}
            done={ob.mdmEnrolled}
            detail={
              ob.mdmEnrolled
                ? t('people.detail.tasks.installMdm.enrolledOn', {
                    date: fmtDateTime(ob.mdmEnrolledAt),
                  })
                : t('people.detail.tasks.installMdm.awaitingEnrollment')
            }
            subDetail={
              ob.deviceId
                ? t('people.detail.tasks.installMdm.device', {
                    id: ob.deviceId,
                  })
                : undefined
            }
          />

          {/* Task 3 */}
          <TaskRow
            icon={BookOpen}
            title={t('people.detail.tasks.training.title')}
            done={ob.trainingCompleted}
            inProgress={ob.trainingStarted && !ob.trainingCompleted}
            detail={
              ob.trainingCompleted
                ? t('people.detail.tasks.training.completedOn', {
                    date: fmtDateTime(ob.trainingCompletedAt),
                  })
                : ob.trainingStarted
                  ? t('people.detail.tasks.training.startedOn', {
                      date: fmtDateTime(ob.trainingStartedAt),
                    })
                  : t('people.detail.tasks.training.notStarted')
            }
          />

          {/* User info */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('people.detail.userInfo')}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground/70">
                  {t('people.columns.role')}
                </p>
                <p className="font-medium text-foreground">
                  {t(
                    `people.roles.${user.role as AppRole}`,
                    ROLE_LABELS[user.role as AppRole],
                  )}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground/70">
                  {t('people.columns.joined')}
                </p>
                <p className="font-medium text-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

const ALL_ROLES: AppRole[] = [
  'SUPER_ADMIN',
  'ORG_ADMIN',
  'SECURITY_OWNER',
  'AUDITOR',
  'CONTRIBUTOR',
  'VIEWER',
];

export function PeoplePage() {
  const { t } = useTranslation('personnel');
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const canAssignRoles = useHasPermission(PERMISSIONS.USERS_ROLES_ASSIGN);
  const [selectedUser, setSelectedUser] =
    useState<UserOnboardingSummary | null>(null);

  const {
    data: usersData,
    isLoading: loadingUsers,
    isFetching,
    error: usersError,
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

  const users: UserWithGit[] = usersData ?? [];
  const loading = loadingUsers;
  const error: string | null = usersError
    ? ((usersError as any)?.message ?? t('people.failedToLoadUsers'))
    : null;

  const onboardingMap = new Map<string, UserOnboardingSummary>();
  for (const u of onboardingData ?? []) onboardingMap.set(u.id, u);

  const fetchUsers = () => {
    qc.invalidateQueries({ queryKey: QK.users() });
    qc.invalidateQueries({ queryKey: QK.onboardingUsers() });
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        t('people.confirmRemove', { name: name || t('people.thisUser') }),
      )
    )
      return;
    try {
      await usersService.deleteUser(id);
      qc.invalidateQueries({ queryKey: QK.users() });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t('people.failedToRemoveUser'));
    }
  };

  const handleRowClick = (userId: string) => {
    const ob = onboardingMap.get(userId);
    if (ob) setSelectedUser(ob);
  };

  return (
    <PageTemplate
      title={t('people.title')}
      description={t('people.description')}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
            />
            {t('people.refresh')}
          </Button>
        </div>
      }
    >
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('people.columns.nameEmail')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('people.columns.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('people.columns.githubAccounts')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('people.columns.onboarding')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('people.columns.joined')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('people.columns.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-muted-foreground/70"
                  >
                    {t('people.loading')}
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-muted-foreground/70"
                  >
                    {t('people.noUsersFound')}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const ob = onboardingMap.get(user.id);
                  const hasOnboarding = !!ob;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-muted ${hasOnboarding ? 'cursor-pointer' : ''}`}
                      onClick={
                        hasOnboarding
                          ? () => handleRowClick(user.id)
                          : undefined
                      }
                    >
                      {/* Name / Email */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">
                          {user.name ?? (
                            <span className="text-muted-foreground/70 italic">
                              {t('people.noName')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </td>

                      {/* Role */}
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canAssignRoles && currentUser?.id !== user.id ? (
                          <select
                            value={user.role}
                            onChange={async (e) => {
                              const newRole = e.target.value as Role;
                              try {
                                await usersService.updateUser(user.id, {
                                  role: newRole,
                                });
                                qc.invalidateQueries({ queryKey: QK.users() });
                              } catch {
                                // silently fail — user sees no change
                              }
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-md border border-border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                            title={t('people.changeRole')}
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {t(`people.roles.${r}`, ROLE_LABELS[r])}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant={ROLE_VARIANT[user.role] ?? 'outline'}>
                            {roleLabel(user.role)}
                          </Badge>
                        )}
                      </td>

                      {/* GitHub accounts */}
                      <td
                        className="px-6 py-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {user.gitAccounts.length === 0 ? (
                          <span className="text-xs text-muted-foreground/70">
                            —
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {user.gitAccounts.map((ga) => (
                              <a
                                key={ga.id}
                                href={
                                  ga.profileUrl ??
                                  `https://github.com/${ga.githubUsername}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              >
                                {ga.avatarUrl && (
                                  <img
                                    src={ga.avatarUrl}
                                    alt={ga.githubUsername}
                                    className="w-4 h-4 rounded-full"
                                  />
                                )}
                                <Github className="w-3 h-3" />
                                {ga.githubUsername}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Onboarding status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasOnboarding ? (
                          <div className="flex items-center gap-2">
                            <OnboardingBadge
                              count={ob.onboarding.completedCount}
                              total={ob.onboarding.totalCount}
                            />
                            {/* Mini task icons */}
                            <div className="flex gap-0.5">
                              {[
                                {
                                  done: ob.onboarding.policyAccepted,
                                  icon: FileText,
                                },
                                {
                                  done: ob.onboarding.mdmEnrolled,
                                  icon: Laptop,
                                },
                                {
                                  done: ob.onboarding.trainingCompleted,
                                  icon: BookOpen,
                                },
                              ].map(({ done, icon: Icon }, i) => (
                                <span
                                  key={i}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center ${done ? 'bg-green-100' : 'bg-muted'}`}
                                  title={
                                    [
                                      t('people.onboardingTitles.policies'),
                                      t('people.onboardingTitles.mdm'),
                                      t('people.onboardingTitles.training'),
                                    ][i]
                                  }
                                >
                                  <Icon
                                    className={`w-3 h-3 ${done ? 'text-green-600' : 'text-muted-foreground/70'}`}
                                  />
                                </span>
                              ))}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70" />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">
                            —
                          </span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            handleDelete(user.id, user.name ?? user.email)
                          }
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title={t('people.removeUser')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && users.length > 0 && (
          <div className="px-6 py-3 bg-muted border-t text-xs text-muted-foreground">
            {t('people.members', { count: users.length })}
            {onboardingMap.size > 0 && (
              <span className="ml-2 text-muted-foreground/70">
                ·{' '}
                {
                  Array.from(onboardingMap.values()).filter(
                    (u) => u.onboarding.allComplete,
                  ).length
                }{' '}
                {t('people.fullyOnboarded')}
              </span>
            )}
          </div>
        )}
      </Card>
    </PageTemplate>
  );
}
