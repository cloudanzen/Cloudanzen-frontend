/**
 * audit-detail/RequestsTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import {
  auditsService,
  AuditRecord,
  AuditRequestRecord,
} from '@/services/api/audits';
import { useCanAudit } from '@/hooks/useCurrentUser';
import { AuditRequestCreateModal } from '../AuditRequestCreateModal';
import { type AuditorIdentity } from '@/lib/audits';
import { fmt } from '../AuditDetailPanel';
import { RequestStatusBadge } from './shared';

export function RequestsTab({
  audit,
  users,
  highlightRequestId,
}: {
  audit: AuditRecord;
  users: AuditorIdentity[];
  highlightRequestId?: string | null;
}) {
  const { t } = useTranslation('compliance');
  const canAudit = useCanAudit();
  const controls = audit.auditControls ?? [];
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(
    null,
  );
  // Highlight target = explicit pending (from create flow) OR url param.
  const activeHighlight = pendingHighlightId ?? highlightRequestId ?? null;

  const { data: requestsData } = useQuery<{
    success: boolean;
    data: AuditRequestRecord[];
  }>({
    queryKey: ['audit-requests', audit.id],
    queryFn: () => auditsService.listRequests(audit.id),
  });

  // Scroll + flash the highlighted row once its DOM node exists. `useEffect`
  // re-runs when the requests list changes — covers both deep-link mount and
  // the create-flow case where the row appears after a re-fetch.
  const requestsForEffect = requestsData?.data;
  useEffect(() => {
    if (!activeHighlight || !requestsForEffect) return;
    if (!requestsForEffect.some((r) => r.id === activeHighlight)) return;
    const node = document.getElementById(`audit-request-${activeHighlight}`);
    if (!node) return;
    requestAnimationFrame(() => {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      node.classList.add('ring-2', 'ring-amber-300', 'bg-amber-50');
      setTimeout(() => {
        node.classList.remove('ring-2', 'ring-amber-300', 'bg-amber-50');
        // Clear the pending state so a subsequent create can re-trigger.
        setPendingHighlightId((cur) => (cur === activeHighlight ? null : cur));
      }, 3000);
    });
  }, [activeHighlight, requestsForEffect]);

  const { data: summaryData } = useQuery({
    queryKey: ['audit-evidence-summary', audit.id],
    queryFn: () => auditsService.getEvidenceSummary(audit.id),
  });

  const requests = requestsData?.data ?? [];
  const summary = summaryData?.data;

  function controlLabel(controlId: string | null | undefined) {
    if (!controlId) return t('auditDetail.requests.auditLevel');
    const control = controls.find(
      (item) => item.control.id === controlId,
    )?.control;
    return control ? `${control.isoReference} · ${control.title}` : controlId;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('auditDetail.requests.totalRequests')}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {requests.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('auditDetail.requests.evidenceItems')}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {summary?.totals.total ?? 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('auditDetail.requests.flagged')}
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {summary?.totals.byStatus.FLAGGED ?? 0}
          </p>
        </Card>
      </div>

      <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p>{t('auditDetail.requests.helper.assigneeFlow')}</p>
        <p>{t('auditDetail.requests.helper.unassignedStays')}</p>
        <p>{t('auditDetail.requests.helper.evidenceTrackerNote')}</p>
      </div>

      {canAudit && !audit.isLocked && (
        <div className="flex justify-end">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            {t('auditDetail.requests.newRequestButton')}
          </Button>
        </div>
      )}

      {createOpen && (
        <AuditRequestCreateModal
          auditId={audit.id}
          controls={controls}
          users={users}
          onClose={() => setCreateOpen(false)}
          onCreated={(createdId) => {
            setCreateOpen(false);
            if (createdId) setPendingHighlightId(createdId);
          }}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('auditDetail.requests.requestsTitle')}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {requests.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {t('auditDetail.requests.noRequests')}
              </p>
            ) : (
              requests.map((item) => (
                <Link
                  key={item.id}
                  id={`audit-request-${item.id}`}
                  to={`/compliance/audits/${audit.id}/requests/${item.id}`}
                  className="block space-y-3 p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {controlLabel(item.controlId)}
                      </p>
                    </div>
                    <RequestStatusBadge status={item.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {item.assignee?.name ??
                        item.assignee?.email ??
                        t('auditDetail.requests.unassigned')}
                    </span>
                    <span>
                      {t('auditDetail.requests.due')}: {fmt(item.dueDate)}
                    </span>
                    <span>
                      {t('auditDetail.requests.linkedEvidence', {
                        count: item.evidenceLinks?.length ?? 0,
                      })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t('auditDetail.requests.evidenceTracker')}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {(summary?.items ?? []).length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {t('auditDetail.requests.noEvidence')}
              </p>
            ) : (
              (summary?.items ?? []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.evidence.fileName ?? item.evidence.type}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.control.isoReference} · {item.control.title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('auditDetail.requests.requestLinks', {
                        count: item.requests.length,
                      })}{' '}
                      ·{' '}
                      {t('auditDetail.requests.comments', {
                        count: item.commentCount,
                      })}
                    </p>
                  </div>
                  <RequestStatusBadge status={item.trackerStatus} />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Comments Tab ──────────────────────────────────────────────────────────────
