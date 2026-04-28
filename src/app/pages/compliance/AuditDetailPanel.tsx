/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { Button } from '@/app/components/ui/button';
import {
  Calendar,
  User,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  ClipboardList,
  Lock,
} from 'lucide-react';
import {
  auditsService,
  AuditRecord,
  AuditType,
  AuditStatus,
} from '@/services/api/audits';

// ── Shared helpers (also exported for use in AuditsPage) ─────────────────────

export const AUDIT_TYPE_KEYS: Record<AuditType, string> = {
  INTERNAL: 'INTERNAL',
  EXTERNAL: 'EXTERNAL',
  SURVEILLANCE: 'SURVEILLANCE',
  RECERTIFICATION: 'RECERTIFICATION',
};

export const STATUS_META: Record<
  AuditStatus,
  { key: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: {
    key: 'DRAFT',
    color: 'bg-gray-100 text-gray-600',
    icon: <FileText className="w-3 h-3" />,
  },
  PLANNED: {
    key: 'PLANNED',
    color: 'bg-blue-50 text-blue-700',
    icon: <Clock className="w-3 h-3" />,
  },
  UPCOMING: {
    key: 'UPCOMING',
    color: 'bg-slate-100 text-slate-700',
    icon: <Calendar className="w-3 h-3" />,
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    color: 'bg-amber-50 text-amber-700',
    icon: <AlertCircle className="w-3 h-3" />,
  },
  AWAITING_REPORT: {
    key: 'AWAITING_REPORT',
    color: 'bg-purple-50 text-purple-700',
    icon: <ClipboardList className="w-3 h-3" />,
  },
  COMPLETED: {
    key: 'COMPLETED',
    color: 'bg-green-50 text-green-700',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

export function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function StatusBadge({ status }: { status: AuditStatus }) {
  const { t } = useTranslation('compliance');
  const m = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.color}`}
    >
      {m.icon}
      {t(`auditPanel.statusLabels.${m.key}`)}
    </span>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-400">{icon}</span>
      <span className="text-gray-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}

// ── Audit Detail Panel ────────────────────────────────────────────────────────

export function AuditDetailPanel({
  audit,
  onClose,
  onRefresh,
}: {
  audit: AuditRecord;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [acting, setActing] = useState(false);

  async function handleStart() {
    setActing(true);
    try {
      await auditsService.start(audit.id);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setActing(false);
    }
  }

  async function handleMoveToAwaitingReport() {
    const confirmed = await confirm({
      title: t('auditPanel.awaitingReportTitle'),
      description: t('auditPanel.awaitingReportDesc'),
      confirmLabel: t('auditPanel.awaitingReportConfirm'),
      variant: 'default',
    });
    if (!confirmed) return;
    setActing(true);
    try {
      await auditsService.transitionToAwaitingReport(audit.id);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setActing(false);
    }
  }

  const totalControls =
    audit._count?.auditControls ?? audit.auditControls?.length ?? 0;
  const findings = audit.findings ?? [];
  const major = findings.filter((f) => f.severity === 'MAJOR').length;
  const minor = findings.filter((f) => f.severity === 'MINOR').length;
  const obs = findings.filter((f) => f.severity === 'OBSERVATION').length;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {audit.name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={audit.status} />
              <span className="text-xs text-gray-400">
                {t(`auditPanel.typeLabels.${audit.type}`)}
              </span>
              {audit.frameworkName && (
                <span className="text-xs text-gray-400">
                  · {audit.frameworkName}
                </span>
              )}
              {(audit as any).isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <Lock className="w-3 h-3" /> {t('auditPanel.locked')}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 p-5 border-b border-gray-100">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {totalControls}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {t('auditPanel.controlsInScope')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{major}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t('auditPanel.majorFindings')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {minor + obs}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {t('auditPanel.minorObservations')}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3 border-b border-gray-100">
          <Row
            icon={<Calendar className="w-4 h-4" />}
            label={t('auditPanel.scheduled')}
            value={`${fmt(audit.startDate)} → ${fmt(audit.endDate)}`}
          />
          {(audit.periodStart || audit.periodEnd) && (
            <Row
              icon={<Shield className="w-4 h-4" />}
              label={t('auditPanel.auditPeriod')}
              value={`${fmt(audit.periodStart)} → ${fmt(audit.periodEnd)}`}
            />
          )}
          <Row
            icon={<User className="w-4 h-4" />}
            label={t('auditPanel.auditor')}
            value={
              audit.externalAuditorEmail ??
              (audit.assignedAuditorId
                ? `${t('auditPanel.typeLabels.INTERNAL')} (${audit.assignedAuditorId.slice(0, 8)}…)`
                : t('auditPanel.notAssigned'))
            }
          />
          {audit.closedAt && (
            <Row
              icon={<CheckCircle2 className="w-4 h-4" />}
              label={t('auditPanel.closed')}
              value={fmt(audit.closedAt)}
            />
          )}
        </div>

        {/* Findings */}
        {findings.length > 0 && (
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              {t('auditPanel.findingsCount', { count: findings.length })}
            </h3>
            <div className="space-y-2">
              {findings.map((f) => (
                <div
                  key={f.id}
                  className="border border-gray-100 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        f.severity === 'MAJOR'
                          ? 'bg-red-50 text-red-700'
                          : f.severity === 'MINOR'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {f.severity}
                    </span>
                    {f.control && (
                      <span className="text-xs font-mono text-blue-700">
                        {f.control.isoReference}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 flex gap-2 mt-auto flex-wrap">
          {(audit.status === 'UPCOMING' || audit.status === 'PLANNED') && (
            <Button onClick={handleStart} disabled={acting} className="flex-1">
              {acting ? t('auditPanel.starting') : t('auditPanel.startAudit')}
            </Button>
          )}
          {audit.status === 'IN_PROGRESS' && (
            <Button
              onClick={handleMoveToAwaitingReport}
              disabled={acting}
              className="flex-1 bg-purple-700 hover:bg-purple-600"
            >
              {acting ? t('auditPanel.movingToAwaitingReport') : t('auditPanel.moveToAwaitingReport')}
            </Button>
          )}
          {(audit.status === 'IN_PROGRESS' || audit.status === 'AWAITING_REPORT' || audit.status === 'COMPLETED') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(`/auditor/audits/${audit.id}/final-report`)
              }
              className="flex-1"
            >
              <ClipboardList className="w-4 h-4 mr-1" />
              {t('auditPanel.finalReport')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
