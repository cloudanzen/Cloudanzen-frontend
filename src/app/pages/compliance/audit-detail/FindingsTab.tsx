/**
 * audit-detail/FindingsTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { auditsService, AuditRecord } from '@/services/api/audits';
import { useCanAudit } from '@/hooks/useCurrentUser';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { AddFindingModal } from '@/app/pages/auditor/auditorDashboard/AddFindingModal';
import { FINDING_SEVERITY_COLORS, FINDING_STATUS_COLORS } from './shared';

type FindingFilter =
  | 'ALL'
  | 'OPEN'
  | 'IN_REMEDIATION'
  | 'READY_FOR_REVIEW'
  | 'CLOSED';

/** Findings come back without a `status` field on the shared type; the
 * API does send one. Narrow structurally rather than reaching for `any`. */
type WithStatus = { status?: string };

export function FindingsTab({
  audit,
  onRefresh,
}: {
  audit: AuditRecord;
  onRefresh: () => void;
}) {
  const { t } = useTranslation('compliance');
  const canAudit = useCanAudit();
  const confirm = useConfirmDialog();
  const [statusFilter, setStatusFilter] = useState<FindingFilter>('ALL');
  const [showAddFinding, setShowAddFinding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const findings = audit.findings ?? [];
  const controls = audit.auditControls ?? [];

  const filtered =
    statusFilter === 'ALL'
      ? findings
      : findings.filter((f) => (f as WithStatus).status === statusFilter);

  const sorted = [...filtered].sort((a, b) => {
    const order = { MAJOR: 0, MINOR: 1, OBSERVATION: 2, OFI: 3 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });

  async function handleDeleteFinding(findingId: string) {
    const ok = await confirm({
      title: t('auditDetail.findingsTab.deleteFinding'),
      description: t('auditDetail.findingsTab.deleteConfirm'),
      confirmLabel: t('auditDetail.findingsTab.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    setDeletingId(findingId);
    try {
      await auditsService.deleteFinding(audit.id, findingId);
      toast.success(t('auditDetail.findingsTab.findingDeleted'));
      onRefresh();
    } catch {
      toast.error(t('auditDetail.findingsTab.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  }

  const filters: { value: FindingFilter; label: string }[] = [
    { value: 'ALL', label: t('auditDetail.findingsTab.all') },
    { value: 'OPEN', label: t('auditDetail.findingsTab.open') },
    {
      value: 'IN_REMEDIATION',
      label: t('auditDetail.findingsTab.inRemediation'),
    },
    {
      value: 'READY_FOR_REVIEW',
      label: t('auditDetail.findingsTab.readyForReview'),
    },
    { value: 'CLOSED', label: t('auditDetail.findingsTab.closed') },
  ];

  // Get controls in scope for AddFindingModal
  const firstControl = controls[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {canAudit && !audit.isLocked && firstControl && (
          <Button size="sm" onClick={() => setShowAddFinding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            {t('auditDetail.findingsTab.addFinding')}
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {t('auditDetail.findingsTab.noMatch')}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                {(
                  t('auditDetail.findingsTab.columns', {
                    returnObjects: true,
                  }) as string[]
                ).map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((f) => (
                <tr key={f.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-xs font-mono text-blue-700">
                    {f.control?.isoReference ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${FINDING_SEVERITY_COLORS[f.severity] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate">
                    {f.description}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${FINDING_STATUS_COLORS[(f as WithStatus).status ?? 'OPEN'] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {(f as WithStatus).status ?? 'OPEN'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {canAudit && !audit.isLocked && (
                      <button
                        onClick={() => handleDeleteFinding(f.id)}
                        disabled={deletingId === f.id}
                        className="text-muted-foreground/50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showAddFinding && firstControl && (
        <AddFindingModal
          auditId={audit.id}
          auditControlId={firstControl.id}
          controlId={firstControl.control.id}
          controlRef={firstControl.control.isoReference}
          onClose={() => setShowAddFinding(false)}
          onSaved={() => {
            setShowAddFinding(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}

// ── Requests / Evidence Tracker Tab ──────────────────────────────────────────
