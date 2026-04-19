/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Wand2,
  X,
  ZapOff,
} from 'lucide-react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  FindingRecord,
  FindingSeverity,
  FindingStatus,
} from '@/services/api/findings';
import {
  remediationService,
  RemediationAction,
  RemediationActionStatus,
} from '@/services/api/remediation';
import { ControlCandidate } from '@/services/api/ai';
import { useCanAudit, useCurrentUser } from '@/hooks/useCurrentUser';
import {
  fmt,
  isOverdue,
  SEVERITY_META,
  STATUS_META,
  useFindingsData,
  useFindingDetailActions,
  useRemediationActions,
  useEvidenceSynthesis,
  type EvidenceSynthesisResult,
} from './useFindingsData';

function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  const meta = SEVERITY_META[severity] ?? SEVERITY_META.LOW;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: FindingStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.OPEN;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
    >
      {meta.label}
    </span>
  );
}

// ── Remediation status helpers ────────────────────────────────────────────────

const REMEDIATION_STATUS_META: Record<
  RemediationActionStatus,
  { label: string; color: string }
> = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-600' },
  DRY_RUN_READY: { label: 'Dry Run Ready', color: 'bg-blue-100 text-blue-700' },
  AWAITING_APPROVAL: {
    label: 'Awaiting Approval',
    color: 'bg-amber-100 text-amber-700',
  },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  EXECUTING: { label: 'Executing', color: 'bg-purple-100 text-purple-700' },
  SUCCEEDED: { label: 'Succeeded', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  ROLLED_BACK: { label: 'Rolled Back', color: 'bg-gray-100 text-gray-700' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

function RemediationPanel({
  finding,
  canApprove,
}: {
  finding: FindingRecord;
  canApprove: boolean;
}) {
  const { actions, isLoading, actionError, doAction } = useRemediationActions(
    finding.id,
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Automated Remediation
        </p>
        <p className="mt-2 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (actions.length === 0) {
    return null; // No automated remediator for this finding — don't show the section
  }

  return (
    <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-indigo-600" />
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
          Automated Remediation
        </p>
      </div>

      {actions.map((action: RemediationAction) => {
        const statusMeta =
          REMEDIATION_STATUS_META[action.status] ??
          REMEDIATION_STATUS_META.PENDING;

        return (
          <div
            key={action.id}
            className="rounded-lg border border-indigo-100 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">
                  {action.provider} · {action.actionType.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-gray-500">
                  Resource: {action.resourceId}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusMeta.color}`}
              >
                {statusMeta.label}
              </span>
            </div>

            {/* Dry run diff */}
            {action.latestExecution?.diffJson && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  View change diff
                </summary>
                <div className="mt-1 grid grid-cols-2 gap-2 rounded bg-gray-50 p-2 font-mono">
                  <div>
                    <p className="font-semibold text-red-600 mb-1">Before</p>
                    <pre className="whitespace-pre-wrap text-gray-600 text-[11px]">
                      {JSON.stringify(
                        action.latestExecution.diffJson.before,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600 mb-1">After</p>
                    <pre className="whitespace-pre-wrap text-gray-600 text-[11px]">
                      {JSON.stringify(
                        action.latestExecution.diffJson.after,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              </details>
            )}

            {/* Risk summary and warnings */}
            {action.latestExecution?.riskSummary && (
              <p className="mt-2 text-xs text-amber-700">
                Risk: {action.latestExecution.riskSummary}
              </p>
            )}

            {/* Last error */}
            {action.lastError && (
              <p className="mt-2 text-xs text-red-600">
                Error: {action.lastError}
              </p>
            )}

            {/* Approval pending indicator */}
            {action.latestApproval?.status === 'PENDING' && (
              <p className="mt-2 text-xs text-amber-700 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Waiting for approval
              </p>
            )}

            {/* Action buttons — shown based on current status */}
            {canApprove && (
              <div className="mt-3 flex flex-wrap gap-2">
                {action.status === 'PENDING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() =>
                      doAction(() =>
                        remediationService.requestDryRun(finding.id, action.id),
                      )
                    }
                  >
                    Run Dry Run
                  </Button>
                )}

                {action.status === 'DRY_RUN_READY' &&
                  action.requiresApproval && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() =>
                        doAction(() =>
                          remediationService.requestApproval(
                            finding.id,
                            action.id,
                          ),
                        )
                      }
                    >
                      Request Approval
                    </Button>
                  )}

                {action.status === 'DRY_RUN_READY' &&
                  !action.requiresApproval && (
                    <Button
                      size="sm"
                      className="bg-indigo-600 text-xs hover:bg-indigo-700 text-white"
                      onClick={() =>
                        doAction(() =>
                          remediationService.execute(finding.id, action.id),
                        )
                      }
                    >
                      Fix Now
                    </Button>
                  )}

                {action.status === 'AWAITING_APPROVAL' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 text-xs hover:bg-green-700 text-white"
                      onClick={() =>
                        doAction(() =>
                          remediationService.approve(finding.id, action.id),
                        )
                      }
                    >
                      Approve &amp; Fix
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-red-600"
                      onClick={() =>
                        doAction(() =>
                          remediationService.reject(finding.id, action.id),
                        )
                      }
                    >
                      Reject
                    </Button>
                  </>
                )}

                {action.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    className="bg-indigo-600 text-xs hover:bg-indigo-700 text-white"
                    onClick={() =>
                      doAction(() =>
                        remediationService.execute(finding.id, action.id),
                      )
                    }
                  >
                    Execute
                  </Button>
                )}

                {action.status === 'SUCCEEDED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-gray-600"
                    onClick={() =>
                      doAction(() =>
                        remediationService.rollback(finding.id, action.id),
                      )
                    }
                  >
                    <ZapOff className="mr-1 h-3 w-3" />
                    Rollback
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {actionError && <p className="text-xs text-red-600">{actionError}</p>}
    </div>
  );
}

// ── AI-2: Evidence Synthesis Panel ───────────────────────────────────────────
// Surfaces AI-suggested control mappings for findings that have test run data.
// All output is PENDING_REVIEW — user must accept or dismiss.

function ConfidenceBadge({
  confidence,
}: {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}) {
  const meta = {
    HIGH: 'bg-green-50 text-green-700',
    MEDIUM: 'bg-amber-50 text-amber-700',
    LOW: 'bg-red-50 text-red-700',
  }[confidence];
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${meta}`}
    >
      {confidence}
    </span>
  );
}

function EvidenceSynthesisPanel({ findingId }: { findingId: string }) {
  const [summaryInput, setSummaryInput] = useState('');
  const [result, setResult] = useState<EvidenceSynthesisResult | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(
    null,
  );

  const {
    synthesizeMutation: rawSynthesize,
    acceptMutation,
    dismissMutation: rawDismiss,
  } = useEvidenceSynthesis(findingId);

  const synthesizeMutation = {
    ...rawSynthesize,
    mutate: (summary: string) =>
      rawSynthesize.mutate(summary, {
        onSuccess: (data: any) => {
          setResult(data.data);
          setShowInput(false);
        },
      }),
  };

  const dismissMutation = {
    ...rawDismiss,
    mutate: (id: string) =>
      rawDismiss.mutate(id, {
        onSuccess: () => setResult(null),
      }),
  };

  if (!showInput && !result) {
    return (
      <button
        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
        onClick={() => setShowInput(true)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggest control mappings with AI
      </button>
    );
  }

  if (showInput && !result) {
    return (
      <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI evidence synthesis
          </p>
          <button
            onClick={() => setShowInput(false)}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          className="w-full min-h-[80px] rounded-lg border border-blue-200 bg-white p-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          placeholder="Describe what evidence this finding contains (e.g. 'GitHub branch protection check failed — no required reviewers on default branch')"
          value={summaryInput}
          onChange={(e) => setSummaryInput(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => synthesizeMutation.mutate(summaryInput.trim())}
            disabled={!summaryInput.trim() || synthesizeMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            {synthesizeMutation.isPending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3 w-3" />
            )}
            Analyze
          </Button>
          <p className="text-xs text-blue-500">
            Output requires human review before any change is made
          </p>
        </div>
        {synthesizeMutation.isError && (
          <p className="text-xs text-red-600">
            Analysis failed. Please try again.
          </p>
        )}
      </div>
    );
  }

  if (result) {
    const isAccepted = acceptMutation.isSuccess;
    const isDismissed = dismissMutation.isSuccess;

    return (
      <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            AI-suggested control mappings
          </p>
          <span className="text-xs text-blue-500 italic">
            Pending your review
          </span>
        </div>

        {result.controlCandidates.length === 0 ? (
          <p className="text-sm text-gray-500">
            No matching controls found. Try refining the evidence description.
          </p>
        ) : (
          <div className="space-y-2">
            {result.controlCandidates.map((candidate: ControlCandidate) => (
              <div
                key={candidate.controlId}
                className="rounded-lg border border-blue-200 bg-white p-3"
              >
                <button
                  className="flex w-full items-start justify-between gap-2 text-left"
                  onClick={() =>
                    setExpandedCandidate(
                      expandedCandidate === candidate.controlId
                        ? null
                        : candidate.controlId,
                    )
                  }
                >
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge confidence={candidate.confidence} />
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {candidate.controlTitle}
                    </span>
                  </div>
                  {expandedCandidate === candidate.controlId ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  )}
                </button>
                {expandedCandidate === candidate.controlId && (
                  <p className="mt-2 text-xs text-gray-600 border-t border-gray-100 pt-2 leading-relaxed">
                    {candidate.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {result.recommendedControlId && (
          <p className="text-xs text-blue-600">
            Recommended: control{' '}
            <code className="font-mono">{result.recommendedControlId}</code>
          </p>
        )}

        {!isAccepted && !isDismissed && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => acceptMutation.mutate(result.generationId)}
              disabled={acceptMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white text-xs"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ThumbsUp className="mr-1 h-3 w-3" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => dismissMutation.mutate(result.generationId)}
              disabled={dismissMutation.isPending}
              className="text-xs"
            >
              {dismissMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ThumbsDown className="mr-1 h-3 w-3" />
              )}
              Dismiss
            </Button>
          </div>
        )}

        {isAccepted && (
          <p className="text-xs text-green-700 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Accepted — review the suggested controls and confirm mappings
            manually.
          </p>
        )}
        {isDismissed && (
          <p className="text-xs text-gray-500">Suggestion dismissed.</p>
        )}
      </div>
    );
  }

  return null;
}

function FindingDetailPanel({
  finding,
  onClose,
  onUpdated,
}: {
  finding: FindingRecord;
  onClose: () => void;
  onUpdated: (finding: FindingRecord) => void;
}) {
  const currentUser = useCurrentUser();
  const canAudit = useCanAudit();
  const [dueAt, setDueAt] = useState(
    finding.dueAt ? finding.dueAt.slice(0, 10) : '',
  );
  const [remediationOwner, setRemediationOwner] = useState(
    finding.remediationOwner ?? '',
  );
  const [note, setNote] = useState('');

  const canEdit = canAudit;

  const {
    saving,
    error,
    updateStatus,
    saveMetadata: saveMetadataFn,
    addRemediation: addRemediationFn,
  } = useFindingDetailActions(finding, onUpdated);

  async function saveMetadata() {
    await saveMetadataFn({ dueAt, remediationOwner });
  }

  async function addRemediation() {
    await addRemediationFn(note);
    setNote('');
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-xl overflow-y-auto bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
              {isOverdue(finding) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {finding.title}
            </h2>
            <p className="text-xs font-medium text-gray-500">
              {finding.control?.isoReference ?? '—'} -{' '}
              {finding.control?.title ?? 'Unmapped control'}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </p>
            <p className="text-sm text-gray-700">
              {finding.description ?? 'No description provided.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Asset</p>
              <p className="font-medium">{finding.asset?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Risk</p>
              <p className="font-medium">{finding.risk?.title ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="font-medium">{fmt(finding.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Due date</p>
              <p
                className={`font-medium ${isOverdue(finding) ? 'text-red-600' : ''}`}
              >
                {fmt(finding.dueAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Owner</p>
              <p className="font-medium">{finding.remediationOwner ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Age</p>
              <p className="font-medium">{finding.ageInDays ?? 0} days</p>
            </div>
          </div>

          {finding.testRun && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Latest triggering run
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Executed</p>
                  <p className="font-medium">
                    {fmt(finding.testRun.executedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="font-medium">
                    {finding.testRun.executionSource ?? '—'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-700">
                {finding.testRun.summary}
              </p>
            </div>
          )}

          {/* AI-2: Evidence synthesis — suggest control mappings from finding context */}
          <EvidenceSynthesisPanel findingId={finding.id} />

          {canEdit && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Workflow metadata
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block text-xs text-gray-500">
                    Remediation owner
                  </span>
                  <input
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={remediationOwner}
                    onChange={(event) =>
                      setRemediationOwner(event.target.value)
                    }
                    placeholder="User id or email"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <span className="mb-1 block text-xs text-gray-500">
                    Due date
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={dueAt}
                    onChange={(event) => setDueAt(event.target.value)}
                  />
                </label>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={saveMetadata}
                disabled={saving}
              >
                Save Metadata
              </Button>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Remediation Log
            </p>
            <div className="space-y-2">
              {(finding.remediations ?? []).length === 0 && (
                <p className="text-sm text-gray-400">
                  No remediation updates yet.
                </p>
              )}
              {(finding.remediations ?? []).map((entry) => (
                <div key={entry.id} className="rounded-lg bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">{entry.note}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {fmt(entry.createdAt)} · {entry.createdBy ?? 'system'}
                  </p>
                </div>
              ))}
            </div>
            <textarea
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Add a remediation update..."
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addRemediation}
              disabled={saving || !note.trim()}
            >
              Add Remediation Note
            </Button>
          </div>

          {/* RE-1/RE-2: Automated Remediation Panel */}
          <RemediationPanel finding={finding} canApprove={canEdit} />

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Actions
            </p>
            {finding.status === 'OPEN' && canEdit && (
              <Button
                className="w-full"
                onClick={() => updateStatus('IN_REMEDIATION')}
                disabled={saving}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Start Remediation
              </Button>
            )}
            {finding.status === 'IN_REMEDIATION' && canEdit && (
              <Button
                className="w-full"
                onClick={() => updateStatus('READY_FOR_REVIEW')}
                disabled={saving}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Submit for Review
              </Button>
            )}
            {finding.status === 'READY_FOR_REVIEW' && canEdit && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => updateStatus('CLOSED')}
                  disabled={saving}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => updateStatus('OPEN')}
                  disabled={saving}
                >
                  Reopen
                </Button>
              </div>
            )}
          </div>

          {finding.slaBreached && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              This finding has breached its remediation SLA.
            </div>
          )}

          {currentUser && finding.remediationOwner === currentUser.email && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              You are the current remediation owner for this finding.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FindingsPage() {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const [filterSeverity, setFilterSeverity] = useState<FindingSeverity | ''>(
    '',
  );
  const [filterStatus, setFilterStatus] = useState<FindingStatus | ''>('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FindingRecord | null>(null);

  const { visible, stats, isLoading, error } = useFindingsData({
    filterSeverity,
    filterStatus,
    search,
  });

  return (
    <PageTemplate
      title={t('findings.title')}
      description={t('findings.description')}
    >
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { key: 'total', label: t('findings.total'), value: stats.total, color: 'text-gray-700' },
          { key: 'open', label: t('findings.open'), value: stats.open, color: 'text-red-600' },
          {
            key: 'inRemediation',
            label: t('findings.inRemediation'),
            value: stats.inRemediation,
            color: 'text-amber-600',
          },
          { key: 'closed', label: t('findings.closed'), value: stats.closed, color: 'text-green-600' },
          { key: 'overdue', label: t('findings.overdue'), value: stats.overdue, color: 'text-red-700' },
        ].map((stat) => (
          <Card key={stat.key} className="p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-1.5 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('findings.searchPlaceholder')}
          />
        </div>
        <Select
          value={filterSeverity || '__all_severity__'}
          onValueChange={(v) =>
            setFilterSeverity(
              v === '__all_severity__' ? '' : (v as FindingSeverity),
            )
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all_severity__">{t('findings.allSeverities')}</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus || '__all_status__'}
          onValueChange={(v) =>
            setFilterStatus(v === '__all_status__' ? '' : (v as FindingStatus))
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all_status__">{t('findings.allStatuses')}</SelectItem>
            {(
              ['OPEN', 'IN_REMEDIATION', 'READY_FOR_REVIEW', 'CLOSED'] as const
            ).map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_META[status].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ['findings'] })}
          className="ml-auto rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">
          Loading findings...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-600">
          {(error as Error).message || 'Failed to load findings.'}
        </div>
      )}

      {!isLoading && !error && (
        <Card className="overflow-hidden border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="px-4 py-3">Finding</th>
                  <th className="px-4 py-3">Control</th>
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {visible.map((finding) => (
                  <tr
                    key={finding.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelected(finding)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Shield className="mt-0.5 h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {finding.title}
                          </div>
                          <div className="line-clamp-2 text-xs text-gray-500">
                            {finding.description ?? 'No description provided.'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.control?.isoReference ?? '—'}
                      <div className="text-gray-400">
                        {finding.control?.title ?? 'Unmapped'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.asset?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="mb-1">
                        <SeverityBadge severity={finding.severity} />
                      </div>
                      <StatusBadge status={finding.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.remediationOwner ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {finding.dueAt ? (
                        <span
                          className={
                            isOverdue(finding)
                              ? 'font-semibold text-red-600'
                              : ''
                          }
                        >
                          {fmt(finding.dueAt)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {finding.ageInDays ?? 0}d
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-gray-400"
                    >
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                        <Clock className="h-5 w-5" />
                      </div>
                      No automated findings match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {selected && (
        <FindingDetailPanel
          finding={selected}
          onClose={() => setSelected(null)}
          onUpdated={setSelected}
        />
      )}
    </PageTemplate>
  );
}
