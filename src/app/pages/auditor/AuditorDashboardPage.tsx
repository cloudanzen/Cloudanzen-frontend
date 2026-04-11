/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
/**
 * AuditorDashboardPage  —  /auditor/dashboard
 *
 * Entry point for AUDITOR role users.
 * Shows the auditor's single assigned audit (or an empty state),
 * 4 KPI panels, and the full controls review table.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ClipboardList,
  Link as LinkIcon,
  FlaskConical,
  Lock,
} from 'lucide-react';
import {
  auditsService,
  AuditRecord,
  AuditControlRecord,
  AuditControlStatus,
} from '@/services/api/audits';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { PageTemplate } from '@/app/components/PageTemplate';

import { fmt, daysRemaining, ReviewBadge } from './auditorDashboard/helpers';
import { KpiCard } from './auditorDashboard/KpiCard';
import { ControlReviewPanel } from './auditorDashboard/ControlReviewPanel';

// ── Main page ─────────────────────────────────────────────────────────────────

export function AuditorDashboardPage() {
  const { t } = useTranslation('auditor');
  const navigate = useNavigate();
  const [selectedControl, setSelectedControl] =
    useState<AuditControlRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState<'' | AuditControlStatus>('');

  // Fetch audits (backend filters to only assigned audits for AUDITOR role)
  const { data: auditsData, isLoading: auditsLoading } = useQuery<{
    success: boolean;
    data: AuditRecord[];
  }>({
    queryKey: ['auditor-audits'],
    queryFn: () => auditsService.list(),
  });

  const audits = auditsData?.data ?? [];
  // Pick the most recent IN_PROGRESS audit, fall back to PLANNED, then first
  const audit =
    audits.find((a) => a.status === 'IN_PROGRESS') ??
    audits.find((a) => a.status === 'PLANNED') ??
    audits[0] ??
    null;

  // Fetch controls for the active audit
  const {
    data: controlsData,
    isLoading: controlsLoading,
    refetch: refetchControls,
  } = useQuery<{ success: boolean; data: AuditControlRecord[] }>({
    queryKey: ['auditor-controls', audit?.id],
    queryFn: () => auditsService.listControls(audit!.id),
    enabled: !!audit,
  });

  const auditControls = controlsData?.data ?? [];

  // ── KPI computations ──────────────────────────────────────────────────────
  const totalControls = auditControls.length;
  const reviewed = auditControls.filter(
    (c) => c.reviewStatus !== 'PENDING',
  ).length;
  const openFindings = (audit?.findings ?? []).filter(
    (f) => f.status === 'OPEN',
  ).length;
  const days = daysRemaining(audit?.endDate);

  const filtered = statusFilter
    ? auditControls.filter((c) => c.reviewStatus === statusFilter)
    : auditControls;

  if (auditsLoading) {
    return (
      <PageTemplate title={t('dashboard.title')}>
        <div className="py-20 text-center text-sm text-gray-400">
          {t('dashboard.loading')}
        </div>
      </PageTemplate>
    );
  }

  if (!audit) {
    return (
      <PageTemplate title={t('dashboard.title')}>
        <div className="py-20 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="text-base font-medium text-gray-600">
            {t('dashboard.noAudits')}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {t('dashboard.noAuditsDescription')}
          </p>
        </div>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate title={t('dashboard.title')} description={audit.name}>
      {/* Audit meta banner */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-gray-600">
        <span className="font-medium text-gray-900">{audit.name}</span>
        {audit.frameworkName && (
          <span className="text-gray-400">· {audit.frameworkName}</span>
        )}
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            audit.status === 'IN_PROGRESS'
              ? 'bg-amber-50 text-amber-700'
              : audit.status === 'COMPLETED'
                ? 'bg-green-50 text-green-700'
                : 'bg-blue-50 text-blue-700'
          }`}
        >
          {audit.status.replace('_', ' ')}
        </span>
        {(audit as any).isLocked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <Lock className="w-3 h-3" /> {t('dashboard.locked')}
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">
          {fmt(audit.startDate)} → {fmt(audit.endDate)}
        </span>
        {/* Final Report button — shown when audit is IN_PROGRESS or COMPLETED */}
        {(audit.status === 'IN_PROGRESS' || audit.status === 'COMPLETED') && (
          <Button
            size="sm"
            variant={audit.status === 'COMPLETED' ? 'default' : 'outline'}
            className={
              audit.status === 'COMPLETED'
                ? 'bg-green-700 hover:bg-green-600 text-white'
                : ''
            }
            onClick={() => navigate(`/auditor/audits/${audit.id}/final-report`)}
          >
            <ClipboardList className="w-4 h-4 mr-1" />
            {audit.status === 'COMPLETED'
              ? t('dashboard.viewFinalReport')
              : t('dashboard.finalReport')}
          </Button>
        )}
      </div>

      {/* 4 KPI panels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          label={t('dashboard.kpis.controlsInScope')}
          value={totalControls}
          icon={<Shield className="w-5 h-5" />}
        />
        <KpiCard
          label={t('dashboard.kpis.controlsReviewed')}
          value={`${reviewed} / ${totalControls}`}
          sub={
            totalControls > 0
              ? t('dashboard.kpis.complete', {
                  percent: Math.round((reviewed / totalControls) * 100),
                })
              : undefined
          }
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-green-700"
        />
        <KpiCard
          label={t('dashboard.kpis.openFindings')}
          value={openFindings}
          icon={<AlertCircle className="w-5 h-5" />}
          color={openFindings > 0 ? 'text-red-600' : 'text-gray-900'}
        />
        <KpiCard
          label={t('dashboard.kpis.daysRemaining')}
          value={
            days === null
              ? '—'
              : days < 0
                ? t('dashboard.kpis.overdue')
                : `${days}d`
          }
          sub={
            audit.endDate
              ? t('dashboard.kpis.due', { date: fmt(audit.endDate) })
              : undefined
          }
          icon={<Clock className="w-5 h-5" />}
          color={
            days !== null && days < 0
              ? 'text-red-600'
              : days !== null && days <= 7
                ? 'text-amber-600'
                : 'text-gray-900'
          }
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(
          [
            { value: '', label: t('dashboard.filters.all') },
            { value: 'PENDING', label: t('dashboard.filters.pending') },
            { value: 'COMPLIANT', label: t('dashboard.filters.compliant') },
            {
              value: 'NON_COMPLIANT',
              label: t('dashboard.filters.nonCompliant'),
            },
            {
              value: 'NOT_APPLICABLE',
              label: t('dashboard.filters.notApplicable'),
            },
          ] as const
        ).map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
            {f.value !== '' && (
              <span className="ml-1.5 text-xs opacity-70">
                (
                {auditControls.filter((c) => c.reviewStatus === f.value).length}
                )
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Controls review table */}
      <Card className="overflow-hidden">
        {controlsLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {t('dashboard.table.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            {t('dashboard.table.empty')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    t('dashboard.table.control'),
                    t('dashboard.table.title'),
                    t('dashboard.table.evidence'),
                    t('dashboard.table.tests'),
                    t('dashboard.table.reviewStatus'),
                    t('dashboard.table.findings'),
                    t('dashboard.table.action'),
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((ac) => {
                  const evidenceCount = ac.control.evidence?.length ?? 0;
                  const testCount = ac.control.testMappings?.length ?? 0;
                  const findingCount = ac.control.findings?.length ?? 0;

                  return (
                    <tr key={ac.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {ac.control.isoReference}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-[220px]">
                        <span className="line-clamp-2 text-xs leading-snug">
                          {ac.control.title}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`flex items-center gap-1 text-xs ${evidenceCount > 0 ? 'text-green-700' : 'text-gray-400'}`}
                        >
                          <LinkIcon className="w-3 h-3" />
                          {evidenceCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`flex items-center gap-1 text-xs ${testCount > 0 ? 'text-blue-700' : 'text-gray-400'}`}
                        >
                          <FlaskConical className="w-3 h-3" />
                          {testCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ReviewBadge status={ac.reviewStatus} />
                      </td>
                      <td className="px-4 py-3">
                        {findingCount > 0 ? (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            {findingCount}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedControl(ac)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {t('dashboard.table.review')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Control review side panel */}
      {selectedControl && (
        <ControlReviewPanel
          auditControl={selectedControl}
          auditId={audit.id}
          onClose={() => setSelectedControl(null)}
          onUpdated={() => {
            refetchControls();
            setSelectedControl(null);
          }}
        />
      )}
    </PageTemplate>
  );
}
