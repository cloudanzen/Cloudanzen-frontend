/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
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
} from 'lucide-react';
import {
  auditsService,
  AuditRecord,
  AuditControlRecord,
  AuditStatus,
  AuditComment,
} from '@/services/api/audits';
import { usersService } from '@/services/api/users';
import { vendorsService, VendorRecord } from '@/services/api/vendors';
import { useCanAudit, useCurrentUser } from '@/hooks/useCurrentUser';
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
  const compliant = controls.filter((c) => c.reviewStatus === 'COMPLIANT').length;
  const nonCompliant = controls.filter((c) => c.reviewStatus === 'NON_COMPLIANT').length;
  const notApplicable = controls.filter((c) => c.reviewStatus === 'NOT_APPLICABLE').length;
  const pending = controls.filter((c) => c.reviewStatus === 'PENDING').length;

  const reviewedPct = total > 0 ? Math.round((reviewed / total) * 100) : 0;
  const closedFindings = findings.filter((f) => (f as any).status === 'CLOSED').length;
  const findingPct = findings.length > 0 ? Math.round((closedFindings / findings.length) * 100) : 0;
  const compliancePct = snap?.compliancePct ?? (total > 0 ? Math.round((compliant / total) * 100) : 0);

  const majorCount = findings.filter((f) => f.severity === 'MAJOR').length;
  const minorCount = findings.filter((f) => f.severity === 'MINOR').length;
  const obsCount = findings.filter((f) => f.severity === 'OBSERVATION').length;
  const ofiCount = findings.filter((f) => f.severity === 'OFI').length;

  return (
    <div className="space-y-4">
      {/* Readiness bars */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">{t('auditDetail.overview.readiness')}</h3>
        <div className="space-y-4">
          {[
            { label: t('auditDetail.overview.controlsReviewed'), value: reviewedPct, sub: t('auditDetail.overview.reviewedOf', { reviewed, total }) },
            { label: t('auditDetail.overview.complianceRate'), value: compliancePct, sub: t('auditDetail.overview.compliantCount', { count: compliant }) },
            { label: t('auditDetail.overview.findingsResolved'), value: findingPct, sub: findings.length > 0 ? t('auditDetail.overview.closedOf', { closed: closedFindings, total: findings.length }) : t('auditDetail.overview.noFindings') },
          ].map((bar) => (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">{bar.label}</span>
                <span className="text-xs text-muted-foreground">{bar.sub} · {bar.value}%</span>
              </div>
              <Progress value={bar.value} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Control status breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t('auditDetail.overview.compliant'), value: compliant, color: 'text-green-700' },
          { label: t('auditDetail.overview.nonCompliant'), value: nonCompliant, color: 'text-red-700' },
          { label: t('auditDetail.overview.na'), value: notApplicable, color: 'text-slate-500' },
          { label: t('auditDetail.overview.pending'), value: pending, color: 'text-muted-foreground' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Finding severity breakdown */}
      {findings.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t('auditDetail.overview.findings')}</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: t('auditDetail.overview.major'), value: majorCount, color: 'text-red-700' },
              { label: t('auditDetail.overview.minor'), value: minorCount, color: 'text-amber-700' },
              { label: t('auditDetail.overview.observation'), value: obsCount, color: 'text-blue-700' },
              { label: t('auditDetail.overview.ofi'), value: ofiCount, color: 'text-slate-500' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">{t('auditDetail.overview.timeline')}</h3>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{t('auditDetail.overview.startDate')}</p>
            <p className="font-medium">{fmt(audit.startDate)}</p>
          </div>
          {audit.periodStart && (
            <div>
              <p className="text-xs text-muted-foreground">{t('auditDetail.overview.auditPeriod')}</p>
              <p className="font-medium">{fmt(audit.periodStart)} → {fmt(audit.periodEnd)}</p>
            </div>
          )}
          {audit.endDate && (
            <div>
              <p className="text-xs text-muted-foreground">{t('auditDetail.overview.endDate')}</p>
              <p className="font-medium">{fmt(audit.endDate)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">{t('auditPanel.auditor')}</p>
            <p className="font-medium">{resolveAuditorLabel(audit, usersById)}</p>
          </div>
          {audit.closedAt && (
            <div>
              <p className="text-xs text-muted-foreground">{t('auditDetail.overview.closed')}</p>
              <p className="font-medium text-green-700">{fmt(audit.closedAt)}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [reviewingControl, setReviewingControl] = useState<AuditControlRecord | null>(null);

  const { data, refetch } = useQuery<{ success: boolean; data: AuditControlRecord[] }>({
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
  const sortedFolders = [...folders.entries()].sort(([a], [b]) => a.localeCompare(b));

  function toggleFolder(prefix: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(prefix)) next.delete(prefix);
      else next.add(prefix);
      return next;
    });
  }

  function folderColor(ctrls: AuditControlRecord[]): string {
    if (ctrls.every((c) => c.reviewStatus === 'COMPLIANT' || c.reviewStatus === 'NOT_APPLICABLE'))
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
        <p className="text-sm text-muted-foreground">{t('auditDetail.evidence.noControls')}</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="divide-y divide-border overflow-hidden">
        {sortedFolders.map(([prefix, ctrls]) => {
          const isOpen = expandedFolders.has(prefix);
          const reviewed = ctrls.filter((c) => c.reviewStatus !== 'PENDING').length;
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
                <span className={`text-xs font-bold font-mono ${folderColor(ctrls)}`}>{prefix}</span>
                <span className="text-sm font-medium text-foreground flex-1">
                  {ctrls[0]?.control.title.split(' ').slice(0, 4).join(' ')}…
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {t('auditDetail.evidence.reviewedOf', { reviewed, total: ctrls.length })}
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
                        const hasFlagged = aes.some((ae) => ae.status === 'FLAGGED');
                        const allApproved = aes.length > 0 && aes.every((ae) => ae.status === 'APPROVED');
                        const hasTests = (auditCtrl.control.testMappings ?? []).length > 0;
                        const hasFailingTests = (auditCtrl.control.testMappings ?? []).some(
                          (tm) => tm.test.status === 'Overdue' || tm.test.status === 'Needs_remediation',
                        );
                        if (hasFlagged) return <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 flex-shrink-0">⚑ {t('auditDetail.evidence.flagged')}</span>;
                        if (hasTests && hasFailingTests) return <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-700 flex-shrink-0">✕ {t('auditDetail.evidence.failing')}</span>;
                        if (allApproved) return <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700 flex-shrink-0">✓ {t('auditDetail.evidence.ready')}</span>;
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

type FindingFilter = 'ALL' | 'OPEN' | 'IN_REMEDIATION' | 'READY_FOR_REVIEW' | 'CLOSED';

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
    { value: 'IN_REMEDIATION', label: t('auditDetail.findingsTab.inRemediation') },
    { value: 'READY_FOR_REVIEW', label: t('auditDetail.findingsTab.readyForReview') },
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
            <p className="text-sm text-muted-foreground">{t('auditDetail.findingsTab.noMatch')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                {(t('auditDetail.findingsTab.columns', { returnObjects: true }) as string[]).map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FINDING_SEVERITY_COLORS[f.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[300px] truncate">
                    {f.description}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${FINDING_STATUS_COLORS[(f as any).status] ?? 'bg-gray-100 text-gray-600'}`}>
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

// ── Comments Tab ──────────────────────────────────────────────────────────────

function CommentsTab({ auditId, controls }: { auditId: string; controls: AuditControlRecord[] }) {
  const { t } = useTranslation('compliance');
  const me = useCurrentUser();
  const canAudit = useCanAudit();
  const confirm = useConfirmDialog();
  const [selectedControlId, setSelectedControlId] = useState<string>('');
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);

  const { data, refetch } = useQuery<{ success: boolean; data: AuditComment[] }>({
    queryKey: ['audit-comments', auditId, selectedControlId || null],
    queryFn: () => auditsService.listComments(auditId, selectedControlId || undefined),
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
    if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
    return email.slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-4">
      {/* Control filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted-foreground">{t('auditDetail.comments.filterByControl')}</label>
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
          <p className="text-sm text-muted-foreground text-center py-8">{t('auditDetail.comments.noComments')}</p>
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
                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">{t('auditDetail.comments.auditor')}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                    Re: {controls.find((ctrl) => ctrl.control.id === c.controlId)?.control.isoReference ?? c.controlId}
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

function ReportTab({ audit, onRefresh }: { audit: AuditRecord; onRefresh: () => void }) {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const canAudit = useCanAudit();
  const confirm = useConfirmDialog();
  const [acting, setActing] = useState(false);
  const snap = audit.snapshot;

  async function handleClose() {
    const ok = await confirm({
      title: t('auditDetail.report.completeConfirmTitle'),
      description: t('auditDetail.report.completeConfirmDesc'),
      confirmLabel: t('auditDetail.report.completeConfirmLabel'),
      variant: 'default',
    });
    if (!ok) return;
    setActing(true);
    try {
      await auditsService.close(audit.id);
      toast.success(t('auditDetail.report.auditCompleted'));
      onRefresh();
    } catch {
      toast.error(t('auditDetail.report.completeFailed'));
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
              {audit.isLocked ? t('auditDetail.report.completedLocked') : audit.status === 'IN_PROGRESS' ? t('auditDetail.report.inProgress') : t('auditDetail.report.statusPrefix', { status: audit.status })}
            </p>
            {audit.signedAt && (
              <p className="text-xs text-muted-foreground">{t('auditDetail.report.signedOn', { date: fmt(audit.signedAt) })}</p>
            )}
          </div>
        </div>

        {snap && (
          <div className="grid grid-cols-3 gap-4 mb-4 text-center border-t border-border pt-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{snap.compliancePct}%</p>
              <p className="text-xs text-muted-foreground">{t('auditDetail.report.compliance')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{snap.majorFindings}</p>
              <p className="text-xs text-muted-foreground">{t('auditDetail.report.majorFindings')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{snap.totalControls}</p>
              <p className="text-xs text-muted-foreground">{t('auditDetail.report.controls')}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(audit.status === 'DRAFT' || audit.status === 'PLANNED') && canAudit && (
            <Button onClick={handleStart} disabled={acting}>
              {acting ? t('auditDetail.report.starting') : t('auditDetail.report.startAudit')}
            </Button>
          )}
          {audit.status === 'IN_PROGRESS' && canAudit && (
            <>
              <Button
                onClick={handleClose}
                disabled={acting}
                className="bg-green-700 hover:bg-green-600"
              >
                {acting ? t('auditDetail.report.completing') : t('auditDetail.report.completeAudit')}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/auditor/audits/${audit.id}/final-report`)}
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                {t('auditDetail.report.finalReport')}
              </Button>
            </>
          )}
          {audit.status === 'COMPLETED' && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/auditor/audits/${audit.id}/final-report`)}
              >
                <ClipboardList className="w-4 h-4 mr-1.5" />
                {t('auditDetail.report.viewFinalReport')}
              </Button>
              {audit.signedPdfUrl && (
                <Button variant="outline" asChild>
                  <a href={audit.signedPdfUrl} target="_blank" rel="noopener noreferrer">
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('auditDetail.report.executiveSummary')}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{audit.executiveSummary}</p>
            </div>
          )}
          {audit.auditConclusion && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{t('auditDetail.report.auditConclusion')}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{audit.auditConclusion}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Vendors Tab ───────────────────────────────────────────────────────────────

const VENDOR_STATUS_COLORS: Record<string, string> = {
  MONITORED:      'bg-green-50 text-green-700',
  ASSESSMENT_DUE: 'bg-amber-50 text-amber-700',
  IN_REVIEW:      'bg-blue-50 text-blue-700',
  BLOCKED:        'bg-red-50 text-red-700',
};

const VENDOR_TIER_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-700',
  HIGH:     'bg-orange-50 text-orange-700',
  MEDIUM:   'bg-amber-50 text-amber-700',
  LOW:      'bg-slate-100 text-slate-600',
};

function VendorsTab() {
  const { t } = useTranslation('compliance');
  const { data, isLoading } = useQuery<VendorRecord[]>({
    queryKey: ['vendors'],
    queryFn: () => vendorsService.list(),
  });
  const vendors = data ?? [];

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">{t('auditDetail.vendors.loading')}</div>;
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
        <span className="text-sm font-medium">{t('auditDetail.vendors.rosterTitle')}</span>
        <Badge variant="secondary" className="ml-auto">{vendors.length}</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">{t('auditDetail.vendors.columns.vendor')}</th>
              <th className="px-4 py-2 text-left font-medium">{t('auditDetail.vendors.columns.tier')}</th>
              <th className="px-4 py-2 text-left font-medium">{t('auditDetail.vendors.columns.status')}</th>
              <th className="px-4 py-2 text-right font-medium">{t('auditDetail.vendors.columns.securityScore')}</th>
              <th className="px-4 py-2 text-left font-medium">{t('auditDetail.vendors.columns.lastAssessment')}</th>
              <th className="px-4 py-2 text-left font-medium">{t('auditDetail.vendors.columns.nextDue')}</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v) => {
              // Vanta-parity rollout: legacy `tier`/`securityScore`/`openFindings`
              // were dropped from Vendor. Show effective tier (residual ?? inherent)
              // and inherent score; finding counts are now derived from a join
              // and intentionally omitted from this audit-side summary.
              const effectiveTier = v.residualTier ?? v.inherentTier ?? 'MEDIUM';
              return (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.category}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VENDOR_TIER_COLORS[effectiveTier] ?? 'bg-slate-100 text-slate-600'}`}>
                      {effectiveTier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${VENDOR_STATUS_COLORS[v.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {v.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {v.inherentRiskScore ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(v.lastAssessmentAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmt(v.nextAssessmentAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AuditDetailPage() {
  const { t } = useTranslation('compliance');
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: AuditRecord }>({
    queryKey: ['audit', auditId],
    queryFn: () => auditsService.get(auditId!),
    enabled: !!auditId,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  const audit = data?.data;
  const usersById = new Map(
    users.map((user) => [user.id, user] as const),
  );

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['audit', auditId] });
    queryClient.invalidateQueries({ queryKey: ['audits'] });
  }

  if (isLoading) {
    return (
      <PageTemplate title={t('auditDetail.loading')} description="">
        <div className="p-8 text-center text-sm text-muted-foreground">{t('auditDetail.loadingAudit')}</div>
      </PageTemplate>
    );
  }

  if (!audit) {
    return (
      <PageTemplate title={t('auditDetail.notFound')} description="">
        <div className="p-8 text-center text-sm text-muted-foreground">{t('auditDetail.auditNotFound')}</div>
      </PageTemplate>
    );
  }

  const controls = audit.auditControls ?? [];

  const descriptionStr = [
    t(`auditPanel.typeLabels.${AUDIT_TYPE_KEYS[audit.type]}`),
    audit.frameworkName,
    audit.isLocked ? t('auditDetail.locked') : null,
  ].filter(Boolean).join(' · ');

  return (
    <PageTemplate
      title={audit.name}
      description={descriptionStr}
      actions={
        <div className="flex items-center gap-2">
          <StatusBadge status={audit.status as AuditStatus} />
          <Button variant="ghost" size="sm" onClick={() => navigate('/compliance/audits')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('auditDetail.back')}
          </Button>
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('auditDetail.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="evidence">{t('auditDetail.tabs.evidence')}</TabsTrigger>
          <TabsTrigger value="findings">
            {t('auditDetail.tabs.findings')}
            {(audit.findings ?? []).length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-xs">
                {(audit.findings ?? []).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="comments">{t('auditDetail.tabs.comments')}</TabsTrigger>
          <TabsTrigger value="report">{t('auditDetail.tabs.report')}</TabsTrigger>
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

        <TabsContent value="findings">
          <FindingsTab audit={audit} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentsTab auditId={audit.id} controls={controls} />
        </TabsContent>

        <TabsContent value="report">
          <ReportTab audit={audit} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorsTab />
        </TabsContent>
      </Tabs>
    </PageTemplate>
  );
}
