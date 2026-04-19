import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Shield,
  CheckCircle2,
  Circle,
  Github,
  Loader2,
  Key,
  FileText,
  Laptop,
  BookOpen,
  Edit2,
  Save,
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { usersService, UserWithGit } from '@/services/api/users';
import { UserOnboardingSummary } from '@/services/api/onboarding';
import { Role } from '@/services/api/types';
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_CONFIG,
  AppRole,
  getPermissionsForRole,
} from '@/lib/rbac/permissions';

import { PERMISSIONS } from '@/lib/rbac/permissions';
import { useCurrentUser, useHasPermission } from '@/hooks/useCurrentUser';
import { ALL_ROLES, initials } from './helpers';
import { fmtDate } from '@/lib/format-date';

// ── User Detail Slide-over ─────────────────────────────────────────────────────

export function UserDetailPanel({
  user,
  onboarding,
  onClose,
  onRoleUpdated,
}: {
  user: UserWithGit;
  onboarding?: UserOnboardingSummary;
  onClose: () => void;
  onRoleUpdated: (userId: string, newRole: Role) => void;
}) {
  const { t } = useTranslation('access');
  const currentUser = useCurrentUser();
  const canManage = useHasPermission(PERMISSIONS.USERS_ROLES_ASSIGN);
  const [editingRole, setEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(user.role as Role);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const permissions = getPermissionsForRole(user.role as AppRole);
  const ob = onboarding?.onboarding;

  const handleSaveRole = async () => {
    if (selectedRole === user.role) {
      setEditingRole(false);
      return;
    }
    setSaving(true);
    setSaveErr(null);
    try {
      await usersService.updateUser(user.id, { role: selectedRole });
      onRoleUpdated(user.id, selectedRole);
      setEditingRole(false);
    } catch (e: unknown) {
      setSaveErr(
        e instanceof Error ? e.message : t('userDetail.failedToUpdateRole'),
      );
    } finally {
      setSaving(false);
    }
  };

  const cfg = ROLE_CONFIG[user.role as AppRole];

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-200 bg-white">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 ${cfg?.bg ?? 'bg-blue-50'} ${cfg?.text ?? 'text-blue-700'}`}
          >
            {initials(user.name, user.email)}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 leading-snug">
              {user.name ?? (
                <span className="italic text-gray-400">
                  {t('userDetail.noName')}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg?.bg ?? 'bg-blue-50'} ${cfg?.text ?? 'text-blue-700'} ${cfg?.border ?? 'border-blue-200'} border`}
              >
                {t(
                  `users.roles.${user.role as AppRole}`,
                  ROLE_LABELS[user.role as AppRole],
                )}
              </span>
              <span className="text-xs text-gray-400">
                {t('userDetail.joined', { date: fmtDate(user.createdAt) })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI strip */}
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {permissions.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('userDetail.kpi.permissions')}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {user.gitAccounts.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('userDetail.kpi.githubAccounts')}
              </p>
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${ob?.allComplete ? 'text-green-600' : 'text-amber-600'}`}
              >
                {ob ? `${ob.completedCount}/${ob.totalCount}` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('userDetail.kpi.onboarded')}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Tabs defaultValue="role" className="space-y-4">
            <TabsList className="rounded-xl bg-slate-100 p-1 h-auto">
              <TabsTrigger value="role">
                {t('userDetail.tabs.roleAccess')}
              </TabsTrigger>
              <TabsTrigger value="permissions">
                {t('userDetail.tabs.permissions', {
                  count: permissions.length,
                })}
              </TabsTrigger>
              <TabsTrigger value="onboarding">
                {t('userDetail.tabs.onboarding')}
              </TabsTrigger>
              {user.gitAccounts.length > 0 && (
                <TabsTrigger value="git">
                  {t('userDetail.tabs.github')}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Role & Access tab */}
            <TabsContent value="role" className="space-y-4 mt-0">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">
                    {t('userDetail.roleAssignment')}
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {/* Current role */}
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      {t('userDetail.currentRole')}
                    </p>
                    {editingRole ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {ALL_ROLES.map((r) => {
                            const rc = ROLE_CONFIG[r];
                            const isSelected = selectedRole === r;
                            return (
                              <button
                                key={r}
                                onClick={() => setSelectedRole(r as Role)}
                                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? `${rc.bg} ${rc.border} ring-2 ring-offset-1 ring-current ${rc.text}`
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${rc.dot}`}
                                />
                                <div>
                                  <p
                                    className={`text-xs font-semibold ${isSelected ? rc.text : 'text-gray-800'}`}
                                  >
                                    {t(`users.roles.${r}`, ROLE_LABELS[r])}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 leading-tight line-clamp-2">
                                    {t(
                                      `roles.roleDescriptions.${r}`,
                                      ROLE_DESCRIPTIONS[r],
                                    )}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {saveErr && (
                          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                            {saveErr}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveRole}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium transition-colors"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            {saving
                              ? t('userDetail.saving')
                              : t('userDetail.saveRole')}
                          </button>
                          <button
                            onClick={() => {
                              setEditingRole(false);
                              setSelectedRole(user.role as Role);
                              setSaveErr(null);
                            }}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {t('userDetail.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg?.bg ?? 'bg-blue-50'} ${cfg?.text ?? 'text-blue-700'} ${cfg?.border ?? 'border-blue-200'} border`}
                          >
                            {t(
                              `users.roles.${user.role as AppRole}`,
                              ROLE_LABELS[user.role as AppRole],
                            )}
                          </span>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t(
                                `roles.roleDescriptions.${user.role as AppRole}`,
                                ROLE_DESCRIPTIONS[user.role as AppRole],
                              )}
                            </p>
                          </div>
                        </div>
                        {canManage && currentUser?.id !== user.id && (
                          <button
                            onClick={() => setEditingRole(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex-shrink-0 ml-3"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            {t('userDetail.change')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Permissions tab */}
            <TabsContent value="permissions" className="mt-0">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <Key className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-800">
                    {t('userDetail.grantedPermissions')}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {t('userDetail.total', { count: permissions.length })}
                  </span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-1.5">
                  {permissions.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-green-50 border border-green-100"
                    >
                      <CheckCircle2 className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span className="text-xs font-mono text-gray-700">
                        {p}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Onboarding tab */}
            <TabsContent value="onboarding" className="space-y-3 mt-0">
              {!ob ? (
                <div className="text-center py-10 text-gray-400">
                  <Circle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('userDetail.noOnboarding')}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t('userDetail.progress')}
                    </span>
                    <span className="text-sm font-bold text-blue-700">
                      {ob.completedCount}/{ob.totalCount}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all ${ob.allComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{
                        width: `${Math.round((ob.completedCount / ob.totalCount) * 100)}%`,
                      }}
                    />
                  </div>

                  {[
                    {
                      icon: FileText,
                      title: t('userDetail.onboardingTasks.acceptPolicies'),
                      done: ob.policyAccepted,
                      detail: ob.policyAcceptedAt
                        ? t('userDetail.onboardingDetail.accepted', {
                            date: fmtDate(ob.policyAcceptedAt),
                          })
                        : t('userDetail.onboardingDetail.notAccepted'),
                    },
                    {
                      icon: Laptop,
                      title: t('userDetail.onboardingTasks.installMdm'),
                      done: ob.mdmEnrolled,
                      detail: ob.mdmEnrolledAt
                        ? t('userDetail.onboardingDetail.enrolled', {
                            date: fmtDate(ob.mdmEnrolledAt),
                          })
                        : t('userDetail.onboardingDetail.awaitingEnrollment'),
                    },
                    {
                      icon: BookOpen,
                      title: t('userDetail.onboardingTasks.securityTraining'),
                      done: ob.trainingCompleted,
                      detail: ob.trainingCompleted
                        ? t('userDetail.onboardingDetail.completed', {
                            date: fmtDate(ob.trainingCompletedAt),
                          })
                        : ob.trainingStarted
                          ? t('userDetail.onboardingDetail.inProgress')
                          : t('userDetail.onboardingDetail.notStarted'),
                    },
                  ].map(({ icon: Icon, title, done, detail }) => (
                    <div
                      key={title}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${done ? 'border-green-200 bg-green-50/40' : 'border-gray-200 bg-white'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-100' : 'bg-gray-100'}`}
                      >
                        {done ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-800">
                          {title}
                        </span>
                      </div>
                      <span className="ml-auto text-xs text-gray-500">
                        {detail}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </TabsContent>

            {/* GitHub tab */}
            {user.gitAccounts.length > 0 && (
              <TabsContent value="git" className="space-y-2 mt-0">
                {user.gitAccounts.map((ga) => (
                  <div
                    key={ga.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50"
                  >
                    {ga.avatarUrl ? (
                      <img
                        src={ga.avatarUrl}
                        alt={ga.githubUsername}
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <Github className="w-8 h-8 text-gray-400 flex-shrink-0" />
                    )}
                    <div>
                      <a
                        href={
                          ga.profileUrl ??
                          `https://github.com/${ga.githubUsername}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        @{ga.githubUsername}
                      </a>
                    </div>
                  </div>
                ))}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
