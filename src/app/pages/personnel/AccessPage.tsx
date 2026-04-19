import { useEffect, useState, useCallback } from "react";
import { useTranslation, Trans } from 'react-i18next';
import { PageTemplate } from "@/app/components/PageTemplate";
import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Github,
  RefreshCw,
  Link2,
  Unlink,
  AlertCircle,
  CheckCircle2,
  User,
} from "lucide-react";
import { usersService, GitHubMember, UserWithGit, SlackMember } from "@/services/api/users";

// ─── Slack icon (inline SVG, no extra dep) ────────────────────────────────────

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386" fill="#36C5F0"/>
      <path d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387" fill="#2EB67D"/>
      <path d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386" fill="#ECB22E"/>
      <path d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.387 5.381 5.381 0 0 0-5.376 5.387" fill="#E01E5A"/>
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MappingState {
  saving: string | null;
  errors: Record<string, string>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccessPage() {
  const { t } = useTranslation('personnel');
  // ── GitHub state ──────────────────────────────────────────────────────────
  const [members, setMembers] = useState<GitHubMember[]>([]);
  const [connected, setConnected] = useState(false);
  const [mapping, setMapping] = useState<MappingState>({ saving: null, errors: {} });

  // ── Slack state ───────────────────────────────────────────────────────────
  const [slackMembers, setSlackMembers] = useState<SlackMember[]>([]);
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackMapping, setSlackMapping] = useState<MappingState>({ saving: null, errors: {} });

  // ── Shared ────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserWithGit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersResult, usersResult, slackResult] = await Promise.allSettled([
        usersService.getGitHubMembers(),
        usersService.listUsers(),
        usersService.getSlackMembers(),
      ]);

      if (membersResult.status === 'fulfilled') {
        setMembers(membersResult.value.members);
        setConnected(membersResult.value.connected);
      }
      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      }
      if (slackResult.status === 'fulfilled') {
        setSlackMembers(slackResult.value.members);
        setSlackConnected(slackResult.value.connected);
      }

      // Only show a page-level error if the users call (critical) failed
      if (usersResult.status === 'rejected') {
        const e = usersResult.reason;
        setError((e as { message?: string })?.message ?? "Failed to load users");
      }
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── GitHub handlers ───────────────────────────────────────────────────────

  const handleMap = async (member: GitHubMember, userId: string) => {
    if (!userId) return;
    setMapping((prev) => ({ ...prev, saving: member.githubUsername }));
    try {
      await usersService.mapGitAccount({
        userId,
        githubUsername: member.githubUsername,
        githubId: member.githubId,
        avatarUrl: member.avatarUrl ?? undefined,
        profileUrl: member.profileUrl ?? undefined,
      });
      const res = await usersService.getGitHubMembers();
      setMembers(res.members);
      setMapping((prev) => {
        const { [member.githubUsername]: _, ...errs } = prev.errors;
        return { saving: null, errors: errs };
      });
    } catch (e: unknown) {
      setMapping((prev) => ({
        saving: null,
        errors: { ...prev.errors, [member.githubUsername]: (e as { message?: string })?.message ?? "Failed to map" },
      }));
    }
  };

  const handleUnmap = async (member: GitHubMember) => {
    if (!member.mappedUserId) return;
    const user = users.find((u) => u.id === member.mappedUserId);
    const gitAccount = user?.gitAccounts.find((ga) => ga.githubUsername === member.githubUsername);
    if (!gitAccount) return;

    setMapping((prev) => ({ ...prev, saving: member.githubUsername }));
    try {
      await usersService.unmapGitAccount(gitAccount.id);
      const [res, usersRes] = await Promise.all([
        usersService.getGitHubMembers(),
        usersService.listUsers(),
      ]);
      setMembers(res.members);
      setUsers(usersRes);
      setMapping((prev) => ({ saving: null, errors: prev.errors }));
    } catch (e: unknown) {
      setMapping((prev) => ({
        saving: null,
        errors: { ...prev.errors, [member.githubUsername]: (e as { message?: string })?.message ?? "Failed to unmap" },
      }));
    }
  };

  // ── Slack handlers ────────────────────────────────────────────────────────

  const handleSlackMap = async (member: SlackMember, userId: string) => {
    if (!userId) return;
    setSlackMapping((prev) => ({ ...prev, saving: member.slackUserId }));
    try {
      await usersService.mapSlackAccount({ userId, slackUserId: member.slackUserId });
      const res = await usersService.getSlackMembers();
      setSlackMembers(res.members);
      setSlackMapping((prev) => {
        const { [member.slackUserId]: _, ...errs } = prev.errors;
        return { saving: null, errors: errs };
      });
    } catch (e: unknown) {
      setSlackMapping((prev) => ({
        saving: null,
        errors: { ...prev.errors, [member.slackUserId]: (e as { message?: string })?.message ?? "Failed to map" },
      }));
    }
  };

  const handleSlackUnmap = async (member: SlackMember) => {
    if (!member.mappedUserId) return;
    setSlackMapping((prev) => ({ ...prev, saving: member.slackUserId }));
    try {
      await usersService.unmapSlackAccount(member.mappedUserId);
      const res = await usersService.getSlackMembers();
      setSlackMembers(res.members);
      setSlackMapping((prev) => ({ saving: null, errors: prev.errors }));
    } catch (e: unknown) {
      setSlackMapping((prev) => ({
        saving: null,
        errors: { ...prev.errors, [member.slackUserId]: (e as { message?: string })?.message ?? "Failed to unmap" },
      }));
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const mappedUser = (userId: string | null) =>
    userId ? users.find((u) => u.id === userId) : undefined;

  return (
    <PageTemplate
      title={t('access.title')}
      description={t('access.description')}
      actions={
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {t('access.refresh')}
        </Button>
      }
    >
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* ── GitHub Card ─────────────────────────────────────────────────────── */}

      {!loading && !connected && (
        <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">{t('access.github.notConnected')}</span>{" "}
            <Trans i18nKey="access.github.connectPrompt" t={t} components={{ link: <a href="/integrations" className="underline font-medium" /> }} />
          </div>
        </div>
      )}

      <Card className="mb-4">
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Github className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">{t('access.github.title')}</h3>
          {connected && (
            <Badge variant="default" className="ml-auto text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {t('access.connected')}
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.github.account')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.columns.mappedUser')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.columns.mapTo')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">{t('access.loading')}</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                    {connected ? t('access.github.noMembers') : t('access.github.connectToSee')}
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const linked = mappedUser(member.mappedUserId);
                  const isSaving = mapping.saving === member.githubUsername;
                  const memberError = mapping.errors[member.githubUsername];

                  return (
                    <tr key={member.githubUsername} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <a
                          href={member.profileUrl ?? `https://github.com/${member.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 group"
                        >
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.githubUsername} className="w-7 h-7 rounded-full border border-gray-200" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                              <Github className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600 group-hover:underline">
                            {member.githubUsername}
                          </span>
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {linked ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{linked.name ?? linked.email}</div>
                              {linked.name && <div className="text-xs text-gray-500">{linked.email}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">{t('access.notMapped')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {memberError && <p className="text-xs text-red-600 mb-1">{memberError}</p>}
                         <select
                           className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 min-w-[180px]"
                           value={member.mappedUserId ?? ""}
                           disabled={isSaving}
                           onChange={(e) => { const uid = e.target.value; if (uid) handleMap(member, uid); }}
                         >
                          <option value="">{t('access.selectUser')}</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name ? `${u.name} (${u.email})` : u.email}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {linked ? (
                            <button
                              onClick={() => handleUnmap(member)}
                              disabled={isSaving}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              <Unlink className="w-3 h-3" />
                              {t('access.unmap')}
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Link2 className="w-3 h-3" />
                              {t('access.notLinked')}
                            </span>
                          )}
                          {isSaving && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && members.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 flex gap-4">
            <span>{t('access.github.accountCount', { count: members.length })}</span>
            <span>{members.filter((m) => m.mappedUserId).length} {t('access.mapped')}</span>
            <span>{members.filter((m) => !m.mappedUserId).length} {t('access.unmapped')}</span>
          </div>
        )}
      </Card>

      {/* ── Slack Card ──────────────────────────────────────────────────────── */}

      {!loading && !slackConnected && (
        <div className="flex items-start gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 mb-4">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium">{t('access.slack.notConnected')}</span>{" "}
            <Trans i18nKey="access.slack.connectPrompt" t={t} components={{ link: <a href="/integrations" className="underline font-medium" /> }} />
          </div>
        </div>
      )}

      <Card>
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <SlackIcon className="w-4 h-4" />
          <h3 className="text-sm font-semibold text-gray-700">{t('access.slack.title')}</h3>
          {slackConnected && (
            <Badge variant="default" className="ml-auto text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {t('access.connected')}
            </Badge>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.slack.account')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.columns.mappedUser')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.columns.mapTo')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('access.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">{t('access.loading')}</td>
                </tr>
              ) : slackMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                    {slackConnected ? t('access.slack.noMembers') : t('access.slack.connectToSee')}
                  </td>
                </tr>
              ) : (
                slackMembers.map((member) => {
                  const linked = mappedUser(member.mappedUserId);
                  const isSaving = slackMapping.saving === member.slackUserId;
                  const memberError = slackMapping.errors[member.slackUserId];

                  return (
                    <tr key={member.slackUserId} className="hover:bg-gray-50">
                      {/* Slack account */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {member.avatarUrl ? (
                            <img src={member.avatarUrl} alt={member.displayName} className="w-7 h-7 rounded-full border border-gray-200" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                              <SlackIcon className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{member.displayName}</div>
                            <div className="text-xs text-gray-400">
                              @{member.slackUserName}
                              {member.email && <span> · {member.email}</span>}
                              {member.isAdmin && <span className="ml-1 text-purple-600 font-medium">· Admin</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mapped ISMS user */}
                      <td className="px-6 py-4">
                        {linked ? (
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{linked.name ?? linked.email}</div>
                              {linked.name && <div className="text-xs text-gray-500">{linked.email}</div>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">{t('access.notMapped')}</span>
                        )}
                      </td>

                      {/* Map to user dropdown */}
                      <td className="px-6 py-4">
                        {memberError && <p className="text-xs text-red-600 mb-1">{memberError}</p>}
                         <select
                           className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 min-w-[180px]"
                           value={member.mappedUserId ?? ""}
                           disabled={isSaving}
                           onChange={(e) => { const uid = e.target.value; if (uid) handleSlackMap(member, uid); }}
                         >
                          <option value="">{t('access.selectUser')}</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name ? `${u.name} (${u.email})` : u.email}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {linked ? (
                            <button
                              onClick={() => handleSlackUnmap(member)}
                              disabled={isSaving}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
                            >
                              <Unlink className="w-3 h-3" />
                              {t('access.unmap')}
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Link2 className="w-3 h-3" />
                              {t('access.notLinked')}
                            </span>
                          )}
                          {isSaving && <RefreshCw className="w-3 h-3 animate-spin text-purple-500" />}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && slackMembers.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 flex gap-4">
            <span>{t('access.slack.accountCount', { count: slackMembers.length })}</span>
            <span>{slackMembers.filter((m) => m.mappedUserId).length} {t('access.mapped')}</span>
            <span>{slackMembers.filter((m) => !m.mappedUserId).length} {t('access.unmapped')}</span>
          </div>
        )}
      </Card>
    </PageTemplate>
  );
}
