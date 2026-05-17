/**
 * AuditFinalReportPage — /auditor/audits/:auditId/final-report
 *
 * Shows the auto-generated final report for an audit.
 * Accessible to: Auditors (assigned audit), Admins (any audit).
 *
 * Sections:
 *  1. Executive Summary (editable before lock)
 *  2. Scope
 *  3. Compliance % (from live metrics or snapshot)
 *  4. Findings breakdown
 *  5. Risk summary (from snapshot)
 *  6. Audit Conclusion (editable, free text)
 *  7. Upload Signed PDF URL
 *  8. Sign & Complete button (→ locks audit + captures snapshot)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import {
  CheckCircle2,
  Shield,
  FileText,
  AlertTriangle,
  Lock,
  TrendingUp,
  BarChart3,
  Upload,
  PenLine,
  ChevronLeft,
  AlertCircle,
  Clock,
  XCircle,
  LogOut,
} from 'lucide-react';
import {
  auditsService,
  AuditRecord,
  AuditReportMetrics,
  AuditSnapshot,
} from '@/services/api/audits';
import { usersService } from '@/services/api/users';
import { useCanAudit, useIsAdmin } from '@/hooks/useCurrentUser';
import { useConfirmDialog } from '@/app/hooks/useConfirmDialog';
import { resolveAuditorLabel } from '@/lib/audits';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function KpiCard({
  label,
  value,
  sub,
  color = 'text-gray-800',
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <Card className="p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </Card>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

// ── Compliance donut (SVG) ───────────────────────────────────────────────────

function ComplianceDonut({ pct }: { pct: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
        />
        <text
          x="55"
          y="60"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill={color}
        >
          {pct}%
        </text>
      </svg>
      <p className="text-xs text-gray-500 mt-1">Compliance Rate</p>
    </div>
  );
}

// ── Severity row ─────────────────────────────────────────────────────────────

function FindingsBreakdown({
  metrics,
}: {
  metrics: AuditReportMetrics | AuditSnapshot;
}) {
  const rows = [
    {
      label: 'Major',
      count: metrics.majorFindings,
      color: 'bg-red-100 text-red-700',
    },
    {
      label: 'Minor',
      count: metrics.minorFindings,
      color: 'bg-amber-100 text-amber-700',
    },
    {
      label: 'Observation',
      count: metrics.observationFindings,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'OFI',
      count: metrics.ofiFindings,
      color: 'bg-purple-100 text-purple-700',
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {rows.map((r) => (
        <div
          key={r.label}
          className={`rounded-lg px-4 py-3 text-center ${r.color}`}
        >
          <p className="text-2xl font-bold">{r.count}</p>
          <p className="text-xs font-medium">{r.label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function AuditFinalReportPage() {
  const { t } = useTranslation('auditor');
  const { auditId } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const canAudit = useCanAudit();
  const isAdmin = useIsAdmin();
  const confirm = useConfirmDialog();

  // Form state
  const [summary, setSummary] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [summaryDirty, setSummaryDirty] = useState(false);
  const [conclusionDirty, setConclusionDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // TanStack Query v5 removed onSuccess from useQuery — use useEffect instead.
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-report', auditId],
    queryFn: () => auditsService.getReport(auditId!),
    enabled: !!auditId,
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  // Pre-fill form fields when data loads, respecting dirty state.
  useEffect(() => {
    const a: AuditRecord | undefined = (
      data as { data?: { audit?: AuditRecord } } | undefined
    )?.data?.audit;
    if (!a) return;
    if (!summaryDirty) setSummary(a.executiveSummary ?? '');
    if (!conclusionDirty) setConclusion(a.auditConclusion ?? '');
    setPdfUrl(a.signedPdfUrl ?? '');
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps -- summaryDirty/conclusionDirty are intentionally excluded: we only want to pre-fill on first load

  const report = (
    data as
      | { data?: { audit?: AuditRecord; metrics?: AuditReportMetrics } }
      | undefined
  )?.data;
  const audit: AuditRecord | undefined = report?.audit;
  const metrics: AuditReportMetrics | undefined = report?.metrics;
  const usersById = new Map(users.map((user) => [user.id, user] as const));
  // Prefer snapshot for locked audits
  const display: AuditReportMetrics | AuditSnapshot | undefined =
    audit?.snapshot ?? metrics;

  const isLocked = audit?.isLocked ?? false;

  async function saveDraft() {
    if (!auditId) return;
    setSaving(true);
    setErr(null);
    try {
      await auditsService.updateReport(auditId, {
        executiveSummary: summary || null,
        auditConclusion: conclusion || null,
        signedPdfUrl: pdfUrl || null,
      });
      setSummaryDirty(false);
      setConclusionDirty(false);
      qc.invalidateQueries({ queryKey: ['audit-report', auditId] });
    } catch (e: unknown) {
      setErr(
        (e as { message?: string })?.message ?? t('finalReport.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignAndComplete() {
    if (!auditId) return;
    const confirmed = await confirm({
      title: t('finalReport.signConfirmTitle'),
      description: t('finalReport.signConfirmDescription'),
      confirmLabel: t('finalReport.signAndComplete'),
      variant: 'destructive',
    });
    if (!confirmed) return;
    setSigning(true);
    setErr(null);
    try {
      // Save latest draft first
      await auditsService.updateReport(auditId, {
        executiveSummary: summary || null,
        auditConclusion: conclusion || null,
        signedPdfUrl: pdfUrl || null,
      });
      await auditsService.signAndComplete(auditId);
      qc.invalidateQueries({ queryKey: ['audit-report', auditId] });
      qc.invalidateQueries({ queryKey: ['audits'] });
      qc.invalidateQueries({ queryKey: ['auditor-audits'] });
    } catch (e: unknown) {
      setErr(
        (e as { message?: string })?.message ?? t('finalReport.signFailed'),
      );
    } finally {
      setSigning(false);
    }
  }

  if (isLoading) {
    return (
      <PageTemplate title={t('finalReport.title')}>
        <div className="flex items-center justify-center h-60 text-gray-400">
          <Clock className="w-6 h-6 mr-2 animate-spin" />{' '}
          {t('finalReport.loading')}
        </div>
      </PageTemplate>
    );
  }

  if (error || !audit || !display) {
    return (
      <PageTemplate title={t('finalReport.title')}>
        <div className="flex flex-col items-center justify-center h-60 text-red-500 gap-2">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm">{t('finalReport.loadFailed')}</p>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {t('finalReport.goBack')}
          </Button>
        </div>
      </PageTemplate>
    );
  }

  const auditTypeLabel: Record<string, string> = {
    INTERNAL: t('finalReport.typeLabels.INTERNAL'),
    EXTERNAL: t('finalReport.typeLabels.EXTERNAL'),
    SURVEILLANCE: t('finalReport.typeLabels.SURVEILLANCE'),
    RECERTIFICATION: t('finalReport.typeLabels.RECERTIFICATION'),
  };

  return (
    <PageTemplate
      title={`${t('finalReport.title')} — ${audit.name}`}
      description={`${auditTypeLabel[audit.type] ?? audit.type} · ${audit.frameworkName ?? t('finalReport.noFramework')}`}
      actions={
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/compliance/audits/${audit.id}`)}
            >
              <LogOut className="w-4 h-4 mr-1" /> {t('finalReport.exitPreview')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> {t('finalReport.back')}
          </Button>
        </div>
      }
    >
      {/* Lock banner */}
      {isLocked && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 mb-6">
          <Lock className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              {t('finalReport.lockedTitle')}
            </p>
            <p className="text-xs text-green-600">
              {t('finalReport.lockedDescription', {
                date: fmt(audit.signedAt),
              })}
            </p>
          </div>
          {audit.signedPdfUrl && (
            <a
              href={audit.signedPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto text-sm text-indigo-600 underline font-medium"
            >
              {t('finalReport.viewSignedPdf')}
            </a>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* ── 1. Executive Summary ── */}
        <Card className="p-6">
          <SectionHeader icon={PenLine} title="Executive Summary" />
          {isLocked ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {audit.executiveSummary || (
                <span className="italic text-gray-400">
                  No summary provided.
                </span>
              )}
            </p>
          ) : (
            <>
              <textarea
                rows={5}
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setSummaryDirty(true);
                }}
                placeholder="Provide a high-level summary of the audit: objectives, scope overview, overall findings, and key conclusions…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <p className="text-xs text-gray-400 mt-1">
                This summary will appear at the top of the completed report.
              </p>
            </>
          )}
        </Card>

        {/* ── 2. Scope ── */}
        <Card className="p-6">
          <SectionHeader icon={Shield} title="Scope" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'Audit Name', value: audit.name },
              {
                label: 'Type',
                value: auditTypeLabel[audit.type] ?? audit.type,
              },
              { label: 'Framework', value: audit.frameworkName ?? '—' },
              {
                label: 'Period',
                value: audit.periodStart
                  ? `${fmt(audit.periodStart)} – ${fmt(audit.periodEnd)}`
                  : '—',
              },
              { label: 'Start Date', value: fmt(audit.startDate) },
              {
                label: 'End Date',
                value: fmt(audit.closedAt ?? audit.endDate),
              },
              {
                label: 'Auditor',
                value: resolveAuditorLabel(audit, usersById),
              },
              { label: 'Controls in Scope', value: display.totalControls },
            ].map((r) => (
              <div key={r.label}>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                  {r.label}
                </p>
                <p className="font-medium text-gray-800">{r.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── 3. Compliance % ── */}
        <Card className="p-6">
          <SectionHeader icon={TrendingUp} title="Compliance Overview" />
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ComplianceDonut pct={display.compliancePct} />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              <KpiCard
                label="Compliant"
                value={display.compliantControls}
                color="text-green-600"
              />
              <KpiCard
                label="Non-Compliant"
                value={display.nonCompliantControls}
                color="text-red-600"
              />
              <KpiCard
                label="Not Applicable"
                value={display.notApplicableControls}
                color="text-gray-500"
              />
              <KpiCard
                label="Pending Review"
                value={display.pendingControls}
                color="text-amber-600"
              />
            </div>
          </div>
        </Card>

        {/* ── 4. Findings Breakdown ── */}
        <Card className="p-6">
          <SectionHeader icon={AlertTriangle} title="Findings Breakdown" />
          <div className="grid grid-cols-3 gap-4 mb-4 text-center text-sm">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {display.totalFindings}
              </p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {display.openFindings}
              </p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {display.closedFindings}
              </p>
              <p className="text-xs text-gray-500">Closed</p>
            </div>
          </div>
          <FindingsBreakdown metrics={display} />
        </Card>

        {/* ── 5. Risk Summary (from snapshot) ── */}
        {'criticalRisks' in display && (
          <Card className="p-6">
            <SectionHeader
              icon={BarChart3}
              title="Risk Summary at Completion"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard
                label="Critical"
                value={(display as AuditSnapshot).criticalRisks}
                color="text-red-700"
              />
              <KpiCard
                label="High"
                value={(display as AuditSnapshot).highRisks}
                color="text-orange-600"
              />
              <KpiCard
                label="Medium"
                value={(display as AuditSnapshot).mediumRisks}
                color="text-amber-600"
              />
              <KpiCard
                label="Low"
                value={(display as AuditSnapshot).lowRisks}
                color="text-green-600"
              />
            </div>
          </Card>
        )}

        {/* ── 6. Audit Conclusion ── */}
        <Card className="p-6">
          <SectionHeader icon={CheckCircle2} title="Audit Conclusion" />
          {isLocked ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {audit.auditConclusion || (
                <span className="italic text-gray-400">
                  No conclusion recorded.
                </span>
              )}
            </p>
          ) : (
            <>
              <textarea
                rows={4}
                value={conclusion}
                onChange={(e) => {
                  setConclusion(e.target.value);
                  setConclusionDirty(true);
                }}
                placeholder="State the overall audit outcome (e.g. Pass / Pass with conditions / Fail) and any follow-up actions required…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </>
          )}
        </Card>

        {/* ── 7. Signed PDF ── */}
        {!isLocked && (
          <Card className="p-6">
            <SectionHeader icon={Upload} title="Upload Signed PDF (optional)" />
            <p className="text-xs text-gray-500 mb-2">
              Attach a URL to the signed PDF version of this report (e.g. shared
              drive, S3, DocuSign).
            </p>
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </Card>
        )}

        {/* ── Error ── */}
        {err && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {err}
          </div>
        )}

        {/* ── Actions (hidden when locked) ── */}
        {!isLocked && canAudit && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={saving || signing}
              className="flex-1"
            >
              {saving ? (
                <Clock className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving draft…' : 'Save Draft'}
            </Button>

            <Button
              onClick={handleSignAndComplete}
              disabled={saving || signing}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white"
            >
              {signing ? (
                <Clock className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              {signing ? 'Signing…' : 'Sign & Complete Audit'}
            </Button>
          </div>
        )}

        {isLocked && !canAudit && (
          <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t">
            <Lock className="w-4 h-4" /> This audit is complete and locked.
          </div>
        )}
      </div>
    </PageTemplate>
  );
}
