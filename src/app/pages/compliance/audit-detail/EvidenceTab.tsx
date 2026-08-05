/**
 * audit-detail/EvidenceTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { auditsService, AuditControlRecord } from '@/services/api/audits';
import { useCanAudit } from '@/hooks/useCurrentUser';
import { ControlReviewPanel } from '@/app/pages/auditor/auditorDashboard/ControlReviewPanel';
import { REVIEW_STATUS_COLORS, isoPrefix } from './shared';

export function EvidenceTab({
  auditId,
  isLocked,
}: {
  auditId: string;
  isLocked: boolean;
}) {
  const { t } = useTranslation('compliance');
  const canAudit = useCanAudit();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [reviewingControl, setReviewingControl] =
    useState<AuditControlRecord | null>(null);

  const { data, refetch } = useQuery<{
    success: boolean;
    data: AuditControlRecord[];
  }>({
    queryKey: ['audit-controls', auditId],
    queryFn: () => auditsService.listControls(auditId),
  });

  const controls = data?.data ?? [];

  // Group by ISO prefix
  const folders = new Map<string, AuditControlRecord[]>();
  for (const ctrl of controls) {
    const prefix = isoPrefix(ctrl.control.isoReference);
    if (!folders.has(prefix)) folders.set(prefix, []);
    folders.get(prefix)!.push(ctrl);
  }
  const sortedFolders = [...folders.entries()].sort(([a], [b]) =>
    a.localeCompare(b),
  );

  function toggleFolder(prefix: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(prefix)) next.delete(prefix);
      else next.add(prefix);
      return next;
    });
  }

  function folderColor(ctrls: AuditControlRecord[]): string {
    if (
      ctrls.every(
        (c) =>
          c.reviewStatus === 'COMPLIANT' || c.reviewStatus === 'NOT_APPLICABLE',
      )
    )
      return 'text-green-700';
    if (ctrls.some((c) => c.reviewStatus === 'NON_COMPLIANT'))
      return 'text-red-700';
    if (ctrls.some((c) => c.reviewStatus !== 'PENDING'))
      return 'text-amber-700';
    return 'text-muted-foreground';
  }

  if (controls.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {t('auditDetail.evidence.noControls')}
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card className="divide-y divide-border overflow-hidden">
        {sortedFolders.map(([prefix, ctrls]) => {
          const isOpen = expandedFolders.has(prefix);
          const reviewed = ctrls.filter(
            (c) => c.reviewStatus !== 'PENDING',
          ).length;
          return (
            <div key={prefix}>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 text-left"
                onClick={() => toggleFolder(prefix)}
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
                <span
                  className={`text-xs font-bold font-mono ${folderColor(ctrls)}`}
                >
                  {prefix}
                </span>
                <span className="text-sm font-medium text-foreground flex-1">
                  {ctrls[0]?.control.title.split(' ').slice(0, 4).join(' ')}…
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {t('auditDetail.evidence.reviewedOf', {
                    reviewed,
                    total: ctrls.length,
                  })}
                </span>
              </button>
              {isOpen && (
                <div className="divide-y divide-border bg-muted/20">
                  {ctrls.map((auditCtrl) => (
                    <div
                      key={auditCtrl.id}
                      className="flex items-center gap-3 px-6 py-2.5"
                    >
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-20 flex-shrink-0">
                        {auditCtrl.control.isoReference}
                      </span>
                      <span className="text-sm text-foreground flex-1 truncate">
                        {auditCtrl.control.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${REVIEW_STATUS_COLORS[auditCtrl.reviewStatus] ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        {auditCtrl.reviewStatus.replace('_', ' ')}
                      </span>
                      {/* Evidence readiness badge */}
                      {(() => {
                        const aes = auditCtrl.control.auditEvidences ?? [];
                        const hasFlagged = aes.some(
                          (ae) => ae.status === 'FLAGGED',
                        );
                        const allApproved =
                          aes.length > 0 &&
                          aes.every((ae) => ae.status === 'APPROVED');
                        const hasTests =
                          (auditCtrl.control.testMappings ?? []).length > 0;
                        const hasFailingTests = (
                          auditCtrl.control.testMappings ?? []
                        ).some(
                          (tm) =>
                            tm.test.status === 'Overdue' ||
                            tm.test.status === 'Needs_remediation',
                        );
                        if (hasFlagged)
                          return (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 flex-shrink-0">
                              ⚑ {t('auditDetail.evidence.flagged')}
                            </span>
                          );
                        if (hasTests && hasFailingTests)
                          return (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-700 flex-shrink-0">
                              ✕ {t('auditDetail.evidence.failing')}
                            </span>
                          );
                        if (allApproved)
                          return (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 flex-shrink-0">
                              ✓ {t('auditDetail.evidence.ready')}
                            </span>
                          );
                        return null;
                      })()}
                      {canAudit && !isLocked && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs flex-shrink-0"
                          onClick={() => setReviewingControl(auditCtrl)}
                        >
                          {t('auditDetail.evidence.review')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {reviewingControl && (
        <ControlReviewPanel
          auditControl={reviewingControl}
          auditId={auditId}
          onClose={() => setReviewingControl(null)}
          onUpdated={() => {
            refetch();
            setReviewingControl(null);
          }}
        />
      )}
    </>
  );
}

// ── Findings Tab ──────────────────────────────────────────────────────────────
