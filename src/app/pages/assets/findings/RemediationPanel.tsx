/**
 * findings/RemediationPanel.tsx — split out of the original 1,487-line FindingsPage.tsx
 * in Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { Clock, Wand2, ZapOff } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { FindingRecord } from '@/services/api/findings';
import {
  remediationService,
  RemediationAction,
} from '@/services/api/remediation';
import { useRemediationActions } from '@/app/pages/compliance/useFindingsData';
import { REMEDIATION_STATUS_META } from './shared';

export function RemediationPanel({
  finding,
  canApprove,
}: {
  finding: FindingRecord;
  canApprove: boolean;
}) {
  const { t } = useTranslation('assets');
  const { actions, isLoading, actionError, doAction } = useRemediationActions(
    finding.id,
  );

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Automated Remediation
        </p>
        <p className="mt-2 text-sm text-gray-400">
          {t('findings.remediation.loading')}
        </p>
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
                    <p className="font-semibold text-red-600 mb-1">
                      {t('findings.remediation.before')}
                    </p>
                    <pre className="whitespace-pre-wrap text-gray-600 text-[11px]">
                      {JSON.stringify(
                        action.latestExecution.diffJson.before,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600 mb-1">
                      {t('findings.remediation.after')}
                    </p>
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
