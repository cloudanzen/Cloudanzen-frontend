/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Link } from 'react-router';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Lock,
  Plus,
  Send,
  Trash2,
  ClipboardList,
  FileText,
  AlertCircle,
  Clock,
  Building2,
  Camera,
  Eye,
} from 'lucide-react';
import type { RiskSnapshotRecord } from '@/services/api/risks';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import {
  auditsService,
  AuditRecord,
  AuditControlRecord,
  AuditStatus,
  AuditComment,
  AuditRequestRecord,
  AuditRequestStatus,
  AuditDataSnapshotType,
  AuditFrameworkResponse,
  AuditSummaryResponse,
  AuditorInvitationRecord,
} from '@/services/api/audits';
import { usersService } from '@/services/api/users';
import { vendorsService, VendorRecord } from '@/services/api/vendors';
import {
  useCanAudit,
  useCurrentUser,
  useIsAdmin,
} from '@/hooks/useCurrentUser';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { ControlReviewPanel } from '@/app/pages/auditor/auditorDashboard/ControlReviewPanel';
import { AddFindingModal } from '@/app/pages/auditor/auditorDashboard/AddFindingModal';
import { resolveAuditorLabel, type AuditorIdentity } from '@/lib/audits';
import { AUDIT_TYPE_KEYS, StatusBadge, fmt } from './AuditDetailPanel';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoPrefix(ref: string): string {
  // "A.5.15" → "A.5", "CC1.1" → "CC1", "8.1" → "8"
  const m = ref.match(/^([A-Za-z]+\.\d+|\d+)/);
  return m ? (m[1] ?? ref) : ref.split('.').slice(0, 2).join('.');
}

const REVIEW_STATUS_COLORS: Record<string, string> = {
  COMPLIANT: 'bg-green-50 text-green-700',
  NON_COMPLIANT: 'bg-red-50 text-red-700',
  NOT_APPLICABLE: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-gray-100 text-gray-500',
};

const FINDING_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-orange-50 text-orange-700',
  IN_REMEDIATION: 'bg-blue-50 text-blue-700',
  READY_FOR_REVIEW: 'bg-purple-50 text-purple-700',
  CLOSED: 'bg-green-50 text-green-700',
};

const FINDING_SEVERITY_COLORS: Record<string, string> = {
  MAJOR: 'bg-red-50 text-red-700',
  MINOR: 'bg-amber-50 text-amber-700',
  OBSERVATION: 'bg-blue-50 text-blue-700',
  OFI: 'bg-slate-100 text-slate-600',
};

const REQUEST_STATUS_COLORS: Record<AuditRequestStatus, string> = {
  NOT_READY: 'bg-slate-100 text-slate-600',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  READY_FOR_AUDIT: 'bg-purple-50 text-purple-700',
  FLAGGED: 'bg-amber-50 text-amber-700',
  ACCEPTED: 'bg-green-50 text-green-700',
  NOT_APPLICABLE: 'bg-gray-100 text-gray-500',
};

const REQUEST_STATUS_OPTIONS: AuditRequestStatus[] = [
  'NOT_READY',
  'IN_REVIEW',
  'READY_FOR_AUDIT',
  'FLAGGED',
  'ACCEPTED',
  'NOT_APPLICABLE',
];

// ── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  audit,
  usersById,
}: {
  audit: AuditRecord;
  usersById: Map<string, AuditorIdentity>;
}) {
  const { t } = useTranslation('compliance');
  const controls = audit.auditControls ?? [];
  const findings = audit.findings ?? [];
  const snap = audit.snapshot;

  const total = controls.length;
  const reviewed = controls.filter((c) => c.reviewStatus !== 'PENDING').length;
  const compliant = controls.filter(
    (c) => c.reviewStatus === 'COMPLIANT',
  ).length;
  const nonCompliant = controls.filter(
    (c) => c.reviewStatus === 'NON_COMPLIANT',
  ).length;
  const notApplicable = controls.filter(
    (c) => c.reviewStatus === 'NOT_APPLICABLE',
  ).length;
  const pending = controls.filter((c) => c.reviewStatus === 'PENDING').length;

  const reviewedPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const closedFindings = findings.filter(
    (f) => (f as any).status === 'CLOSED',
  ).length;
  const findingPct =
    findings.length > 0
      ? Math.round((closedFindings / findings.length) * 100)
      : 0;
  const compliancePct =
    snap?.compliancePct ??
    (total > 0 ? Math.round((compliant / total) * 100) : 0);

  const majorCount = findings.filter((f) => f.severity === 'MAJOR').length;
  const minorCount = findings.filter((f) => f.severity === 'MINOR').length;
  const obsCount = findings.filter((f) => f.severity === 'OBSERVATION').length;
  const ofiCount = findings.filter((f) => f.severity === 'OFI').length;

  return (
    <div className="space-y-4">
      {/* Readiness bars */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {t('auditDetail.overview.readiness')}
        </h3>
        <div className="space-y-4">
          {[
            {
              label: t('auditDetail.overview.controlsReviewed'),
              value: reviewedPct,
              sub: t('auditDetail.overview.reviewedOf', { reviewed, total }),
            },
            {
              label: t('auditDetail.overview.complianceRate'),
              value: compliancePct,
              sub: t('auditDetail.overview.compliantCount', {
                count: compliant,
              }),
            },
            {
              label: t('auditDetail.overview.findingsResolved'),
              value: findingPct,
              sub:
                findings.length > 0
                  ? t('auditDetail.overview.closedOf', {
                      closed: closedFindings,
                      total: findings.length,
                    })
                  : t('auditDetail.overview.noFindings'),
            },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">
                  {bar.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {bar.sub} · {bar.value}%
                </span>
              </div>
              <Progress value={bar.value} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Control status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: t('auditDetail.overview.compliant'),
            value: compliant,
            color: 'text-green-700',
          },
          {
            label: t('auditDetail.overview.nonCompliant'),
            value: nonCompliant,
            color: 'text-red-700',
          },
          {
            label: t('auditDetail.overview.na'),
            value: notApplicable,
            color: 'text-slate-500',
          },
          {
            label: t('auditDetail.overview.pending'),
            value: pending,
            color: 'text-muted-foreground',
          },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">
              {s.label}
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Finding severity breakdown */}
      {findings.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {t('auditDetail.overview.findings')}
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: t('auditDetail.overview.major'),
                value: majorCount,
                color: 'text-red-700',
              },
              {
                label: t('auditDetail.overview.minor'),
                value: minorCount,
                color: 'text-amber-700',
              },
              {
                label: t('auditDetail.overview.observation'),
                value: obsCount,
                color: 'text-blue-700',
              },
              {
                label: t('auditDetail.overview.ofi'),
                value: ofiCount,
                color: 'text-slate-500',
              },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t('auditDetail.overview.timeline')}
        </h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">
              {t('auditDetail.overview.startDate')}
            </p>
            <p className="font-medium">{fmt(audit.startDate)}</p>
          </div>
          {audit.periodStart && (
            <div>
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.overview.auditPeriod')}
              </p>
              <p className="font-medium">
                {fmt(audit.periodStart)} → {fmt(audit.periodEnd)}
              </p>
            </div>
          )}
          {audit.endDate && (
            <div>
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.overview.endDate')}
              </p>
              <p className="font-medium">{fmt(audit.endDate)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">
              {t('auditPanel.auditor')}
            </p>
            <p className="font-medium">
              {resolveAuditorLabel(audit, usersById)}
            </p>
          </div>
          {audit.closedAt && (
            <div>
              <p className="text-xs text-muted-foreground">
                {t('auditDetail.overview.closed')}
              </p>
              <p className="font-medium text-green-700">
                {fmt(audit.closedAt)}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: AuditRequestStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_STATUS_COLORS[status]}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

// ── Evidence Tab (ISO category folders) ──────────────────────────────────────

function EvidenceTab({
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

type FindingFilter =
  | 'ALL'
  | 'OPEN'
  | 'IN_REMEDIATION'
  | 'READY_FOR_REVIEW'
  | 'CLOSED';

function FindingsTab({
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
      : findings.filter((f) => (f as any).status === statusFilter);

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
                      className={`px-2 py-0.5 rounded text-xs font-medium ${FINDING_STATUS_COLORS[(f as any).status] ?? 'bg-gray-100 text-gray-600'}`}
                    >
                      {(f as any).status ?? 'OPEN'}
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

function RequestsTab({
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
  const queryClient = useQueryClient();
  const controls = audit.auditControls ?? [];
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [pendingHighlightId, setPendingHighlightId] = useState<string | null>(
    null,
  );
  // Highlight target = explicit pending (from create flow) OR url param.
  const activeHighlight = pendingHighlightId ?? highlightRequestId ?? null;
  const [form, setForm] = useState({
    title: '',
    controlId: '',
    assignedTo: '',
    dueDate: '',
  });

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

  function refreshTracker() {
    queryClient.invalidateQueries({ queryKey: ['audit-requests', audit.id] });
    queryClient.invalidateQueries({
      queryKey: ['audit-evidence-summary', audit.id],
    });
  }

  function controlLabel(controlId: string | null | undefined) {
    if (!controlId) return t('auditDetail.requests.auditLevel');
    const control = controls.find(
      (item) => item.control.id === controlId,
    )?.control;
    return control ? `${control.isoReference} · ${control.title}` : controlId;
  }

  async function handleCreateRequest() {
    if (!form.title.trim()) return;
    setCreating(true);
    const wasAssigned = Boolean(form.assignedTo);
    try {
      const result = await auditsService.createRequest(audit.id, {
        title: form.title.trim(),
        controlId: form.controlId || null,
        assignedTo: form.assignedTo || null,
        dueDate: form.dueDate || null,
      });
      const createdId = result?.data?.id ?? null;
      setForm({ title: '', controlId: '', assignedTo: '', dueDate: '' });
      refreshTracker();
      if (createdId) {
        // Trigger highlight effect once the list re-fetches with this id.
        setPendingHighlightId(createdId);
      }
      toast.success(
        wasAssigned
          ? t('auditDetail.requests.createdAssigned')
          : t('auditDetail.requests.created'),
      );
    } catch {
      toast.error(t('auditDetail.requests.createFailed'));
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(
    requestId: string,
    status: AuditRequestStatus,
  ) {
    setUpdatingId(requestId);
    try {
      await auditsService.updateRequest(audit.id, requestId, { status });
      refreshTracker();
    } catch {
      toast.error(t('auditDetail.requests.updateFailed'));
    } finally {
      setUpdatingId(null);
    }
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
        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_0.8fr_auto]">
            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder={t('auditDetail.requests.titlePlaceholder')}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <select
              value={form.controlId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, controlId: event.target.value }))
              }
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">{t('auditDetail.requests.auditLevel')}</option>
              {controls.map((control) => (
                <option key={control.control.id} value={control.control.id}>
                  {control.control.isoReference} · {control.control.title}
                </option>
              ))}
            </select>
            <select
              value={form.assignedTo}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, assignedTo: event.target.value }))
              }
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">{t('auditDetail.requests.unassigned')}</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name ?? user.email}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.dueDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dueDate: event.target.value }))
              }
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              aria-label={t('auditDetail.requests.dueDate')}
            />
            <Button
              onClick={handleCreateRequest}
              disabled={!form.title.trim() || creating}
            >
              <Plus className="mr-1 h-4 w-4" />
              {creating
                ? t('auditDetail.requests.creating')
                : t('auditDetail.requests.create')}
            </Button>
          </div>
        </Card>
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
                <div
                  key={item.id}
                  id={`audit-request-${item.id}`}
                  className="space-y-3 p-4 rounded-md transition-shadow"
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
                  {!audit.isLocked && (
                    <select
                      value={item.status}
                      disabled={updatingId === item.id}
                      onChange={(event) =>
                        handleStatusChange(
                          item.id,
                          event.target.value as AuditRequestStatus,
                        )
                      }
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      {REQUEST_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
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

function CommentsTab({
  auditId,
  controls,
}: {
  auditId: string;
  controls: AuditControlRecord[];
}) {
  const { t } = useTranslation('compliance');
  const me = useCurrentUser();
  const canAudit = useCanAudit();
  const confirm = useConfirmDialog();
  const [selectedControlId, setSelectedControlId] = useState<string>('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const { data, refetch } = useQuery<{
    success: boolean;
    data: AuditComment[];
  }>({
    queryKey: ['audit-comments', auditId, selectedControlId || null],
    queryFn: () =>
      auditsService.listComments(
        auditId,
        selectedControlId ? { controlId: selectedControlId } : undefined,
      ),
  });

  const comments = data?.data ?? [];

  async function handlePost() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await auditsService.postComment(auditId, {
        text: text.trim(),
        controlId: selectedControlId || null,
      });
      setText('');
      refetch();
    } catch {
      toast.error(t('auditDetail.comments.postFailed'));
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(commentId: string) {
    const ok = await confirm({
      title: t('auditDetail.comments.deleteComment'),
      description: t('auditDetail.comments.deleteConfirm'),
      confirmLabel: t('auditDetail.comments.delete'),
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await auditsService.deleteComment(auditId, commentId);
      refetch();
    } catch {
      toast.error(t('auditDetail.comments.deleteFailed'));
    }
  }

  function initials(name: string | null | undefined, email: string): string {
    if (name)
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-4">
      {/* Control filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t('auditDetail.comments.filterByControl')}
        </label>
        <select
          value={selectedControlId}
          onChange={(e) => setSelectedControlId(e.target.value)}
          className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
        >
          <option value="">{t('auditDetail.comments.allComments')}</option>
          {controls.map((c) => (
            <option key={c.control.id} value={c.control.id}>
              {c.control.isoReference} — {c.control.title.slice(0, 40)}
            </option>
          ))}
        </select>
      </div>

      {/* Comment list */}
      <Card className="p-4 space-y-4 min-h-[200px]">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t('auditDetail.comments.noComments')}
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                {initials(c.author?.name, c.author?.email ?? '')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-foreground">
                    {c.author?.name ?? c.author?.email}
                  </span>
                  {c.author?.role === 'AUDITOR' && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">
                      {t('auditDetail.comments.auditor')}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {me?.id === c.authorId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="ml-auto text-muted-foreground/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground">{c.text}</p>
                {c.controlId && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Re:{' '}
                    {controls.find((ctrl) => ctrl.control.id === c.controlId)
                      ?.control.isoReference ?? c.controlId}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Post box */}
      {canAudit && (
        <div className="flex gap-2">
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('auditDetail.comments.placeholder')}
            className="flex-1 text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button
            size="sm"
            disabled={!text.trim() || posting}
            onClick={handlePost}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Report Tab ────────────────────────────────────────────────────────────────

function ReportTab({
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

function BreakdownChips({ data }: { data?: Record<string, number> }) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(data).map(([key, value]) => (
        <span
          key={key}
          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
        >
          {key.replaceAll('_', ' ')}: {value}
        </span>
      ))}
    </div>
  );
}

function FrameworkTab({ auditId }: { auditId: string }) {
  const { t } = useTranslation('compliance');
  const { data, isLoading } = useQuery<{
    success: boolean;
    data: AuditFrameworkResponse;
  }>({
    queryKey: ['audit-framework', auditId],
    queryFn: () => auditsService.getFramework(auditId),
  });

  const framework = data?.data.framework;
  const requirements = data?.data.requirements ?? [];

  if (isLoading)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        {t('auditDetail.dataTabs.loading')}
      </Card>
    );
  if (!framework)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        {t('auditDetail.dataTabs.noFramework')}
      </Card>
    );

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('auditDetail.tabs.framework')}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">
          {framework.name}
        </h3>
        <p className="text-sm text-muted-foreground">{framework.version}</p>
      </Card>
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {requirements.map((req) => {
            const active =
              req.auditControlCount - req.notApplicableControlCount;
            const pct =
              active > 0
                ? Math.round((req.compliantControlCount / active) * 100)
                : 0;
            return (
              <div key={req.frameworkRequirementId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {req.code} · {req.title}
                    </p>
                    {req.domain && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {req.domain}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {pct}%
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                  <span>
                    {t('auditDetail.overview.compliant')}:{' '}
                    {req.compliantControlCount}
                  </span>
                  <span>
                    {t('auditDetail.overview.nonCompliant')}:{' '}
                    {req.nonCompliantControlCount}
                  </span>
                  <span>
                    {t('auditDetail.overview.pending')}:{' '}
                    {req.pendingControlCount}
                  </span>
                  <span>
                    {t('auditDetail.overview.na')}:{' '}
                    {req.notApplicableControlCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function SnapshotSummaryCard({ auditId }: { auditId: string }) {
  const { t } = useTranslation('compliance');
  const [selected, setSelected] = useState<AuditDataSnapshotType>('START');
  const { data: snapshotsData } = useQuery({
    queryKey: ['audit-snapshots', auditId],
    queryFn: () => auditsService.listSnapshots(auditId),
  });
  const { data: snapshotData } = useQuery({
    queryKey: ['audit-snapshot', auditId, selected],
    queryFn: () => auditsService.getSnapshot(auditId, selected),
    enabled: (snapshotsData?.data ?? []).some(
      (snapshot) => snapshot.snapshotType === selected,
    ),
  });

  const snapshots = snapshotsData?.data ?? [];
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {t('auditDetail.dataTabs.snapshots')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('auditDetail.dataTabs.snapshotsDesc')}
          </p>
        </div>
        <select
          aria-label={t('auditDetail.dataTabs.snapshotSelector')}
          value={selected}
          onChange={(event) =>
            setSelected(event.target.value as AuditDataSnapshotType)
          }
          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="START">START</option>
          <option value="COMPLETION">COMPLETION</option>
        </select>
      </div>
      {snapshots.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t('auditDetail.dataTabs.noSnapshots')}
        </p>
      ) : snapshotData?.data ? (
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <span>
            {t('auditDetail.tabs.risk')}:{' '}
            {(snapshotData.data.riskRegister as any)?.total ?? 0}
          </span>
          <span>
            {t('auditDetail.tabs.assets')}:{' '}
            {(snapshotData.data.assetInventory as any)?.total ?? 0}
          </span>
          <span>
            {t('auditDetail.tabs.personnel')}:{' '}
            {(snapshotData.data.personnel as any)?.total ?? 0}
          </span>
          <span>
            {t('auditDetail.tabs.integrations')}:{' '}
            {(snapshotData.data.integrations as any)?.total ?? 0}
          </span>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {t('auditDetail.dataTabs.snapshotMissing')}
        </p>
      )}
    </Card>
  );
}

// Shared risk snapshots (RiskSnapshot, NOT AuditDataSnapshot). Lists the
// snapshots the org has explicitly shared AND that fall inside this audit's
// observation window. Mirrors what the assigned AUDITOR sees on /auditor/dashboard
// so org admins can verify share state without role-switching. Hits the same
// GET /api/audits/:id/risk-snapshots endpoint.
function SharedRiskSnapshotsCard({ auditId }: { auditId: string }) {
  const { t } = useTranslation('compliance');
  const { data, isLoading, isError } = useQuery<{
    success: boolean;
    data: RiskSnapshotRecord[];
  }>({
    queryKey: QK.auditorRiskSnapshots(auditId),
    queryFn: () => auditsService.listRiskSnapshots(auditId),
    staleTime: STALE.RISKS,
  });

  const snapshots = data?.data ?? [];

  return (
    <Card className="overflow-hidden">
      <div className="border-b px-5 py-3 flex items-center gap-2">
        <Camera className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {t('auditDetail.riskTab.sharedSnapshots.title')}
        </span>
        <Badge variant="secondary" className="ml-auto">
          {snapshots.length}
        </Badge>
      </div>
      <p className="px-5 pt-3 text-xs text-muted-foreground">
        {t('auditDetail.riskTab.sharedSnapshots.description')}
      </p>
      {isLoading ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          {t('auditDetail.riskTab.sharedSnapshots.loading')}
        </p>
      ) : isError ? (
        <p className="p-6 text-center text-sm text-red-500">
          {t('auditDetail.riskTab.sharedSnapshots.loadFailed')}
        </p>
      ) : snapshots.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          {t('auditDetail.riskTab.sharedSnapshots.empty')}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {snapshots.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {new Date(s.createdAt).toLocaleString()} ·{' '}
                  {t('auditDetail.riskTab.sharedSnapshots.riskCount', {
                    count: s.riskCount,
                  })}
                </p>
              </div>
              <Link
                to={`/auditor/audits/${auditId}/risk-snapshots/${s.id}`}
                className="inline-flex items-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                {t('auditDetail.riskTab.sharedSnapshots.view')}
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DataSummaryTab({
  auditId,
  type,
}: {
  auditId: string;
  type: 'risk' | 'assets' | 'personnel' | 'integrations';
}) {
  const { t } = useTranslation('compliance');
  const query = useQuery<{ success: boolean; data: AuditSummaryResponse }>({
    queryKey: ['audit-data-summary', auditId, type],
    queryFn: () => {
      if (type === 'risk') return auditsService.getRiskSummary(auditId);
      if (type === 'assets') return auditsService.getAssetSummary(auditId);
      if (type === 'personnel')
        return auditsService.getPersonnelSummary(auditId);
      return auditsService.getIntegrationSummary(auditId);
    },
  });

  const data = query.data?.data;
  const rows = (data?.risks ??
    data?.assets ??
    data?.personnel ??
    data?.integrations ??
    []) as any[];

  if (query.isLoading)
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        {t('auditDetail.dataTabs.loading')}
      </Card>
    );

  return (
    <div className="space-y-4">
      <SnapshotSummaryCard auditId={auditId} />
      {type === 'risk' && <SharedRiskSnapshotsCard auditId={auditId} />}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('auditDetail.dataTabs.currentTotal')}
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {data?.total ?? 0}
          </p>
        </Card>
        <Card className="p-4 sm:col-span-2">
          <BreakdownChips
            data={
              data?.byStatus ??
              data?.byImpact ??
              data?.byCriticality ??
              data?.byRole ??
              data?.byType
            }
          />
        </Card>
      </div>
      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t('auditDetail.dataTabs.noRows')}
          </p>
        ) : (
          <div className="divide-y divide-border">
            {rows.slice(0, 25).map((row, index) => (
              <div
                key={row.id ?? index}
                className="flex items-center justify-between gap-3 p-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">
                    {row.title ??
                      row.name ??
                      row.email ??
                      row.provider ??
                      row.id}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.status ?? row.role ?? row.type ?? row.impact ?? '—'}
                  </p>
                </div>
                {(row.riskScore ||
                  row.criticality ||
                  row.mfaEnabled !== undefined) && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {row.riskScore ??
                      row.criticality ??
                      (row.mfaEnabled ? 'MFA' : 'No MFA')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Vendors Tab ───────────────────────────────────────────────────────────────

const VENDOR_STATUS_COLORS: Record<string, string> = {
  MONITORED: 'bg-green-50 text-green-700',
  ASSESSMENT_DUE: 'bg-amber-50 text-amber-700',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
  BLOCKED: 'bg-red-50 text-red-700',
};

const VENDOR_TIER_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-700',
  HIGH: 'bg-orange-50 text-orange-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  LOW: 'bg-slate-100 text-slate-600',
};

function VendorsTab() {
  const { t } = useTranslation('compliance');
  const { data, isLoading } = useQuery<VendorRecord[]>({
    queryKey: ['vendors'],
    queryFn: () => vendorsService.list(),
  });
  const vendors = data ?? [];

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {t('auditDetail.vendors.loading')}
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        {t('auditDetail.vendors.noVendors')}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center gap-2">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {t('auditDetail.vendors.rosterTitle')}
        </span>
        <Badge variant="secondary" className="ml-auto">
          {vendors.length}
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.vendor')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.tier')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.status')}
              </th>
              <th className="px-4 py-2 text-right font-medium">
                {t('auditDetail.vendors.columns.securityScore')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.lastAssessment')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {t('auditDetail.vendors.columns.nextDue')}
              </th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              // Vanta-parity rollout: legacy `tier`/`securityScore`/`openFindings`
              // were dropped from Vendor. Show effective tier (residual ?? inherent)
              // and inherent score; finding counts are now derived from a join
              // and intentionally omitted from this audit-side summary.
              const effectiveTier =
                v.residualTier ?? v.inherentTier ?? 'MEDIUM';
              return (
                <tr
                  key={v.id}
                  className="border-b last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.category}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VENDOR_TIER_COLORS[effectiveTier] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {effectiveTier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VENDOR_STATUS_COLORS[v.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {v.inherentRiskScore ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmt(v.lastAssessmentAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmt(v.nextAssessmentAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AuditorInvitationsDialog({
  auditId,
  open,
  onOpenChange,
}: {
  auditId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation('compliance');
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'LEAD' | 'REVIEWER'>('REVIEWER');
  const [saving, setSaving] = useState(false);

  const { data } = useQuery<{
    success: boolean;
    data: AuditorInvitationRecord[];
  }>({
    queryKey: ['audit-invitations', auditId],
    queryFn: () => auditsService.listInvitations(auditId),
    enabled: open,
  });

  const invitations = data?.data ?? [];

  async function inviteAuditor() {
    if (!email.trim()) return;
    setSaving(true);
    try {
      await auditsService.createInvitation(auditId, {
        email: email.trim(),
        role,
      });
      toast.success(t('auditDetail.invitations.sent'));
      setEmail('');
      setRole('REVIEWER');
      queryClient.invalidateQueries({
        queryKey: ['audit-invitations', auditId],
      });
    } catch {
      toast.error(t('auditDetail.invitations.sendFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function revokeInvitation(invitationId: string) {
    try {
      await auditsService.revokeInvitation(auditId, invitationId);
      toast.success(t('auditDetail.invitations.revoked'));
      queryClient.invalidateQueries({
        queryKey: ['audit-invitations', auditId],
      });
    } catch {
      toast.error(t('auditDetail.invitations.revokeFailed'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('auditDetail.invitations.title')}</DialogTitle>
          <DialogDescription>
            {t('auditDetail.invitations.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
          <div className="space-y-1.5">
            <Label htmlFor="auditor-email">
              {t('auditDetail.invitations.email')}
            </Label>
            <Input
              id="auditor-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="auditor@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="auditor-role">
              {t('auditDetail.invitations.role')}
            </Label>
            <select
              id="auditor-role"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(event) =>
                setRole(event.target.value as 'LEAD' | 'REVIEWER')
              }
            >
              <option value="REVIEWER">
                {t('auditDetail.invitations.reviewer')}
              </option>
              <option value="LEAD">{t('auditDetail.invitations.lead')}</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={inviteAuditor} disabled={saving || !email.trim()}>
              <Send className="mr-1 h-4 w-4" />
              {saving
                ? t('auditDetail.invitations.sending')
                : t('auditDetail.invitations.send')}
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          {invitations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              {t('auditDetail.invitations.empty')}
            </p>
          ) : (
            invitations.map((invitation) => {
              const status = invitation.revokedAt
                ? t('auditDetail.invitations.revokedStatus')
                : invitation.acceptedAt
                  ? t('auditDetail.invitations.acceptedStatus')
                  : t('auditDetail.invitations.pendingStatus');
              return (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between gap-3 border-b p-3 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium">{invitation.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {invitation.role} · {status} ·{' '}
                      {t('auditDetail.invitations.expires', {
                        date: fmt(invitation.expiresAt),
                      })}
                    </p>
                  </div>
                  {!invitation.revokedAt && !invitation.acceptedAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeInvitation(invitation.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      {t('auditDetail.invitations.revoke')}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('auditDetail.invitations.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AuditDetailPage() {
  const { t } = useTranslation('compliance');
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canInviteAuditors = useIsAdmin();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // URL-aware tab state. Deep-links like `?tab=requests&requestId=...` open
  // the right tab + highlight the right row (see RequestsTab below).
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') ?? 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl);
  useEffect(() => {
    const next = searchParams.get('tab');
    if (!next) return;
    // Functional update so we don't have to depend on activeTab — avoids
    // a re-sync loop when our own onValueChange flushes the param back.
    setActiveTab((prev) => (next !== prev ? next : prev));
  }, [searchParams]);
  function handleTabChange(value: string) {
    setActiveTab(value);
    setSearchParams(
      (prev) => {
        prev.set('tab', value);
        return prev;
      },
      { replace: true },
    );
  }
  const requestIdFromUrl = searchParams.get('requestId') ?? null;

  const { data, isLoading } = useQuery<{ success: boolean; data: AuditRecord }>(
    {
      queryKey: ['audit', auditId],
      queryFn: () => auditsService.get(auditId!),
      enabled: !!auditId,
    },
  );
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  const audit = data?.data;
  const usersById = new Map(users.map((user) => [user.id, user] as const));

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    queryClient.invalidateQueries({ queryKey: ['audits'] });
  }

  if (isLoading) {
    return (
      <PageTemplate title={t('auditDetail.loading')} description="">
        <div className="p-8 text-center text-sm text-muted-foreground">
          {t('auditDetail.loadingAudit')}
        </div>
      </PageTemplate>
    );
  }

  if (!audit) {
    return (
      <PageTemplate title={t('auditDetail.notFound')} description="">
        <div className="p-8 text-center text-sm text-muted-foreground">
          {t('auditDetail.auditNotFound')}
        </div>
      </PageTemplate>
    );
  }

  const controls = audit.auditControls ?? [];

  const descriptionStr = [
    t(`auditPanel.typeLabels.${AUDIT_TYPE_KEYS[audit.type]}`),
    audit.frameworkName,
    audit.isLocked ? t('auditDetail.locked') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PageTemplate
      title={audit.name}
      description={descriptionStr}
      actions={
        <div className="flex items-center gap-2">
          {canInviteAuditors && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteDialogOpen(true)}
            >
              <Send className="w-4 h-4 mr-1" />
              {t('auditDetail.invitations.invite')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/auditor/dashboard?auditId=${audit.id}`)}
            title={t('auditDetail.previewAsAuditor.tooltip')}
          >
            <Eye className="w-4 h-4 mr-1" />
            {t('auditDetail.previewAsAuditor.label')}
          </Button>
          <StatusBadge status={audit.status as AuditStatus} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compliance/audits')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('auditDetail.back')}
          </Button>
        </div>
      }
    >
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="overview">
            {t('auditDetail.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="evidence">
            {t('auditDetail.tabs.evidence')}
          </TabsTrigger>
          <TabsTrigger value="requests">
            <ClipboardList className="w-3.5 h-3.5 mr-1" />
            {t('auditDetail.tabs.requests')}
          </TabsTrigger>
          <TabsTrigger value="findings">
            {t('auditDetail.tabs.findings')}
            {(audit.findings ?? []).length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-xs"
              >
                {(audit.findings ?? []).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments">
            {t('auditDetail.tabs.comments')}
          </TabsTrigger>
          <TabsTrigger value="report">
            {t('auditDetail.tabs.report')}
          </TabsTrigger>
          <TabsTrigger value="framework">
            {t('auditDetail.tabs.framework')}
          </TabsTrigger>
          <TabsTrigger value="risk">{t('auditDetail.tabs.risk')}</TabsTrigger>
          <TabsTrigger value="assets">
            {t('auditDetail.tabs.assets')}
          </TabsTrigger>
          <TabsTrigger value="personnel">
            {t('auditDetail.tabs.personnel')}
          </TabsTrigger>
          <TabsTrigger value="integrations">
            {t('auditDetail.tabs.integrations')}
          </TabsTrigger>
          <TabsTrigger value="vendors">
            <Building2 className="w-3.5 h-3.5 mr-1" />
            {t('auditDetail.tabs.vendors')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab audit={audit} usersById={usersById} />
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceTab auditId={audit.id} isLocked={audit.isLocked} />
        </TabsContent>

        <TabsContent value="requests">
          <RequestsTab
            audit={audit}
            users={users}
            highlightRequestId={requestIdFromUrl}
          />
        </TabsContent>

        <TabsContent value="findings">
          <FindingsTab audit={audit} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsTab auditId={audit.id} controls={controls} />
        </TabsContent>

        <TabsContent value="report">
          <ReportTab audit={audit} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="framework">
          <FrameworkTab auditId={audit.id} />
        </TabsContent>

        <TabsContent value="risk">
          <DataSummaryTab auditId={audit.id} type="risk" />
        </TabsContent>

        <TabsContent value="assets">
          <DataSummaryTab auditId={audit.id} type="assets" />
        </TabsContent>

        <TabsContent value="personnel">
          <DataSummaryTab auditId={audit.id} type="personnel" />
        </TabsContent>

        <TabsContent value="integrations">
          <DataSummaryTab auditId={audit.id} type="integrations" />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorsTab />
        </TabsContent>
      </Tabs>
      <AuditorInvitationsDialog
        auditId={audit.id}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
    </PageTemplate>
  );
}
