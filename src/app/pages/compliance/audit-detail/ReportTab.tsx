/**
 * audit-detail/ReportTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  Lock,
  ClipboardList,
  FileText,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { auditsService, AuditRecord } from '@/services/api/audits';
import { useCanAudit, useIsAdmin } from '@/hooks/useCurrentUser';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { fmt } from '../AuditDetailPanel';

export function ReportTab({
  audit,
  onRefresh,
}: {
  audit: AuditRecord;
  onRefresh: () => void;
}) {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canAudit = useCanAudit();
  // Start audit requires admin per backend (audit-command-routes.ts:317).
  // Previously gated by canAudit which 403's real AUDITOR/EXTERNAL_AUDITOR users.
  const isAdmin = useIsAdmin();
  const confirm = useConfirmDialog();
  const [acting, setActing] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const snap = audit.snapshot;

  async function handleMoveToAwaitingReport() {
    const ok = await confirm({
      title: t('auditDetail.report.awaitingReportConfirmTitle'),
      description: t('auditDetail.report.awaitingReportConfirmDesc'),
      confirmLabel: t('auditDetail.report.awaitingReportConfirmLabel'),
      variant: 'default',
    });
    if (!ok) return;
    setActing(true);
    try {
      await auditsService.transitionToAwaitingReport(audit.id);
      toast.success(t('auditDetail.report.auditAwaitingReport'));
      onRefresh();
    } catch {
      toast.error(t('auditDetail.report.awaitingReportFailed'));
    } finally {
      setActing(false);
    }
  }

  async function handleStart() {
    setActing(true);
    try {
      await auditsService.start(audit.id);
      toast.success(t('auditDetail.report.auditStarted'));
      onRefresh();
    } catch {
      toast.error(t('auditDetail.report.startFailed'));
    } finally {
      setActing(false);
    }
  }

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    try {
      await auditsService.generateReportPdf(audit.id);
      toast.success(t('auditDetail.report.pdfQueued'));

      for (let attempt = 0; attempt < 10; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const refreshed = await auditsService.get(audit.id);
        queryClient.setQueryData(['audit', audit.id], refreshed);
        if (
          refreshed.data.signedPdfUrl &&
          refreshed.data.signedPdfUrl !== audit.signedPdfUrl
        ) {
          toast.success(t('auditDetail.report.pdfReady'));
          return;
        }
      }

      toast.info(t('auditDetail.report.pdfStillProcessing'));
      onRefresh();
    } catch {
      toast.error(t('auditDetail.report.pdfFailed'));
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status card */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-4">
          {audit.isLocked ? (
            <Lock className="w-5 h-5 text-green-600" />
          ) : audit.status === 'IN_PROGRESS' ? (
            <Clock className="w-5 h-5 text-amber-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-blue-600" />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">
              {audit.isLocked
                ? t('auditDetail.report.completedLocked')
                : audit.status === 'IN_PROGRESS'
                  ? t('auditDetail.report.inProgress')
                  : t('auditDetail.report.statusPrefix', {
                      status: audit.status,
                    })}
            </p>
            {audit.signedAt && (
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.report.signedOn', {
                  date: fmt(audit.signedAt),
                })}
              </p>
            )}
          </div>
        </div>

        {snap && (
          <div className="grid grid-cols-3 gap-4 mb-4 text-center border-t border-border pt-4">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {snap.compliancePct}%
              </p>
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.report.compliance')}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {snap.majorFindings}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.report.majorFindings')}
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {snap.totalControls}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.report.controls')}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(audit.status === 'UPCOMING' || audit.status === 'PLANNED') &&
            isAdmin && (
              <Button onClick={handleStart} disabled={acting}>
                {acting
                  ? t('auditDetail.report.starting')
                  : t('auditDetail.report.startAudit')}
              </Button>
            )}
          {audit.status === 'IN_PROGRESS' && canAudit && (
            <>
              <Button
                onClick={handleMoveToAwaitingReport}
                disabled={acting}
                className="bg-purple-700 hover:bg-purple-600"
              >
                {acting
                  ? t('auditDetail.report.movingToAwaitingReport')
                  : t('auditDetail.report.moveToAwaitingReport')}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/auditor/audits/${audit.id}/final-report`)
                }
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                {t('auditDetail.report.finalReport')}
              </Button>
            </>
          )}
          {(audit.status === 'AWAITING_REPORT' ||
            audit.status === 'COMPLETED') && (
            <>
              {canAudit && (
                <Button onClick={handleGeneratePdf} disabled={generatingPdf}>
                  <FileText className="w-4 h-4 mr-1.5" />
                  {generatingPdf
                    ? t('auditDetail.report.generatingPdf')
                    : t('auditDetail.report.generatePdf')}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/auditor/audits/${audit.id}/final-report`)
                }
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                {t('auditDetail.report.viewFinalReport')}
              </Button>
              {audit.signedPdfUrl && (
                <Button variant="outline" asChild>
                  <a
                    href={audit.signedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText className="w-4 h-4 mr-1.5" />
                    {t('auditDetail.report.downloadPdf')}
                  </a>
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Summary fields */}
      {(audit.executiveSummary || audit.auditConclusion) && (
        <Card className="p-5 space-y-4">
          {audit.executiveSummary && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {t('auditDetail.report.executiveSummary')}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {audit.executiveSummary}
              </p>
            </div>
          )}
          {audit.auditConclusion && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {t('auditDetail.report.auditConclusion')}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {audit.auditConclusion}
              </p>
            </div>
          )}
        </Card>
      )}

      {audit.signedPdfUrl && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t('auditDetail.report.pdfPreview')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.report.pdfPreviewDesc')}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a
                href={audit.signedPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('auditDetail.report.openPdf')}
              </a>
            </Button>
          </div>
          <iframe
            src={audit.signedPdfUrl}
            title={t('auditDetail.report.pdfPreview')}
            className="h-[520px] w-full rounded-md border bg-white"
          />
        </Card>
      )}
    </div>
  );
}

// ── Framework / Snapshot-backed Audit Data Tabs ──────────────────────────────
