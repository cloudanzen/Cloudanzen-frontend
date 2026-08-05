import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  X,
  CheckCircle,
  FileText,
  Zap,
  RefreshCw,
  Wrench,
  ClipboardCheck,
} from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import { usersService } from '@/services/api/users';
import { authService } from '@/services/api/auth';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import type { TestRecord } from '@/services/api/tests';

// ─── Sub-module imports ───────────────────────────────────────────────────────
import { dispatchScan, getProviderLabel } from './testDetail/scanRegistry';
import {
  CATEGORY_COLOR,
  ADMIN_ROLES,
  AUDIT_REVIEW_ROLES,
} from './testDetail/constants';
import { fmtDate, fmtDateTime } from '@/lib/format-date';
import { StatusBadge, LastResultBadge } from './testDetail/StatusBadge';
import { ValidationOwnerChip } from '@/app/pages/validationsPage/ValidationOwnerChip';
import { ActivityTab } from './testDetail/ActivityTab';

import { EvidenceTab } from './testDetail/EvidenceTab';
import { MappingTab } from './testDetail/MappingTab';
import { Section, DetailStatCard } from './testDetail/Section';

import {
  NotionPanelIcon,
  CreateNotionTaskModal,
} from './testDetail/CreateNotionTaskModal';

import { DocumentUploadModal } from './testDetail/DocumentUploadModal';
import { RemediationGuide } from './testDetail/RemediationGuide';
import { PolicyLinkedTestLifecycle } from './testDetail/PolicyLinkedTestLifecycle';

import { ReassignValidationOwnerDialog } from '@/app/pages/validationsPage/ReassignValidationOwnerDialog';

// ─── Main panel ───────────────────────────────────────────────────────────────

interface TestDetailPanelProps {
  testId: string;
  onClose?: () => void;
  onMutated?: () => void;
  /** When true, renders as a full page instead of a slide-over panel */
  pageMode?: boolean;
}

export function TestDetailPanel({
  testId,
  onClose,
  onMutated,
  pageMode = false,
}: TestDetailPanelProps) {
  const { t } = useTranslation('tests');
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionTaskUrl, setNotionTaskUrl] = useState<string | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showOwnerDialog, setShowOwnerDialog] = useState(false);

  function handleClose() {
    if (onClose) {
      onClose();
    } else if (pageMode) {
      navigate(-1);
    }
  }

  const currentUser = authService.getCachedUser();
  const isAdmin = ADMIN_ROLES.includes(currentUser?.role ?? '');
  const isReviewer = AUDIT_REVIEW_ROLES.includes(currentUser?.role ?? '');

  // Load org users for owner picker (only for admins)
  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      return usersService.listUsers();
    },
    staleTime: STALE.USERS,
    enabled: Boolean(currentUser?.id),
  });

  const {
    data: test,
    isLoading,
    isError,
  } = useQuery({
    queryKey: QK.testDetail(testId),
    queryFn: async () => {
      const res = await testsService.getTest(testId);
      if (res.success && res.data) return res.data as TestRecord;
      throw new Error(t('testDetail.failedToLoad'));
    },
    staleTime: STALE.TESTS,
  });

  const { data: unifiedEvidence = [] } = useQuery({
    queryKey: ['tests', 'unified-evidence', testId],
    queryFn: async () => {
      const res = await testsService.listUnifiedEvidence();
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr.filter((item) => item.testId === testId);
    },
    staleTime: STALE.TESTS,
    enabled: !!test && test.type !== 'Document',
  });

  const { data: securityEvents = [] } = useQuery({
    queryKey: ['tests', 'security-events', testId],
    queryFn: async () => {
      const res = await testsService.listSecurityEvents();
      const arr = Array.isArray(res.data) ? res.data : [];
      return arr.filter((item) => item.testId === testId);
    },
    staleTime: STALE.TESTS,
    enabled: !!test && test.type !== 'Document',
  });

  const completeMutation = useMutation({
    mutationFn: () => testsService.completeTest(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      onMutated?.();
    },
  });

  // Cloudanzen-internal automated tests (currently the policy-acceptance
  // catalog test) are evaluated server-side, not via an external provider
  // scan. Route those through the dedicated /api/tests/:id/run endpoint
  // instead of dispatchScan, which has no provider mapping for them.
  const isInternalAutomatedTest =
    test?.type === 'Automated' &&
    !!test?.testKey &&
    test.testKey.endsWith('cloudanzen.policy-acceptance-complete');

  const runMutation = useMutation({
    mutationFn: async () => {
      if (isInternalAutomatedTest) {
        await testsService.runTest(testId);
        return;
      }
      const provider = test?.integration?.provider ?? '';
      const meta = (test?.integration?.metadata ?? {}) as Record<
        string,
        string
      >;
      return dispatchScan(provider, meta);
    },
    onSuccess: () => {
      setRunMsg(t('testDetail.overview.scanTriggered'));
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: QK.testRuns(testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      setTimeout(() => {
        setRunMsg(null);
      }, 4000);
    },
    onError: () => {
      setRunMsg(t('testDetail.overview.scanFailed'));
      setTimeout(() => setRunMsg(null), 3000);
    },
  });

  const reassignOwner = useMutation({
    mutationFn: (ownerId: string) =>
      testsService.updateTest(testId, { ownerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      toast.success(t('validationsPage.reassignDialog.success'));
      setShowOwnerDialog(false);
      onMutated?.();
    },
    onError: () => {
      toast.error(t('validationsPage.reassignDialog.error'));
    },
  });

  const detachEvidence = useMutation({
    mutationFn: (evidenceId: string) =>
      testsService.detachEvidence(testId, evidenceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const detachControl = useMutation({
    mutationFn: (controlId: string) =>
      testsService.detachControl(testId, controlId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const detachFramework = useMutation({
    mutationFn: (fwId: string) => testsService.detachFramework(testId, fwId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const requestAttestationMutation = useMutation({
    mutationFn: (reviewerId: string) =>
      testsService.requestAttestation(testId, reviewerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const signAttestationMutation = useMutation({
    mutationFn: (reviewerId: string) =>
      testsService.signAttestation(testId, reviewerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.testDetail(testId) }),
  });

  const autoRemediateMutation = useMutation({
    mutationFn: () => testsService.autoRemediate(testId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: QK.testRuns(testId) });
    },
  });

  const isAutomated = test?.type === 'Automated';
  const isSystemDriven =
    test?.type === 'Automated' || test?.type === 'Pipeline';
  const providerLabel = test?.integration?.provider
    ? getProviderLabel(test.integration.provider)
    : null;
  const isOwner = currentUser?.id != null && currentUser.id === test?.ownerId;
  const canEditTest = isAdmin || isOwner;
  const canReassignOwner = Boolean(
    test && canEditTest && usersData && usersData.length > 0,
  );
  const isPolicyLinked = Boolean(test?.policyId);
  const policyTitle = test?.policy?.name ?? test?.name;
  const handleOpenPolicy = () => {
    if (test?.policyId) {
      navigate(`/compliance/policies/${test.policyId}`);
    }
  };
  const canAttest = Boolean(
    test && isReviewer && currentUser?.id && currentUser.id !== test.ownerId,
  );

  // Suppress unused variable warning — isAutomated is available for future use
  void isAutomated;

  // Show "Mark as Passed" prompt after evidence attachment (manual tests only)
  const [showPassedPrompt, setShowPassedPrompt] = useState(false);
  const firstControlId = test?.controls?.[0]?.controlId ?? null;
  const handleEvidenceAttached = () => {
    if (!isSystemDriven && test?.status !== 'OK') {
      setShowPassedPrompt(true);
    }
  };
  const renderOwnerChip = (maxWidthClassName = 'max-w-[180px]') =>
    test ? (
      <ValidationOwnerChip
        name={test.owner?.name}
        email={test.owner?.email}
        fallback={test.ownerId}
        interactive={canReassignOwner}
        ariaLabel={t('validationsPage.actions.reassign')}
        onClick={() => setShowOwnerDialog(true)}
        maxWidthClassName={maxWidthClassName}
      />
    ) : (
      '—'
    );

  // ── Shared header + body content ──
  const header = (
    <div
      className={`flex items-start justify-between px-5 py-4 border-b border-gray-200 bg-white ${pageMode ? '' : 'sticky top-0'}`}
    >
      {isLoading ? (
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
      ) : test ? (
        <div>
          {pageMode && (
            <button
              onClick={handleClose}
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('testDetail.backToTests')}
            </button>
          )}
          <h2
            className={`font-semibold text-gray-900 leading-snug ${pageMode ? 'text-2xl' : 'text-base'}`}
          >
            {policyTitle}
          </h2>
          {isPolicyLinked && (
            <p
              className={`text-gray-500 leading-relaxed mt-1 ${pageMode ? 'text-sm' : 'text-xs'}`}
            >
              {t('testDetail.policyLifecycle.linkedTestContext', {
                testName: test.name,
              })}
            </p>
          )}
          {!isPolicyLinked && test.description && (
            <p
              className={`text-gray-500 leading-relaxed mt-1 ${pageMode ? 'text-sm' : 'text-xs'}`}
            >
              {test.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge status={test.status} />
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[test.category]}`}
            >
              {test.category}
            </span>
            {isPolicyLinked && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                {t('testDetail.policyLifecycle.policyLinked')}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${isSystemDriven ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {test.type}
            </span>
          </div>
        </div>
      ) : null}
      <div className="ml-4 flex flex-shrink-0 items-center gap-2">
        {!pageMode && (
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label={t('testDetail.closePanel')}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  const body = (
    <div
      className={`${pageMode ? 'px-5 py-4' : 'flex-1 overflow-y-auto px-5 py-4'} space-y-4`}
    >
      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-14 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {t('testDetail.failedToLoad')}
        </div>
      )}

      {test && (
        <>
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailStatCard
                label={t('testDetail.owner')}
                value={renderOwnerChip('max-w-[150px]')}
              />
              <DetailStatCard
                label={t('testDetail.dueDate')}
                value={fmtDate(test.dueDate)}
                tone={
                  test.status === 'Overdue' || test.status === 'Due_soon'
                    ? 'attention'
                    : 'default'
                }
              />
              <DetailStatCard
                label={t('testDetail.evidence')}
                value={t('testDetail.linkedItems', {
                  count: test.evidences.length,
                })}
              />
              <DetailStatCard
                label={
                  isSystemDriven
                    ? t('testDetail.lastResult')
                    : t('testDetail.completion')
                }
                value={
                  isSystemDriven ? (
                    <LastResultBadge result={test.lastResult ?? 'Not_Run'} />
                  ) : test.status === 'OK' ? (
                    t('testDetail.completed', {
                      date: fmtDate(test.completedAt),
                    })
                  ) : (
                    t('testDetail.pendingCompletion')
                  )
                }
                tone={
                  test.status === 'OK'
                    ? 'success'
                    : test.status === 'Overdue' || test.lastResult === 'Fail'
                      ? 'attention'
                      : 'default'
                }
              />
            </div>
            {(test.status === 'Needs_remediation' ||
              test.status === 'Overdue' ||
              test.lastResult === 'Fail') && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-sm font-semibold text-amber-900">
                    {t('testDetail.needsFollowUp')}
                  </p>
                  <p className="text-xs text-amber-700">
                    {t('testDetail.needsFollowUpDesc')}
                  </p>
                </div>
                <button
                  onClick={() => setShowNotionModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
                >
                  <NotionPanelIcon />
                  {t('testDetail.createNotionTask')}
                </button>
              </div>
            )}
            {notionTaskUrl && (
              <p className="mt-3 text-xs text-green-700">
                {t('testDetail.taskCreated')}{' '}
                <a
                  href={notionTaskUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-green-900"
                >
                  {t('testDetail.openInNotion')}
                </a>
              </p>
            )}
          </div>

          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="h-auto flex-wrap justify-start rounded-2xl bg-slate-100 p-1">
              <TabsTrigger value="summary">
                {isPolicyLinked
                  ? t('testDetail.tabs.policyLifecycle')
                  : t('testDetail.tabs.summary')}
              </TabsTrigger>
              <TabsTrigger value="evidence">
                {t('testDetail.tabs.evidence')}
              </TabsTrigger>
              <TabsTrigger value="mapping">
                {t('testDetail.tabs.mapping')}
              </TabsTrigger>
              <TabsTrigger value="activity">
                {t('testDetail.tabs.activity')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4 mt-0">
              {isPolicyLinked && test.policyId ? (
                <PolicyLinkedTestLifecycle
                  test={test}
                  policyId={test.policyId}
                  initialPolicy={test.policy}
                  onOpenPolicy={handleOpenPolicy}
                  onRunCheck={
                    isInternalAutomatedTest
                      ? () => runMutation.mutate()
                      : undefined
                  }
                  isRunning={runMutation.isPending}
                />
              ) : (
                <>
                  <Section
                    title={t('testDetail.overview.title')}
                    icon={<FileText className="w-4 h-4 text-gray-500" />}
                  >
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {[
                        {
                          label: t('testDetail.dueDate'),
                          value: fmtDate(test.dueDate),
                        },
                        {
                          label: t('testDetail.overview.nextDue'),
                          value: fmtDate(test.nextDueDate),
                        },
                        {
                          label: t('testDetail.overview.cadence'),
                          value: test.recurrenceRule
                            ? test.recurrenceRule[0]!.toUpperCase() +
                              test.recurrenceRule.slice(1)
                            : t('testDetail.overview.oneTime'),
                        },
                        {
                          label: t('testDetail.completion'),
                          value: fmtDate(test.completedAt),
                        },
                        {
                          label: t('testDetail.overview.type'),
                          value: test.type,
                        },
                        {
                          label: t('testDetail.overview.category'),
                          value: test.category,
                        },
                        {
                          label: t('testDetail.overview.created'),
                          value: fmtDate(test.createdAt),
                        },
                        {
                          label: t('testDetail.overview.riskEngineId'),
                          value: test.riskEngineTestId ?? '—',
                        },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            {label}
                          </dt>
                          <dd className="mt-0.5 font-medium text-gray-800">
                            {value}
                          </dd>
                        </div>
                      ))}
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
                          {t('testDetail.owner')}
                        </dt>
                        <dd className="font-medium text-gray-800">
                          {renderOwnerChip('max-w-[220px]')}
                        </dd>
                      </div>
                    </dl>

                    {isSystemDriven && (
                      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wide">
                          <Zap className="w-3.5 h-3.5" />
                          {t('testDetail.overview.automatedVia', {
                            provider:
                              providerLabel ??
                              test.pipelineProvider ??
                              t('testDetail.overview.integrationFallback'),
                          })}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div>
                            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              {t('testDetail.overview.lastScan')}
                            </dt>
                            <dd className="mt-0.5 font-medium text-gray-800">
                              {fmtDateTime(test.lastRunAt)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              {t('testDetail.lastResult')}
                            </dt>
                            <dd className="mt-0.5">
                              <LastResultBadge
                                result={test.lastResult ?? 'Not_Run'}
                              />
                            </dd>
                          </div>
                        </div>
                        {typeof test.lastResultDetails?.summary === 'string' &&
                          test.lastResultDetails.summary && (
                            <p className="text-xs text-gray-600">
                              {test.lastResultDetails.summary}
                            </p>
                          )}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {isSystemDriven ? (
                        <>
                          {test.type === 'Pipeline' ? (
                            <button
                              onClick={async () => {
                                await testsService.ingestPipelineRun({
                                  pipelineName: test.name,
                                  provider:
                                    test.pipelineProvider ??
                                    t(
                                      'testDetail.overview.pipelineProviderFallback',
                                    ),
                                  status: 'success',
                                  summary: t(
                                    'testDetail.overview.pipelineImportSummary',
                                  ),
                                  branch: 'main',
                                });
                                qc.invalidateQueries({
                                  queryKey: QK.testDetail(testId),
                                });
                                qc.invalidateQueries({ queryKey: ['tests'] });
                                qc.invalidateQueries({
                                  queryKey: QK.testRuns(testId),
                                });
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-sm transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                              {t('testDetail.overview.ingestPipelineRun')}
                            </button>
                          ) : (
                            <button
                              onClick={() => runMutation.mutate()}
                              disabled={runMutation.isPending}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`w-4 h-4 ${runMutation.isPending ? 'animate-spin' : ''}`}
                              />
                              {runMutation.isPending
                                ? t('testDetail.overview.running')
                                : t('testDetail.overview.runScanNow')}
                            </button>
                          )}
                          {test.autoRemediationSupported &&
                            test.lastResult === 'Fail' && (
                              <button
                                onClick={() => autoRemediateMutation.mutate()}
                                disabled={autoRemediateMutation.isPending}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-medium disabled:opacity-50"
                              >
                                <Wrench className="w-4 h-4" />
                                {autoRemediateMutation.isPending
                                  ? t('testDetail.overview.autoRemediating')
                                  : t('testDetail.overview.autoRemediate')}
                              </button>
                            )}
                        </>
                      ) : test.status !== 'OK' && canEditTest ? (
                        test.type === 'Document' ? (
                          <button
                            onClick={() => setShowDocumentUpload(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            {t('testDetail.overview.uploadDocument')}
                          </button>
                        ) : (
                          <button
                            onClick={() => completeMutation.mutate()}
                            disabled={completeMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {completeMutation.isPending
                              ? t('testDetail.overview.marking')
                              : t('testDetail.overview.markComplete')}
                          </button>
                        )
                      ) : test.status === 'OK' ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                          <CheckCircle className="w-4 h-4" />
                          {t('testDetail.completed', {
                            date: fmtDate(test.completedAt),
                          })}
                        </div>
                      ) : null}
                    </div>
                    {runMsg && (
                      <p className="mt-2 text-xs text-gray-500">{runMsg}</p>
                    )}
                    {isSystemDriven && (
                      <p className="mt-2 text-xs text-gray-400">
                        {t('testDetail.overview.systemDrivenVia', {
                          provider:
                            providerLabel ??
                            test.pipelineProvider ??
                            t('testDetail.overview.integrationNameFallback'),
                        })}
                      </p>
                    )}
                    {!canEditTest && !isSystemDriven && (
                      <p className="mt-2 text-xs text-gray-500">
                        {t('testDetail.overview.editPermissions')}
                      </p>
                    )}
                  </Section>

                  <Section
                    title={t('testDetail.governance.title')}
                    icon={<ClipboardCheck className="w-4 h-4 text-gray-500" />}
                  >
                    <div className="space-y-3 text-sm">
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {t('testDetail.governance.attestationStatus')}
                        </p>
                        <p className="mt-1 font-medium text-gray-900">
                          {t(
                            `testDetail.governance.attestationStatuses.${test.attestationStatus ?? 'Not_requested'}`,
                            {
                              defaultValue: (
                                test.attestationStatus ?? 'Not_requested'
                              ).replace(/_/g, ' '),
                            },
                          )}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {t('testDetail.governance.reviewer', {
                            name:
                              test.reviewer?.name ??
                              t('testDetail.governance.unassigned'),
                          })}
                        </p>
                        {test.attestedAt && (
                          <p className="mt-1 text-xs text-gray-500">
                            {t('testDetail.governance.signedAt', {
                              date: fmtDateTime(test.attestedAt),
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {canEditTest &&
                          usersData?.[0] &&
                          test.attestationStatus !== 'Pending_review' &&
                          test.attestationStatus !== 'Attested' && (
                            <button
                              onClick={() =>
                                requestAttestationMutation.mutate(
                                  usersData[0]!.id,
                                )
                              }
                              disabled={requestAttestationMutation.isPending}
                              className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                            >
                              {t('testDetail.attestation.requestAttestation')}
                            </button>
                          )}
                        {canAttest &&
                          currentUser?.id &&
                          test.attestationStatus === 'Pending_review' && (
                            <button
                              onClick={() =>
                                signAttestationMutation.mutate(currentUser.id)
                              }
                              disabled={signAttestationMutation.isPending}
                              className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium disabled:opacity-50"
                            >
                              {signAttestationMutation.isPending
                                ? t('testDetail.governance.signing')
                                : t('testDetail.governance.attestEvidence')}
                            </button>
                          )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {t('testDetail.governance.permissionsHint')}
                      </p>
                    </div>
                  </Section>

                  <Section
                    title={t('remediation.title')}
                    icon={<Wrench className="w-4 h-4 text-gray-500" />}
                  >
                    <RemediationGuide test={test} />
                  </Section>
                </>
              )}
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4 mt-0">
              <EvidenceTab
                test={test}
                testId={testId}
                canEditTest={canEditTest}
                detachEvidence={detachEvidence}
                firstControlId={firstControlId}
                handleEvidenceAttached={handleEvidenceAttached}
                isPolicyLinked={isPolicyLinked}
                isSystemDriven={isSystemDriven}
                showPassedPrompt={showPassedPrompt}
                setShowPassedPrompt={setShowPassedPrompt}
                unifiedEvidence={unifiedEvidence}
              />
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4 mt-0">
              <MappingTab
                test={test}
                testId={testId}
                canEditTest={canEditTest}
                detachControl={detachControl}
                detachFramework={detachFramework}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-0">
              <ActivityTab
                testId={testId}
                isSystemDriven={isSystemDriven}
                securityEvents={securityEvents}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );

  const notionModal = showNotionModal && test && (
    <CreateNotionTaskModal
      testId={testId}
      testName={test.name}
      controlId={test.controls[0]?.control?.isoReference}
      onClose={() => setShowNotionModal(false)}
      onCreated={(url) => setNotionTaskUrl(url)}
    />
  );

  const documentUploadModal = showDocumentUpload && test && (
    <DocumentUploadModal
      test={test}
      onClose={() => setShowDocumentUpload(false)}
      onSuccess={() => onMutated?.()}
    />
  );

  const ownerDialog =
    test && usersData ? (
      <ReassignValidationOwnerDialog
        open={showOwnerDialog}
        validationName={test.name}
        currentOwnerId={test.ownerId}
        users={usersData}
        saving={reassignOwner.isPending}
        onClose={() => setShowOwnerDialog(false)}
        onSubmit={(ownerId) => reassignOwner.mutate(ownerId)}
      />
    ) : null;

  // ── Page mode: full-page layout ──
  if (pageMode) {
    return (
      <div className="min-h-full bg-white">
        {header}
        <div className="max-w-4xl mx-auto">{body}</div>
        {notionModal}
        {documentUploadModal}
        {ownerDialog}
      </div>
    );
  }

  // ── Panel mode: fixed slide-over ──
  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={handleClose} />
      {/* Panel */}
      <div className="relative z-50 w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {header}
        {body}
      </div>
      {notionModal}
      {documentUploadModal}
      {ownerDialog}
    </div>
  );
}
