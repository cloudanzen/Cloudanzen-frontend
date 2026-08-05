/**
 * audit-detail/OverviewTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { AuditRecord } from '@/services/api/audits';
import { resolveAuditorLabel, type AuditorIdentity } from '@/lib/audits';
import { fmt } from '../AuditDetailPanel';

/** Findings come back without a `status` field on the shared type; the
 * API does send one. Narrow structurally rather than reaching for `any`. */
type WithStatus = { status?: string };

export function OverviewTab({
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
    (f) => (f as WithStatus).status === 'CLOSED',
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
