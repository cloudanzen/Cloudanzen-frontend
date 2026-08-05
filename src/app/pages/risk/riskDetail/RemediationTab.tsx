/**
 * riskDetail/RemediationTab.tsx — linked tests and remediation actions.
 *
 * Split out of RiskDetailPage.tsx in Phase 4. Markup is unchanged; the values
 * this tab read from the page's closure are now explicit props.
 */

import {
  Activity,
  AlertTriangle,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { NavigateFunction } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import type { RiskDetailModel } from '@/services/api/riskCenter';

interface RemediationTabProps {
  data: RiskDetailModel;
  navigate: NavigateFunction;
  setSelectedTestId: (id: string | null) => void;
}

export function RemediationTab({
  data,
  navigate,
  setSelectedTestId,
}: RemediationTabProps) {
  const { t } = useTranslation('risk');

  return (
    <>
      <div className="space-y-6">
        {/* Generated-from origin panel */}
        {data.origin.testId && (
          <Card className="p-6">
            <div className="flex items-center gap-2 text-foreground">
              <Link2 className="h-4 w-4" />
              <h3 className="text-base font-semibold">
                {t('detail.remediation.generatedFrom')}
              </h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('detail.remediation.generatedDesc')}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('detail.remediation.testName')}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {data.origin.testName}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('detail.remediation.control')}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {data.origin.controlName}
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t('detail.remediation.provider')}
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {data.origin.provider}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTestId(data.origin.testId)}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                {t('detail.remediation.viewTestDetail')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/risk/engine')}
              >
                <Activity className="mr-1.5 h-3.5 w-3.5" />
                {t('detail.remediation.viewInRiskEngine')}
              </Button>
            </div>
          </Card>
        )}

        {/* Enriched remediation workflow */}
        <Card className="p-6">
          <div className="flex items-center gap-2 text-foreground">
            <Workflow className="h-4 w-4" />
            <h3 className="text-base font-semibold">
              {t('detail.remediation.workflowTitle')}
            </h3>
          </div>
          <div className="mt-5 space-y-4">
            {data.enrichedRemediationSteps.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('detail.remediation.noSteps')}
              </p>
            )}
            {data.enrichedRemediationSteps.map((step, index) => (
              <div
                key={step.label}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex gap-4">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {step.label}
                    </p>

                    {(step.linkedTestId || step.linkedControlName) && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {step.linkedTestId && (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {t('detail.remediation.testLink', {
                              id: step.linkedTestId,
                            })}
                          </span>
                        )}
                        {step.linkedControlName && (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {t('detail.remediation.controlLink', {
                              name: step.linkedControlName,
                            })}
                          </span>
                        )}
                      </div>
                    )}

                    {step.failureReason && (
                      <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>{step.failureReason}</span>
                      </div>
                    )}

                    {step.affectedResource && (
                      <p className="text-xs text-muted-foreground">
                        {t('detail.remediation.affectedResource')}{' '}
                        <span className="font-medium text-foreground">
                          {step.affectedResource}
                        </span>
                      </p>
                    )}

                    {step.recommendedFix && (
                      <p className="text-xs text-muted-foreground">
                        {t('detail.remediation.recommended', {
                          fix: step.recommendedFix,
                        })}
                      </p>
                    )}

                    {step.evidenceSummary && (
                      <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                        <span className="font-medium">
                          {t('detail.remediation.evidenceLabel')}
                        </span>{' '}
                        {step.evidenceSummary}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {step.linkedTestId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            setSelectedTestId(step.linkedTestId ?? null)
                          }
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          {t('detail.remediation.viewTestResult')}
                        </Button>
                      )}
                      {step.evidenceSnapshotId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => navigate('/risk/engine')}
                        >
                          <FileText className="mr-1 h-3 w-3" />
                          {t('detail.remediation.viewEvidence')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
