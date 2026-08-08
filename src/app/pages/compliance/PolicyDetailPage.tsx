import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Edit3,
  FileText,
  Hourglass,
  Layers,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { QK } from '@/lib/queryKeys';
import { policiesService } from '@/services/api/policies';
import { controlsService } from '@/services/api/controls';
import { usersService } from '@/services/api/users';
import { PolicyEditor } from '@/app/components/compliance/PolicyEditor';
import { PolicyPreviewSheet } from '@/app/components/compliance/PolicyPreviewSheet';
import { PolicyVersionDiff } from '@/app/components/compliance/PolicyVersionDiff';
import { PublishPolicyDialog } from '@/app/components/compliance/PublishPolicyDialog';
import { RenewPolicyDialog } from '@/app/components/compliance/RenewPolicyDialog';
import { ReassignOwnerDialog } from '@/app/components/compliance/ReassignOwnerDialog';
import { PolicyCommentsTab } from '@/app/pages/compliance/policies/CommentsTab';
import { PolicyAuditsTab } from '@/app/pages/compliance/policies/AuditsTab';
import { UploadModal } from '@/app/pages/compliance/policies/UploadModal';
import type {
  Control,
  PolicyApprovalRecord,
  PolicyVersion,
} from '@/services/api/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

// `labelKey` rather than a literal: the badge text is display-only, so it is
// safe to translate — unlike the enum values it is keyed by, which are wire
// values and must stay untouched.
const STATUS_STYLES: Record<string, { labelKey: string; cls: string }> = {
  PUBLISHED: {
    labelKey: 'PUBLISHED',
    cls: 'bg-green-50 text-green-700 border-green-200',
  },
  DRAFT: { labelKey: 'DRAFT', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
  REVIEW: {
    labelKey: 'REVIEW',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  ARCHIVED: {
    labelKey: 'ARCHIVED',
    cls: 'bg-red-50 text-red-700 border-red-200',
  },
};

function renewCadenceLabel(
  months: number | null | undefined,
  t: TFunction,
): string | null {
  if (!months || months <= 0) return null;
  if (months === 12) return t('policyDetail.cadence.annually');
  if (months === 1) return t('policyDetail.cadence.monthly');
  if (months % 12 === 0)
    return t('policyDetail.cadence.everyYears', { count: months / 12 });
  return t('policyDetail.cadence.everyMonths', { count: months });
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [editLocale, setEditLocale] = useState<'en' | 'ja'>('en');
  const [previewTarget, setPreviewTarget] = useState<{
    versionId?: string;
    locale: 'en' | 'ja';
    documentUrl: string;
    title: string;
  } | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{
    locale: 'en' | 'ja';
    title: string;
  } | null>(null);
  const [diffVersion, setDiffVersion] = useState<PolicyVersion | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [controlPickerOpen, setControlPickerOpen] = useState(false);
  const [selectedApproverIds, setSelectedApproverIds] = useState<string[]>([]);
  const [recurrenceMonths, setRecurrenceMonths] = useState('');
  const { t } = useTranslation('compliance');
  const me = useCurrentUser();
  const preferredLocale = me?.preferredLocale === 'ja' ? 'ja' : 'en';
  // Dates were pinned to 'en-US' throughout, so a Japanese user saw
  // "Aug 8, 2026" on an otherwise translated page. Follow preferredLocale,
  // the same setting that already picks the policy body language.
  const dateLocale = preferredLocale === 'ja' ? 'ja-JP' : 'en-US';

  const { data: policyRes, isLoading } = useQuery({
    queryKey: QK.policyDetail(id ?? ''),
    queryFn: () => policiesService.getPolicy(id!),
    enabled: !!id,
  });

  const { data: versionsRes } = useQuery({
    queryKey: QK.policyVersions(id ?? ''),
    queryFn: () => policiesService.getVersions(id!),
    enabled: !!id,
  });

  const { data: approvalsRes } = useQuery({
    queryKey: QK.policyApprovals(id ?? ''),
    queryFn: () => policiesService.getApprovals(id!),
    enabled: !!id,
  });

  const { data: acceptancesRes } = useQuery({
    queryKey: QK.policyAcceptances(id ?? ''),
    queryFn: () => policiesService.getAcceptances(id!),
    enabled: !!id,
  });

  const { data: users = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: () => usersService.listUsers(),
    enabled: !!id,
  });

  const policy = policyRes?.data;
  const versions = versionsRes?.data ?? [];
  const approvals = approvalsRes?.data ?? [];
  const acceptances = acceptancesRes?.data ?? [];

  const currentVersionNumber = policy?.versionNumber ?? 1;
  const currentVersion = versions.find(
    (v) => v.versionNumber === currentVersionNumber,
  );
  const olderVersions = versions.filter(
    (v) => v.versionNumber !== currentVersionNumber,
  );

  // Display the policy name in the user's preferred locale when the backend
  // has provided a translation; fall back to canonical name otherwise.
  const displayName =
    policy?.localizedName?.[preferredLocale] ?? policy?.name ?? '';

  const linkedControls = useMemo(
    () =>
      (policy?.controlMappings ?? [])
        .map((mapping) => mapping.control)
        .filter(Boolean),
    [policy?.controlMappings],
  );
  const linkedControlIds = useMemo(
    () =>
      new Set(
        (policy?.controlMappings ?? []).map((mapping) => mapping.controlId),
      ),
    [policy?.controlMappings],
  );

  const currentJapaneseLocale =
    currentVersion?.locales?.find((locale) => locale.locale === 'ja') ?? null;

  const invalidatePolicy = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: QK.policyDetail(id ?? '') }),
      qc.invalidateQueries({ queryKey: QK.policyVersions(id ?? '') }),
      qc.invalidateQueries({ queryKey: QK.policyApprovals(id ?? '') }),
      qc.invalidateQueries({ queryKey: QK.policyAcceptances(id ?? '') }),
      qc.invalidateQueries({ queryKey: ['policies'] }),
      qc.invalidateQueries({ queryKey: QK.myPolicyAcceptances() }),
    ]);
  };

  const requestApprovalMutation = useMutation({
    mutationFn: (approverIds: string[]) =>
      policiesService.requestApproval(id!, approverIds),
    onSuccess: async () => {
      toast.success(t('policyDetail.toast.approvalRequested'));
      setSelectedApproverIds([]);
      await invalidatePolicy();
    },
    onError: (error) =>
      toast.error(
        errorMessage(error, t('policyDetail.toast.approvalRequestFailed')),
      ),
  });

  const respondApprovalMutation = useMutation({
    mutationFn: ({
      approvalId,
      status,
      comment,
    }: {
      approvalId: string;
      status: 'APPROVED' | 'REJECTED';
      comment?: string;
    }) =>
      policiesService.respondToApproval(id!, approvalId, {
        status,
        ...(comment ? { comment } : {}),
      }),
    onSuccess: async (_, variables) => {
      toast.success(
        t(
          variables.status === 'APPROVED'
            ? 'policyDetail.toast.approvalRecorded'
            : 'policyDetail.toast.rejectionRecorded',
        ),
      );
      await invalidatePolicy();
    },
    onError: (error) =>
      toast.error(
        errorMessage(error, t('policyDetail.toast.approvalUpdateFailed')),
      ),
  });

  const recurrenceMutation = useMutation({
    mutationFn: (months: number) =>
      policiesService.setRecurrence(id!, { recurrenceMonths: months }),
    onSuccess: async () => {
      toast.success(t('policyDetail.toast.cadenceUpdated'));
      await invalidatePolicy();
    },
    onError: (error) =>
      toast.error(
        errorMessage(error, t('policyDetail.toast.cadenceUpdateFailed')),
      ),
  });

  const reassignOwnerMutation = useMutation({
    mutationFn: (ownerId: string | null) =>
      policiesService.updatePolicy(id!, { ownerId: ownerId ?? undefined }),
    onSuccess: async () => {
      toast.success(t('policyDetail.toast.ownerUpdated'));
      await invalidatePolicy();
    },
    onError: (error) =>
      toast.error(
        errorMessage(error, t('policyDetail.toast.ownerUpdateFailed')),
      ),
  });

  const linkControlMutation = useMutation({
    mutationFn: (controlId: string) =>
      policiesService.linkControl(id!, controlId),
    onSuccess: async () => {
      toast.success(t('policyDetail.toast.controlLinked'));
      setControlPickerOpen(false);
      await invalidatePolicy();
    },
    onError: (error) =>
      toast.error(
        errorMessage(error, t('policyDetail.toast.controlLinkFailed')),
      ),
  });

  const unlinkControlMutation = useMutation({
    mutationFn: (controlId: string) =>
      policiesService.unlinkControl(id!, controlId),
    onSuccess: async () => {
      toast.success(t('policyDetail.toast.controlRemoved'));
      await invalidatePolicy();
    },
    onError: (error) =>
      toast.error(
        errorMessage(error, t('policyDetail.toast.controlRemoveFailed')),
      ),
  });

  if (!id) return null;

  if (isLoading || !policy) {
    return (
      <PageTemplate title={t('policyDetail.loadingTitle')} description="">
        <div className="flex h-48 items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageTemplate>
    );
  }

  const status = STATUS_STYLES[policy.status] ?? STATUS_STYLES.DRAFT!;
  const approvedOn = currentVersion?.publishedAt
    ? new Date(currentVersion.publishedAt)
    : policy.approvedAt
      ? new Date(policy.approvedAt)
      : null;
  const cadenceLabel = renewCadenceLabel(policy.recurrenceMonths ?? null, t);
  const frameworksCount = policy.frameworksCount ?? 0;
  const canEditLocalizedVersion =
    policy.status === 'PUBLISHED' && Boolean(currentVersion);
  const localizedVersionHelp = canEditLocalizedVersion
    ? null
    : policy.status === 'PUBLISHED'
      ? t('policyDetail.help.noSnapshot')
      : t('policyDetail.help.publishFirst');

  return (
    <>
      <PolicyEditor
        open={editOpen}
        policy={policy}
        locale={editLocale}
        initialContent={
          editLocale === 'ja' ? currentJapaneseLocale?.content : undefined
        }
        onClose={() => setEditOpen(false)}
        onSaved={async () => {
          await invalidatePolicy();
          setEditOpen(false);
        }}
      />

      {previewTarget ? (
        <PolicyPreviewSheet
          policyId={policy.id}
          policyName={previewTarget.title}
          documentUrl={previewTarget.documentUrl}
          versionId={previewTarget.versionId}
          locale={previewTarget.locale}
          onClose={() => setPreviewTarget(null)}
          onDownload={() => {
            setPreviewTarget(null);
            void policiesService
              .downloadPolicyDocument(policy.id, `${previewTarget.title}.pdf`, {
                versionId: previewTarget.versionId,
                locale: previewTarget.locale,
              })
              .catch((error) =>
                toast.error(
                  errorMessage(error, t('policyDetail.toast.downloadFailed')),
                ),
              );
          }}
        />
      ) : null}

      {uploadTarget ? (
        <UploadModal
          policy={policy}
          locale={uploadTarget.locale}
          title={uploadTarget.title}
          onClose={() => setUploadTarget(null)}
          onUploaded={async () => {
            await invalidatePolicy();
            setUploadTarget(null);
          }}
        />
      ) : null}

      {diffVersion && currentVersion ? (
        <PolicyVersionDiff
          base={diffVersion}
          compare={currentVersion}
          onClose={() => setDiffVersion(null)}
        />
      ) : null}

      <ControlPickerDialog
        open={controlPickerOpen}
        linkedControlIds={linkedControlIds}
        pending={linkControlMutation.isPending}
        onClose={() => setControlPickerOpen(false)}
        onSelect={(controlId) => linkControlMutation.mutate(controlId)}
      />

      <PublishPolicyDialog
        open={publishOpen}
        policyId={policy.id}
        nextVersion={
          policy.status === 'PUBLISHED'
            ? currentVersionNumber + 1
            : currentVersionNumber
        }
        onClose={() => setPublishOpen(false)}
        onSubmit={async (data) => {
          try {
            const resp = await policiesService.updatePolicy(policy.id, {
              status: 'PUBLISHED',
              ...data,
            });
            toast.success(t('policyDetail.toast.published'));

            // [T-91] Surface role-exempt users (e.g. Auditors) who don't receive an acceptance task.
            const skipped = resp.skippedUsers ?? [];
            if (skipped.length > 0) {
              const names = skipped
                .slice(0, 3)
                .map((u) => u.name ?? u.role)
                .join(', ');
              const suffix =
                skipped.length > 3
                  ? t('policyDetail.toast.skippedMore', {
                      count: skipped.length - 3,
                    })
                  : '';
              toast.info(
                t('policyDetail.toast.skipped', {
                  count: skipped.length,
                  names,
                  suffix,
                }),
                {
                  description: t('policyDetail.toast.skippedDescription'),
                  duration: 8000,
                },
              );
            }

            await invalidatePolicy();
          } catch (error: unknown) {
            // R2 — surface the publish-gate 409 codes from the backend.
            const message =
              error instanceof Error
                ? error.message
                : t('policyDetail.toast.publishFailed');
            if (message.includes('PUBLISH_BLOCKED_BY_REJECTION')) {
              toast.error(t('policyDetail.toast.blockedByRejection'), {
                description: t(
                  'policyDetail.toast.blockedByRejectionDescription',
                ),
              });
            } else if (message.includes('PUBLISH_BLOCKED_BY_PENDING')) {
              toast.error(t('policyDetail.toast.blockedByPending'), {
                description: t(
                  'policyDetail.toast.blockedByPendingDescription',
                ),
              });
            } else {
              toast.error(message);
            }
            throw error;
          }
        }}
      />

      <RenewPolicyDialog
        open={renewOpen}
        onClose={() => setRenewOpen(false)}
        onSubmit={async (mode) => {
          await policiesService.renewPolicy(policy.id, mode);
          toast.success(t('policyDetail.toast.renewed'));
          await invalidatePolicy();
        }}
      />

      <ReassignOwnerDialog
        open={reassignOpen}
        currentOwnerId={policy.ownerId ?? null}
        onClose={() => setReassignOpen(false)}
        onSubmit={async (ownerId) => {
          await reassignOwnerMutation.mutateAsync(ownerId);
        }}
      />

      <PageTemplate
        title={displayName}
        description={policy.description ?? t('policyDetail.pageDescription')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/compliance/policies')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('policyDetail.actions.back')}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={t('policyDetail.actions.more')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setPublishOpen(true)}
                  disabled={policy.status === 'PUBLISHED'}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('policyDetail.actions.publish')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setRenewOpen(true)}
                  disabled={policy.status !== 'PUBLISHED'}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {t('policyDetail.actions.renew')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    void policiesService
                      .downloadPolicyDocument(policy.id, `${displayName}.pdf`, {
                        locale: preferredLocale,
                        onLocaleFallback: () =>
                          toast.info(
                            t('policyDetail.toast.japaneseUnavailable'),
                          ),
                      })
                      .catch((error) =>
                        toast.error(
                          errorMessage(
                            error,
                            t('policyDetail.toast.downloadFailed'),
                          ),
                        ),
                      )
                  }
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t('policyDetail.actions.download')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-700"
                  disabled
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('policyDetail.actions.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setReassignOpen(true)}
              aria-label={t('policyDetail.actions.reassignOwner')}
              title={
                policy.owner
                  ? t('policyDetail.actions.ownerTitle', {
                      name: policy.owner.name ?? policy.owner.email,
                    })
                  : t('policyDetail.actions.reassignOwner')
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <UserCog className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditLocale('en');
                setEditOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Edit3 className="h-4 w-4" />
              {t('policyDetail.actions.editDetails')}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Vanta-style status pills row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${status.cls}`}
            >
              <CheckCircle2 className="h-3 w-3" />
              {t(`policyDetail.status.${status.labelKey}`)}
            </span>
            {cadenceLabel && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
                <RefreshCw className="h-3 w-3" />
                {cadenceLabel}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700">
              <Layers className="h-3 w-3" />
              {t('policyDetail.frameworksCount', { count: frameworksCount })}
            </span>
          </div>

          <Tabs defaultValue="versions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="versions">
                {t('policyDetail.tabs.versions')}
              </TabsTrigger>
              <TabsTrigger value="controls">
                {t('policyDetail.tabs.controls')}{' '}
                {linkedControls.length > 0 ? linkedControls.length : ''}
              </TabsTrigger>
              <TabsTrigger value="audits">
                {t('policyDetail.tabs.audits')}
              </TabsTrigger>
              <TabsTrigger value="comments">
                {t('policyDetail.tabs.comments')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="space-y-3">
              {/* Renew before card */}
              {policy.renewalDate ? (
                <Collapsible defaultOpen={false}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left">
                    <div className="flex items-center gap-3">
                      <Hourglass className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {t('policyDetail.renewal.renewBefore', {
                          date: new Date(policy.renewalDate).toLocaleDateString(
                            dateLocale,
                            {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            },
                          ),
                        })}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="rounded-b-2xl border border-t-0 border-border bg-card px-4 pb-4 pt-0">
                    <div className="space-y-3 pt-3 text-sm text-foreground">
                      <p className="text-muted-foreground">
                        {t('policyDetail.renewal.lastRenewed', {
                          date: policy.lastRenewedAt
                            ? new Date(policy.lastRenewedAt).toLocaleDateString(
                                dateLocale,
                              )
                            : '—',
                        })}
                      </p>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {t('policyDetail.renewal.reviewCadence')}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            placeholder={
                              policy.recurrenceMonths
                                ? String(policy.recurrenceMonths)
                                : '12'
                            }
                            value={recurrenceMonths}
                            onChange={(event) =>
                              setRecurrenceMonths(event.target.value)
                            }
                            className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          />
                          <span className="text-sm text-muted-foreground">
                            {t('policyDetail.renewal.months')}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              recurrenceMutation.mutate(
                                Number(recurrenceMonths),
                              )
                            }
                            disabled={
                              recurrenceMutation.isPending ||
                              Number(recurrenceMonths) <= 0
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            {recurrenceMutation.isPending
                              ? t('policyDetail.renewal.saving')
                              : t('policyDetail.renewal.setCadence')}
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRenewOpen(true)}
                        disabled={policy.status !== 'PUBLISHED'}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <RefreshCw className="h-4 w-4" />
                        {t('policyDetail.renewal.renewNow')}
                      </button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}

              {/* Approved version card */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {policy.status === 'PUBLISHED'
                          ? t('policyDetail.versions.approvedVersion', {
                              date: approvedOn
                                ? approvedOn.toLocaleDateString(dateLocale, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : '—',
                            })
                          : t('policyDetail.versions.currentDraft')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        v{currentVersionNumber}
                        {currentVersion?.changelog
                          ? ` · ${currentVersion.changelog}`
                          : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent className="rounded-b-2xl border border-t-0 border-border bg-card px-4 pb-4 pt-3">
                  {/* Single locale row chosen from the user's preferredLocale
                      setting (Settings → Profile → Language). The row title
                      uses the policy file name; the per-locale qualifiers
                      "English (default)" / "Japanese" are dropped. */}
                  {preferredLocale === 'ja' ? (
                    <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {currentJapaneseLocale
                              ? t('policyDetail.versions.lastEditedBy', {
                                  name:
                                    policy.owner?.name ??
                                    policy.owner?.email ??
                                    '—',
                                })
                              : t('policyDetail.versions.noJapaneseVersion')}
                          </p>
                          {localizedVersionHelp ? (
                            <p className="mt-1 text-xs text-amber-700">
                              {localizedVersionHelp}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentJapaneseLocale ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewTarget({
                                versionId: currentVersion?.id,
                                locale: 'ja',
                                documentUrl:
                                  currentJapaneseLocale.documentUrl ??
                                  currentJapaneseLocale.pdfUrl ??
                                  `${policy.name}-ja`,
                                title: displayName,
                              })
                            }
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {t('policyDetail.versions.view')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setEditLocale('ja');
                            setEditOpen(true);
                          }}
                          disabled={!canEditLocalizedVersion}
                          title={localizedVersionHelp ?? undefined}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {currentJapaneseLocale
                            ? t('policyDetail.versions.edit')
                            : t('policyDetail.versions.addJapanese')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadTarget({
                              locale: 'ja',
                              title: t(
                                'policyDetail.versions.uploadJapaneseTitle',
                              ),
                            })
                          }
                          disabled={!canEditLocalizedVersion}
                          title={localizedVersionHelp ?? undefined}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          {t('policyDetail.versions.upload')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-muted/20 p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('policyDetail.versions.lastEditedBy', {
                              name:
                                policy.owner?.name ??
                                policy.owner?.email ??
                                '—',
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewTarget({
                            versionId: currentVersion?.id,
                            locale: 'en',
                            documentUrl:
                              currentVersion?.documentUrl ??
                              currentVersion?.pdfUrl ??
                              policy.documentUrl ??
                              `${policy.name}-en`,
                            title: displayName,
                          })
                        }
                        disabled={
                          !policy.documentUrl &&
                          !policy.pdfUrl &&
                          !currentVersion?.documentUrl &&
                          !currentVersion?.pdfUrl &&
                          !currentVersion?.content
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {t('policyDetail.versions.view')}
                      </button>
                    </div>
                  )}

                  {/* Show approval expand */}
                  <Collapsible className="mt-3">
                    <CollapsibleTrigger className="text-sm font-medium text-blue-600 hover:text-blue-700">
                      {t('policyDetail.versions.showApproval')}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4">
                      {/* Approvals */}
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('policyDetail.versions.approvers')}
                        </p>
                        <div className="space-y-2">
                          <select
                            multiple
                            value={selectedApproverIds}
                            onChange={(event) => {
                              const next = Array.from(
                                event.target.selectedOptions,
                              ).map((option) => option.value);
                              setSelectedApproverIds(next);
                            }}
                            className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          >
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name || user.email}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              requestApprovalMutation.mutate(
                                selectedApproverIds,
                              )
                            }
                            disabled={
                              requestApprovalMutation.isPending ||
                              selectedApproverIds.length === 0
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {requestApprovalMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Users className="h-4 w-4" />
                            )}
                            {t('policyDetail.versions.requestApproval')}
                          </button>
                        </div>
                        <div className="mt-3 space-y-2">
                          {approvals.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {t('policyDetail.versions.noApprovalRequests')}
                            </p>
                          ) : (
                            approvals.map((approval) => (
                              <ApprovalRow
                                key={approval.id}
                                approval={approval}
                                isMine={approval.approverId === me?.id}
                                pending={respondApprovalMutation.isPending}
                                onRespond={(status, comment) =>
                                  respondApprovalMutation.mutate({
                                    approvalId: approval.id,
                                    status,
                                    comment,
                                  })
                                }
                              />
                            ))
                          )}
                        </div>
                      </div>

                      {/* Acceptances */}
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {t('policyDetail.versions.acceptances')}
                        </p>
                        <div className="space-y-2">
                          {acceptances.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {t('policyDetail.versions.noAcceptanceRequests')}
                            </p>
                          ) : (
                            acceptances.map((acceptance) => (
                              <div
                                key={acceptance.id}
                                className="rounded-xl border border-border p-3"
                              >
                                <p className="text-sm font-medium text-foreground">
                                  {acceptance.user?.name ||
                                    acceptance.user?.email}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {acceptance.status}
                                  {acceptance.acceptedAt
                                    ? ` · ${new Date(acceptance.acceptedAt).toLocaleString(dateLocale)}`
                                    : ''}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CollapsibleContent>
              </Collapsible>

              {/* Version history card */}
              {olderVersions.length > 0 ? (
                <Collapsible defaultOpen={false}>
                  <CollapsibleTrigger className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {t('policyDetail.versions.history', {
                          count: olderVersions.length,
                        })}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="rounded-b-2xl border border-t-0 border-border bg-card px-4 pb-4 pt-0">
                    <div className="space-y-2 pt-3">
                      {olderVersions.map((version) => (
                        <div
                          key={version.id}
                          className="rounded-xl border border-border p-3"
                        >
                          <p className="text-sm font-medium text-foreground">
                            v{version.versionNumber}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('policyDetail.versions.publishedByOn', {
                              date: new Date(
                                version.publishedAt,
                              ).toLocaleDateString(dateLocale),
                              name: version.publishedBy,
                            })}
                          </p>
                          {version.changelog ? (
                            <p className="mt-2 text-sm text-foreground">
                              {version.changelog}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setDiffVersion(version)}
                            className="mt-3 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            {t('policyDetail.versions.compareTo', {
                              version: currentVersionNumber,
                            })}
                          </button>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </TabsContent>

            <TabsContent value="controls" className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('policyDetail.controls.linked')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setControlPickerOpen(true)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('policyDetail.controls.add')}
                  </button>
                </div>
                <div className="space-y-2">
                  {linkedControls.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                      {t('policyDetail.controls.none')}
                    </div>
                  ) : (
                    linkedControls.map((control) => (
                      <div
                        key={control!.id}
                        className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {control!.isoReference ||
                              t('policyDetail.controls.fallbackReference')}{' '}
                            · {control!.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {control!.status}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              unlinkControlMutation.mutate(control!.id)
                            }
                            disabled={unlinkControlMutation.isPending}
                            className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title={t('policyDetail.controls.remove')}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* R3a — Risks treated by this policy */}
              <PolicyTreatmentRisksSection policyId={policy.id} />
            </TabsContent>

            <TabsContent value="audits">
              <PolicyAuditsTab policyId={policy.id} />
            </TabsContent>

            <TabsContent value="comments">
              <PolicyCommentsTab
                policyId={policy.id}
                versions={versions.map((v) => ({
                  id: v.id,
                  versionNumber: v.versionNumber,
                }))}
              />
            </TabsContent>
          </Tabs>
        </div>
      </PageTemplate>
    </>
  );
}

// R3a — "Risks treated by this policy" section in the Controls tab.
function PolicyTreatmentRisksSection({ policyId }: { policyId: string }) {
  const { t } = useTranslation('compliance');
  const { data } = useQuery({
    queryKey: QK.policyTreatmentRisks(policyId),
    queryFn: () => policiesService.listTreatmentRisks(policyId),
  });
  const links = data?.data ?? [];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('policyDetail.risks.heading')}
      </p>
      {links.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {t('policyDetail.risks.none')}
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.id}
              to={`/risk/risks/${link.risk.id}`}
              className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {link.risk.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t('policyDetail.risks.meta', {
                    status: link.risk.status,
                    impact: link.risk.impact,
                    likelihood: link.risk.likelihood,
                    score: link.risk.riskScore,
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ControlPickerDialog({
  open,
  linkedControlIds,
  pending,
  onClose,
  onSelect,
}: {
  open: boolean;
  linkedControlIds: Set<string>;
  pending: boolean;
  onClose: () => void;
  onSelect: (controlId: string) => void;
}) {
  const { t } = useTranslation('compliance');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['controls', 'policy-picker', search],
    queryFn: () => controlsService.getControls({ search, limit: 50 }),
    enabled: open,
  });

  if (!open) return null;

  const visibleControls = data?.data ?? [];
  const controls = visibleControls.filter(
    (control: Control) => !linkedControlIds.has(control.id),
  );
  const emptyMessage = search.trim()
    ? t('policyDetail.controls.noMatching')
    : visibleControls.length > 0
      ? t('policyDetail.controls.allLinked')
      : t('policyDetail.controls.unavailable');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[80vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900">
            {t('policyDetail.controls.add')}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label={t('policyDetail.controls.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="border-b border-gray-100 p-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('policyDetail.controls.search')}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-24 items-center justify-center text-sm text-gray-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('policyDetail.controls.loading')}
            </div>
          ) : controls.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-2">
              {controls.map((control: Control) => (
                <button
                  key={control.id}
                  type="button"
                  onClick={() => onSelect(control.id)}
                  disabled={pending}
                  className="block w-full rounded-lg border border-gray-200 p-3 text-left hover:bg-gray-50 disabled:opacity-50"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {control.isoReference ||
                      t('policyDetail.controls.fallbackReference')}{' '}
                    · {control.title}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{control.status}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// R2 — Per-approval row. When the assigned approver clicks Reject, expand a
// required comment textarea before submitting (backend rejects empty comments
// on REJECTED with a 400).
function ApprovalRow({
  approval,
  isMine,
  pending,
  onRespond,
}: {
  approval: PolicyApprovalRecord;
  isMine: boolean;
  pending: boolean;
  onRespond: (status: 'APPROVED' | 'REJECTED', comment?: string) => void;
}) {
  const { t } = useTranslation('compliance');
  const [rejecting, setRejecting] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-sm font-medium text-foreground">
        {approval.approver?.name || approval.approver?.email}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('policyDetail.approval.round', {
          round: approval.approvalRound,
          status: approval.status,
        })}
      </p>
      {approval.comment ? (
        <p className="mt-2 text-sm text-foreground">{approval.comment}</p>
      ) : null}

      {approval.status === 'PENDING' && isMine ? (
        rejecting ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('policyDetail.approval.rejectionReason')}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!comment.trim()) return;
                  onRespond('REJECTED', comment.trim());
                  setRejecting(false);
                  setComment('');
                }}
                disabled={pending || !comment.trim()}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t('policyDetail.approval.confirmRejection')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejecting(false);
                  setComment('');
                }}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                {t('policyDetail.approval.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onRespond('APPROVED')}
              disabled={pending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {t('policyDetail.approval.approve')}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              disabled={pending}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {t('policyDetail.approval.reject')}
            </button>
          </div>
        )
      ) : null}
    </div>
  );
}
