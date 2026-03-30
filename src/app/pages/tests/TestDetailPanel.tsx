import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  CheckCircle,
  Tag,
  Link2,
  Shield,
  FileText,
  History,
  Zap,
  RefreshCw,
  Wrench,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ClipboardCheck,
  Activity,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Loader2,
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
import { Section, DetailStatCard } from './testDetail/Section';
import { HistorySection } from './testDetail/HistorySection';
import { RunsSection, TrendSparkline } from './testDetail/RunsSection';
import { RiskContextSection } from './testDetail/RiskContextSection';
import {
  NotionPanelIcon,
  CreateNotionTaskModal,
} from './testDetail/CreateNotionTaskModal';
import {
  AttachEvidenceSection,
  UploadEvidenceSection,
  MarkAsPassedPrompt,
  AttachControlSection,
  AttachAuditSection,
  AddFrameworkSection,
  PolicyDocumentsSection,
} from './testDetail/AttachSections';
import { DocumentUploadModal } from './testDetail/DocumentUploadModal';
import { RemediationGuide } from './testDetail/RemediationGuide';
import { aiService } from '@/services/api/ai';
import { CitationViewer } from '@/app/components/CitationViewer';

// ─── Evidence Synthesis Panel (AI-2) ─────────────────────────────────────────
// Inline panel for the evidence tab — allows triggering AI control-mapping
// suggestions for any attached evidence item without leaving the test detail.

interface EvidenceSynthesisPanelProps {
  evidences: Array<{
    evidenceId: string;
    evidence: { fileName?: string | null; type: string };
  }>;
  testId: string;
}

function EvidenceSynthesisPanel({ evidences }: EvidenceSynthesisPanelProps) {
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  );
  const [generationId, setGenerationId] = useState<string | null>(null);

  const synthesisMutation = useMutation({
    mutationFn: (evidenceId: string) =>
      aiService.synthesizeEvidence(evidenceId, ''),
    onSuccess: (resp) => {
      setGenerationId(resp.data.generationId);
    },
  });

  const generationQuery = useQuery({
    queryKey: ['ai-generation', generationId],
    queryFn: () => aiService.getGeneration(generationId!),
    enabled: !!generationId,
    refetchInterval: (query) =>
      query.state.data?.data?.status === 'PENDING_REVIEW' ? false : 3000,
  });

  const acceptMutation = useMutation({
    mutationFn: () => aiService.acceptSuggestion(generationId!),
    onSuccess: () => setGenerationId(null),
  });

  const dismissMutation = useMutation({
    mutationFn: () => aiService.dismissSuggestion(generationId!),
    onSuccess: () => {
      setGenerationId(null);
      setSelectedEvidenceId(null);
    },
  });

  const generation = generationQuery.data?.data;

  return (
    <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <span className="text-sm font-semibold text-violet-800">
          AI Evidence Synthesis
        </span>
        <span className="ml-auto text-xs text-violet-500">
          Suggest control mappings
        </span>
      </div>

      {!generationId && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            Select an evidence item to generate an AI-suggested control mapping
            with citations.
          </p>
          <div className="flex flex-wrap gap-2">
            {evidences.map(({ evidenceId, evidence }) => (
              <button
                key={evidenceId}
                type="button"
                onClick={() => {
                  setSelectedEvidenceId(evidenceId);
                  synthesisMutation.mutate(evidenceId);
                }}
                disabled={synthesisMutation.isPending}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors
                  ${
                    selectedEvidenceId === evidenceId
                      ? 'border-violet-400 bg-violet-100 text-violet-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-violet-200 hover:bg-violet-50'
                  }`}
              >
                {evidence.fileName ?? evidence.type}
              </button>
            ))}
          </div>
          {synthesisMutation.isPending && (
            <div className="flex items-center gap-2 text-xs text-violet-600">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Synthesizing evidence…
            </div>
          )}
          {synthesisMutation.isError && (
            <p className="text-xs text-red-600">
              Synthesis failed —{' '}
              {(synthesisMutation.error as Error)?.message ?? 'unknown error'}
            </p>
          )}
        </div>
      )}

      {generationId && generation && (
        <div className="space-y-3 bg-white rounded-xl border border-violet-100 p-3">
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {generation.outputText || (
              <span className="text-gray-400 italic">Generating…</span>
            )}
          </div>
          {generation.citationsJson && generation.citationsJson.length > 0 && (
            <CitationViewer
              citations={generation.citationsJson}
              label="Source documents"
              className="pt-1"
            />
          )}
          {generation.status === 'PENDING_REVIEW' && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ThumbsUp className="h-3.5 w-3.5" />
                )}
                Accept suggestion
              </button>
              <button
                type="button"
                onClick={() => dismissMutation.mutate()}
                disabled={dismissMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [showNotionModal, setShowNotionModal] = useState(false);
  const [notionTaskUrl, setNotionTaskUrl] = useState<string | null>(null);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

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
    enabled: isAdmin,
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
      throw new Error('Failed to load test');
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

  const runMutation = useMutation({
    mutationFn: () => {
      const provider = test?.integration?.provider ?? '';
      const meta = (test?.integration?.metadata ?? {}) as Record<
        string,
        string
      >;
      return dispatchScan(provider, meta);
    },
    onSuccess: () => {
      setRunMsg('Scan triggered. Results will update shortly.');
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['tests'] });
        qc.invalidateQueries({ queryKey: QK.testRuns(testId) });
        setRunMsg(null);
      }, 4000);
    },
    onError: () => {
      setRunMsg('Failed to trigger scan.');
      setTimeout(() => setRunMsg(null), 3000);
    },
  });

  const reassignOwner = useMutation({
    mutationFn: (ownerId: string) =>
      testsService.updateTest(testId, { ownerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.testDetail(testId) });
      qc.invalidateQueries({ queryKey: ['tests'] });
      onMutated?.();
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
              Back to Tests
            </button>
          )}
          <h2
            className={`font-semibold text-gray-900 leading-snug ${pageMode ? 'text-2xl' : 'text-base'}`}
          >
            {test.name}
          </h2>
          {test.description && (
            <p className={`text-gray-500 leading-relaxed mt-1 ${pageMode ? 'text-sm' : 'text-xs'}`}>
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
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${isSystemDriven ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {test.type}
            </span>
          </div>
        </div>
      ) : null}
      {!pageMode && (
        <button
          onClick={handleClose}
          className="ml-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      )}
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
          Failed to load test details.
        </div>
      )}

      {test && (
        <>
          <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <DetailStatCard
                label="Owner"
                value={test.owner?.name ?? test.owner?.email ?? test.ownerId}
              />
              <DetailStatCard
                label="Due Date"
                value={fmtDate(test.dueDate)}
                tone={
                  test.status === 'Overdue' || test.status === 'Due_soon'
                    ? 'attention'
                    : 'default'
                }
              />
              <DetailStatCard
                label="Evidence"
                value={`${test.evidences.length} linked item${test.evidences.length === 1 ? '' : 's'}`}
              />
              <DetailStatCard
                label={isSystemDriven ? 'Last Result' : 'Completion'}
                value={
                  isSystemDriven ? (
                    <LastResultBadge result={test.lastResult ?? 'Not_Run'} />
                  ) : test.status === 'OK' ? (
                    `Completed ${fmtDate(test.completedAt)}`
                  ) : (
                    'Pending completion'
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
                    Needs follow-up
                  </p>
                  <p className="text-xs text-amber-700">
                    Create a remediation task or update evidence before the next
                    review cycle.
                  </p>
                </div>
                <button
                  onClick={() => setShowNotionModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100"
                >
                  <NotionPanelIcon />
                  Create Notion Task
                </button>
              </div>
            )}
            {notionTaskUrl && (
              <p className="mt-3 text-xs text-green-700">
                Task created:{' '}
                <a
                  href={notionTaskUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-green-900"
                >
                  Open in Notion
                </a>
              </p>
            )}
          </div>

          <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="h-auto flex-wrap justify-start rounded-2xl bg-slate-100 p-1">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="mapping">Mappings</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4 mt-0">
              <Section
                title="Overview"
                icon={<FileText className="w-4 h-4 text-gray-500" />}
              >
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {[
                    { label: 'Due Date', value: fmtDate(test.dueDate) },
                    { label: 'Next Due', value: fmtDate(test.nextDueDate) },
                    {
                      label: 'Cadence',
                      value: test.recurrenceRule
                        ? test.recurrenceRule[0]!.toUpperCase() +
                          test.recurrenceRule.slice(1)
                        : 'One-time',
                    },
                    { label: 'Completed', value: fmtDate(test.completedAt) },
                    { label: 'Type', value: test.type },
                    { label: 'Category', value: test.category },
                    { label: 'Created', value: fmtDate(test.createdAt) },
                    {
                      label: 'Risk Engine ID',
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
                      Owner
                    </dt>
                    {canEditTest && usersData && usersData.length > 0 ? (
                      <select
                        value={test.ownerId}
                        onChange={(e) => reassignOwner.mutate(e.target.value)}
                        disabled={reassignOwner.isPending}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {usersData.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name ?? u.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <dd className="font-medium text-gray-800">
                        {test.owner?.name ?? test.owner?.email ?? test.ownerId}
                      </dd>
                    )}
                  </div>
                </dl>

                {isSystemDriven && (
                  <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-violet-700 uppercase tracking-wide">
                      <Zap className="w-3.5 h-3.5" />
                      Automated via{' '}
                      {providerLabel ?? test.pipelineProvider ?? 'Integration'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Last Scan
                        </dt>
                        <dd className="mt-0.5 font-medium text-gray-800">
                          {fmtDateTime(test.lastRunAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                          Last Result
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
                                test.pipelineProvider ?? 'GitHub Actions',
                              status: 'success',
                              summary:
                                'Pipeline execution imported from CI/CD webhook.',
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
                          Ingest Pipeline Run
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
                            ? 'Running...'
                            : 'Run Scan Now'}
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
                              ? 'Executing remediation...'
                              : 'Run Auto-remediation'}
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
                        Upload Document
                      </button>
                    ) : (
                      <button
                        onClick={() => completeMutation.mutate()}
                        disabled={completeMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {completeMutation.isPending
                          ? 'Marking...'
                          : 'Mark Complete'}
                      </button>
                    )
                  ) : test.status === 'OK' ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium border border-green-200">
                      <CheckCircle className="w-4 h-4" />
                      Completed {fmtDate(test.completedAt)}
                    </div>
                  ) : null}
                </div>
                {runMsg && (
                  <p className="mt-2 text-xs text-gray-500">{runMsg}</p>
                )}
                {isSystemDriven && (
                  <p className="mt-2 text-xs text-gray-400">
                    This test is system-driven via{' '}
                    {providerLabel ??
                      test.pipelineProvider ??
                      'the integration'}
                    . Results update automatically on every scan.
                  </p>
                )}
                {!canEditTest && !isSystemDriven && (
                  <p className="mt-2 text-xs text-gray-500">
                    Only the assigned owner, team lead, or CISO override roles
                    can change this test.
                  </p>
                )}
              </Section>

              <Section
                title="Governance"
                icon={<ClipboardCheck className="w-4 h-4 text-gray-500" />}
              >
                <div className="space-y-3 text-sm">
                  <div className="rounded-lg border border-gray-100 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Attestation Status
                    </p>
                    <p className="mt-1 font-medium text-gray-900">
                      {(test.attestationStatus ?? 'Not_requested').replace(
                        /_/g,
                        ' ',
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Reviewer: {test.reviewer?.name ?? 'Unassigned'}
                    </p>
                    {test.attestedAt && (
                      <p className="mt-1 text-xs text-gray-500">
                        Signed {fmtDateTime(test.attestedAt)}
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
                            requestAttestationMutation.mutate(usersData[0]!.id)
                          }
                          disabled={requestAttestationMutation.isPending}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                        >
                          Request Attestation
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
                            ? 'Signing...'
                            : 'Attest Evidence'}
                        </button>
                      )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Owners can edit and complete, auditors can attest, and
                    CISO/admin roles retain override authority.
                  </p>
                </div>
              </Section>

              <Section
                title="How to Remediate"
                icon={<Wrench className="w-4 h-4 text-gray-500" />}
              >
                <RemediationGuide test={test} />
              </Section>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4 mt-0">
              <Section
                title={`Evidence (${test.evidences.length})`}
                icon={<Shield className="w-4 h-4 text-gray-500" />}
              >
                {test.evidences.length === 0 ? (
                  <p className="text-sm text-gray-400">No evidence attached.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.evidences.map(({ id, evidenceId, evidence }) => (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {evidence.fileName ?? evidence.type}
                          </p>
                          {evidence.fileUrl && (
                            <a
                              href={evidence.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="w-3 h-3" /> View file
                            </a>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {fmtDate(evidence.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => detachEvidence.mutate(evidenceId)}
                          disabled={!canEditTest}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Detach evidence"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {canEditTest && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <UploadEvidenceSection
                      testId={testId}
                      controlId={firstControlId}
                      onUploaded={handleEvidenceAttached}
                    />
                    <span className="text-xs text-gray-300">|</span>
                    <AttachEvidenceSection
                      testId={testId}
                      existingIds={
                        new Set(test.evidences.map((e) => e.evidenceId))
                      }
                      controlIds={test.controls.map((c) => c.controlId)}
                      onAttached={handleEvidenceAttached}
                    />
                  </div>
                )}
                {canEditTest && !isSystemDriven && (
                  <MarkAsPassedPrompt
                    testId={testId}
                    show={showPassedPrompt}
                    onDismiss={() => setShowPassedPrompt(false)}
                  />
                )}
                <PolicyDocumentsSection
                  controlIds={test.controls.map((c) => c.controlId)}
                />
              </Section>

              <Section
                title={`Unified Evidence (${unifiedEvidence.length})`}
                icon={<Shield className="w-4 h-4 text-gray-500" />}
              >
                {unifiedEvidence.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No unified evidence records yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {unifiedEvidence.slice(0, 6).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-gray-100 p-3 bg-gray-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-gray-900">
                            {item.title}
                          </p>
                          <span className="text-xs text-gray-500">
                            {item.sourceType}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {item.provider} · {fmtDateTime(item.capturedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* AI-2: Evidence synthesis panel — suggest control mappings */}
              {test.evidences.length > 0 && (
                <EvidenceSynthesisPanel
                  evidences={test.evidences}
                  testId={testId}
                />
              )}
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4 mt-0">
              <Section
                title={`Controls (${test.controls.length})`}
                icon={<Shield className="w-4 h-4 text-gray-500" />}
              >
                {test.controls.length === 0 ? (
                  <p className="text-sm text-gray-400">No controls linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.controls.map(({ id, controlId, control }) => (
                      <li
                        key={id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
                      >
                        <div>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200 mr-2">
                            {control.isoReference}
                          </span>
                          <span className="text-sm text-gray-700">
                            {control.title}
                          </span>
                          <span
                            className={`ml-2 text-xs px-1.5 py-0.5 rounded ${control.status === 'IMPLEMENTED' ? 'bg-green-50 text-green-700' : control.status === 'PARTIALLY_IMPLEMENTED' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}
                          >
                            {control.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <button
                          onClick={() => detachControl.mutate(controlId)}
                          disabled={!canEditTest}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Detach control"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {canEditTest && (
                  <AttachControlSection
                    testId={testId}
                    existingIds={new Set(test.controls.map((c) => c.controlId))}
                  />
                )}
              </Section>

              <Section
                title={`Frameworks (${test.frameworks.length})`}
                icon={<Tag className="w-4 h-4 text-gray-500" />}
              >
                {test.frameworks.length === 0 ? (
                  <p className="text-sm text-gray-400">No frameworks linked.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {test.frameworks.map(({ id, frameworkName }) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {frameworkName}
                        <button
                          onClick={() => detachFramework.mutate(id)}
                          className="hover:text-red-500 transition-colors"
                          title="Remove framework"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {canEditTest && <AddFrameworkSection testId={testId} />}
              </Section>

              <Section
                title={`Audits (${test.audits.length})`}
                icon={<Link2 className="w-4 h-4 text-gray-500" />}
              >
                {test.audits.length === 0 ? (
                  <p className="text-sm text-gray-400">No audits linked.</p>
                ) : (
                  <ul className="space-y-2">
                    {test.audits.map(({ id, audit }) => (
                      <li
                        key={id}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-sm"
                      >
                        <p className="font-medium text-gray-800">
                          {audit.type}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Auditor: {audit.auditor}
                        </p>
                        {audit.scope && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {audit.scope}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {canEditTest && (
                  <AttachAuditSection
                    testId={testId}
                    existingIds={new Set(test.audits.map((a) => a.auditId))}
                  />
                )}
              </Section>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-0">
              <Section
                title="Result Trend"
                icon={<Activity className="w-4 h-4 text-gray-500" />}
              >
                <TrendSparkline testId={testId} />
              </Section>

              {isSystemDriven && (
                <Section
                  title="Scan Run History"
                  icon={<Zap className="w-4 h-4 text-gray-500" />}
                >
                  <RunsSection testId={testId} />
                </Section>
              )}

              <Section
                title="Risk Context"
                icon={<AlertTriangle className="w-4 h-4 text-gray-500" />}
              >
                <RiskContextSection testId={testId} />
              </Section>

              {securityEvents.length > 0 && (
                <Section
                  title="Security Workflow"
                  icon={<ArrowRight className="w-4 h-4 text-gray-500" />}
                >
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs uppercase tracking-wide text-amber-700">
                      SIEM / SOAR
                    </p>
                    <div className="mt-2 space-y-1">
                      {securityEvents.slice(0, 6).map((item) => (
                        <p key={item.id} className="text-xs text-amber-900">
                          {item.eventType} to {item.destination} ({item.status})
                        </p>
                      ))}
                    </div>
                  </div>
                </Section>
              )}

              <Section
                title="History"
                icon={<History className="w-4 h-4 text-gray-500" />}
              >
                <HistorySection testId={testId} />
              </Section>
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

  // ── Page mode: full-page layout ──
  if (pageMode) {
    return (
      <div className="min-h-full bg-white">
        {header}
        <div className="max-w-4xl mx-auto">{body}</div>
        {notionModal}
        {documentUploadModal}
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
    </div>
  );
}
