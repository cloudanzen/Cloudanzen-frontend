import {
  AlertTriangle,
  Lightbulb,
  ClipboardCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import type { TestRecord } from '@/services/api/tests';
import { findingsService, type FindingRecord } from '@/services/api/findings';
import {
  remediationService,
  type RemediationAction,
} from '@/services/api/remediation';
import { STATUS_CONFIG } from './constants';
import { fmtDate } from '@/lib/format-date';
import { getProviderLabel } from './scanRegistry';
import { resolvePlaybook } from './remediationPlaybooks/resolver';
import { PlaybookPanel } from './remediationPlaybooks/PlaybookPanel';
import { AiRemediationPanel } from './remediationPlaybooks/AiRemediationPanel';

// ── Live remediation panel (shown when autoRemediationSupported=true) ──────────

const ACTIVE_STATUSES: RemediationAction['status'][] = [
  'PENDING',
  'DRY_RUN_READY',
  'AWAITING_APPROVAL',
  'APPROVED',
  'EXECUTING',
];

function statusLabel(
  status: RemediationAction['status'],
  t: TFunction<'tests'>,
) {
  return t(`remediation.statusLabels.${status}`, { defaultValue: status });
}

function statusColor(status: RemediationAction['status']) {
  if (status === 'SUCCEEDED')
    return 'text-green-700 bg-green-50 border-green-200';
  if (status === 'FAILED' || status === 'ROLLED_BACK')
    return 'text-red-700 bg-red-50 border-red-200';
  if (status === 'EXECUTING' || status === 'APPROVED')
    return 'text-blue-700 bg-blue-50 border-blue-200';
  if (status === 'AWAITING_APPROVAL')
    return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-gray-700 bg-gray-50 border-gray-200';
}

function LiveRemediationPanel({ finding }: { finding: FindingRecord }) {
  const { t } = useTranslation('tests');
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['remediation-actions', finding.id],
    queryFn: () => remediationService.listActions(finding.id),
    refetchInterval: (q) => {
      const data = q.state.data as RemediationAction[] | undefined;
      return data?.some((a) => ACTIVE_STATUSES.includes(a.status))
        ? 3000
        : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        {t('remediation.loadingStatus')}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-sm text-gray-400 py-2">
        {t('remediation.noActions')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div
          key={action.id}
          className={`rounded-lg border p-3 text-sm ${statusColor(action.status)}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <Zap className="w-4 h-4" />
              {action.provider} — {action.actionType}
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border">
              {statusLabel(action.status, t)}
            </span>
          </div>
          {action.latestExecution?.diffJson && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs opacity-70 hover:opacity-100">
                {t('remediation.viewDryRunDiff')}
              </summary>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <p className="font-semibold mb-1 opacity-60">
                    {t('remediation.before')}
                  </p>
                  <pre className="whitespace-pre-wrap break-all bg-white/50 rounded p-2 border">
                    {JSON.stringify(
                      action.latestExecution.diffJson.before,
                      null,
                      2,
                    )}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold mb-1 opacity-60">
                    {t('remediation.after')}
                  </p>
                  <pre className="whitespace-pre-wrap break-all bg-white/50 rounded p-2 border">
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
          {action.latestExecution?.riskSummary && (
            <p className="mt-2 text-xs opacity-80">
              {action.latestExecution.riskSummary}
            </p>
          )}
          {action.lastError && (
            <p className="mt-2 text-xs text-red-600">{action.lastError}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function AutoRemediationSection({ testId }: { testId: string }) {
  const { t } = useTranslation('tests');
  const { data: findings = [], isLoading } = useQuery({
    queryKey: ['test-findings', testId],
    queryFn: () => findingsService.listByTestId(testId),
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        {t('remediation.checkingEngine')}
      </div>
    );
  }

  if (findings.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <div className="flex items-center gap-2 font-semibold">
          <Zap className="w-4 h-4" />
          {t('remediation.autoAvailable')}
        </div>
        <p className="mt-1 text-xs opacity-80">
          {t('remediation.noOpenFindings')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <div className="flex items-center gap-2 font-semibold">
          <Zap className="w-4 h-4" />
          {t('remediation.autoAvailableForFindings', {
            count: findings.length,
          })}
        </div>
        <p className="mt-1 text-xs opacity-80">
          {t('remediation.useFindingsPage')}
        </p>
      </div>
      {findings.map((finding) => (
        <div key={finding.id} className="space-y-2">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                finding.severity === 'CRITICAL'
                  ? 'bg-red-100 text-red-700'
                  : finding.severity === 'HIGH'
                    ? 'bg-orange-100 text-orange-700'
                    : finding.severity === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
              }`}
            >
              {finding.severity}
            </span>
            {finding.title}
          </p>
          <LiveRemediationPanel finding={finding} />
        </div>
      ))}
    </div>
  );
}

// ── Generic fallback steps (used when no Tier 1 playbook resolves) ────────────

function GenericRemediationSteps({ test }: { test: TestRecord }) {
  const { t } = useTranslation('tests');
  const isAutomated = test.type !== 'Document';
  const isFailing =
    test.lastResult === 'Fail' || test.status === 'Needs_remediation';
  const isOverdue = test.status === 'Overdue';
  const providerLabel = test.integration?.provider
    ? getProviderLabel(test.integration.provider)
    : null;

  const steps: Array<{
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
  }> = [];

  if (isFailing && isAutomated) {
    steps.push({
      title: t('remediation.steps.investigateFailure.title'),
      description: t('remediation.steps.investigateFailure.description', {
        provider: providerLabel ?? t('remediation.integrationFallback'),
      }),
      severity: 'critical',
    });
  } else if (isFailing) {
    steps.push({
      title: t('remediation.steps.reviewRequirements.title'),
      description: t('remediation.steps.reviewRequirements.description'),
      severity: 'critical',
    });
  } else if (isOverdue) {
    steps.push({
      title: t('remediation.steps.acknowledgeOverdue.title'),
      description: t('remediation.steps.acknowledgeOverdue.description', {
        date: fmtDate(test.dueDate),
      }),
      severity: 'warning',
    });
  } else {
    steps.push({
      title: t('remediation.steps.reviewStatus.title'),
      description: t('remediation.steps.reviewStatus.description', {
        status: t(
          `statusBadge.${STATUS_CONFIG[test.status]?.key ?? test.status}`,
          {
            defaultValue: STATUS_CONFIG[test.status]?.label ?? test.status,
          },
        ),
      }),
      severity: 'info',
    });
  }

  if (test.controls.length > 0) {
    const controlNames = test.controls
      .map((c) => c.control.isoReference)
      .join(', ');
    steps.push({
      title: t('remediation.steps.verifyControls.title'),
      description: t('remediation.steps.verifyControls.description', {
        controls: controlNames,
      }),
      severity: test.controls.some((c) => c.control.status !== 'IMPLEMENTED')
        ? 'warning'
        : 'info',
    });
  } else {
    steps.push({
      title: t('remediation.steps.mapControls.title'),
      description: t('remediation.steps.mapControls.description'),
      severity: 'warning',
    });
  }

  if (test.evidences.length === 0) {
    steps.push({
      title: t('remediation.steps.collectEvidence.title'),
      description: t('remediation.steps.collectEvidence.description'),
      severity: 'warning',
    });
  } else if (isFailing) {
    steps.push({
      title: t('remediation.steps.updateEvidence.title'),
      description: t('remediation.steps.updateEvidence.description', {
        count: test.evidences.length,
      }),
      severity: 'warning',
    });
  } else {
    steps.push({
      title: t('remediation.steps.verifyEvidence.title'),
      description: t('remediation.steps.verifyEvidence.description', {
        count: test.evidences.length,
      }),
      severity: 'info',
    });
  }

  if (isAutomated && isFailing) {
    steps.push({
      title: t('remediation.steps.applyFix.title', {
        provider: providerLabel ?? t('remediation.integrationFallback'),
      }),
      description: t('remediation.steps.applyFix.description', {
        provider: providerLabel ?? t('remediation.connectedSystemFallback'),
      }),
      severity: 'critical',
    });
    steps.push({
      title: t('remediation.steps.rerunScan.title'),
      description: t('remediation.steps.rerunScan.description'),
      severity: 'info',
    });
  }

  if (test.frameworks.length > 0) {
    steps.push({
      title: t('remediation.steps.confirmFrameworks.title'),
      description: t('remediation.steps.confirmFrameworks.description', {
        frameworks: test.frameworks.map((f) => f.frameworkName).join(', '),
      }),
      severity: 'info',
    });
  }

  if (!isAutomated) {
    steps.push({
      title: t('remediation.steps.markComplete.title'),
      description: t('remediation.steps.markComplete.description'),
      severity: 'info',
    });
  }

  if (test.audits.length > 0) {
    steps.push({
      title: t('remediation.steps.auditReadiness.title'),
      description: t('remediation.steps.auditReadiness.description', {
        count: test.audits.length,
      }),
      severity: 'info',
    });
  }

  const severityIcon = (sev: string) => {
    if (sev === 'critical')
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (sev === 'warning')
      return <Lightbulb className="w-4 h-4 text-amber-500" />;
    return <ClipboardCheck className="w-4 h-4 text-blue-500" />;
  };

  const severityBg = (sev: string) => {
    if (sev === 'critical') return 'border-red-200 bg-red-50/50';
    if (sev === 'warning') return 'border-amber-200 bg-amber-50/50';
    return 'border-gray-100 bg-gray-50/50';
  };

  return (
    <div className="space-y-3">
      {(isFailing || isOverdue) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${isFailing ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            {isFailing
              ? t('remediation.alertFailing')
              : t('remediation.alertOverdue')}
          </div>
          <p className="mt-1 text-xs opacity-80">
            {t('remediation.alertDescription')}
          </p>
        </div>
      )}
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className={`rounded-lg border p-3 ${severityBg(step.severity)}`}
          >
            <div className="flex gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {severityIcon(step.severity)}
                  <p className="text-sm font-semibold text-gray-900">
                    {step.title}
                  </p>
                </div>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * Render order:
 *   1. Auto-remediation live status (always shown when supported, including
 *      Document tests — the previous early-return on autoRemediationSupported
 *      hid the manual guidance and is intentionally removed)
 *   2. Tier 1 static playbook (always shown when resolved)
 *   3. Generic fallback steps (only when no playbook resolves, so custom and
 *      future-unknown validations still get usable guidance)
 *
 * Tier 2 AI-tailored guide slots in between #1 and #2 in PR6.
 */
export function RemediationGuide({ test }: { test: TestRecord }) {
  const autoRemediationVisible =
    test.autoRemediationSupported && test.type !== 'Document';

  const outcome = resolvePlaybook({
    templateId: test.templateId,
    testKey: test.testKey,
    name: test.name,
    provider: test.integration?.provider ?? null,
  });

  const playbook = outcome.playbook;

  return (
    <div className="space-y-6">
      {autoRemediationVisible && <AutoRemediationSection testId={test.id} />}
      <AiRemediationPanel testId={test.id} />
      {playbook && <PlaybookPanel playbook={playbook} />}
      {!playbook && <GenericRemediationSteps test={test} />}
    </div>
  );
}
