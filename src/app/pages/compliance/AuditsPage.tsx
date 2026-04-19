/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Plus, Shield } from 'lucide-react';
import {
  auditsService,
  AuditRecord,
  AuditType,
  AuditStatus,
} from '@/services/api/audits';
import { usersService } from '@/services/api/users';
import { ScheduleAuditModal } from './ScheduleAuditModal';
import { resolveAuditorLabel } from '@/lib/audits';
import {
  AUDIT_TYPE_KEYS,
  StatusBadge,
  fmt,
} from './AuditDetailPanel';

// ── Filters config ────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: '' | AuditStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export function AuditsPage() {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { filters, update, reset } = useUrlFilterState({
    defaults: { search: '', status: '', type: '' },
  });
  const search = filters.search;
  const statusFilter = filters.status as '' | AuditStatus;
  const typeFilter = filters.type as '' | AuditType;
  const { data, isLoading, refetch } = useQuery<{
    success: boolean;
    data: AuditRecord[];
  }>({
    queryKey: ['audits', statusFilter, typeFilter],
    queryFn: () =>
      auditsService.list({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      } as any),
  });
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.listUsers(),
  });

  const usersById = new Map(
    users.map((user) => [user.id, user] as const),
  );

  const audits = data?.data ?? [];

  const filtered = search
    ? audits.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          (a.frameworkName ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : audits;

  const activeFilters = [
    ...(search.trim()
      ? [
          {
            key: 'search',
            label: `Search: ${search.trim()}`,
            onRemove: () => update({ search: '' }),
          },
        ]
      : []),
    ...(statusFilter
      ? [
          {
            key: 'status',
            label: `Status: ${STATUS_FILTERS.find((item) => item.value === statusFilter)?.label ?? statusFilter}`,
            onRemove: () => update({ status: '' }),
          },
        ]
      : []),
    ...(typeFilter
      ? [
          {
            key: 'type',
            label: `Type: ${typeFilter.replace(/_/g, ' ')}`,
            onRemove: () => update({ type: '' }),
          },
        ]
      : []),
  ];

  function onCreated() {
    toast.success('Audit scheduled successfully');
    refetch();
  }

  // Stat strip
  const counts = {
    total: audits.length,
    planned: audits.filter((a) => a.status === 'PLANNED').length,
    inProgress: audits.filter((a) => a.status === 'IN_PROGRESS').length,
    completed: audits.filter((a) => a.status === 'COMPLETED').length,
  };

  return (
    <PageTemplate
      title={t('audits.title')}
      description={t('audits.description')}
      actions={
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          {t('audits.scheduleNew')}
        </Button>
      }
    >
      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { key: 'total', label: t('audits.total'), value: counts.total, color: 'text-foreground' },
          { key: 'planned', label: t('audits.status.PLANNED'), value: counts.planned, color: 'text-blue-700' },
          {
            key: 'inProgress',
            label: t('audits.status.IN_PROGRESS'),
            value: counts.inProgress,
            color: 'text-amber-700',
          },
          {
            key: 'completed',
            label: t('audits.status.COMPLETED'),
            value: counts.completed,
            color: 'text-green-700',
          },
        ].map((s) => (
          <Card key={s.key} className="p-4">
            <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wide">
              {s.label}
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-4">
        <PageFilterBar
          searchValue={search}
          onSearchChange={(value) => update({ search: value })}
          searchPlaceholder={t('audits.searchPlaceholder')}
          selects={[
            {
              key: 'status',
              value: statusFilter,
              placeholder: 'Status',
              onChange: (value) =>
                update({ status: value as '' | AuditStatus }),
              options: STATUS_FILTERS,
            },
            {
              key: 'type',
              value: typeFilter,
              placeholder: 'Type',
              onChange: (value) => update({ type: value as '' | AuditType }),
              options: [
                { value: '', label: 'All Types' },
                { value: 'INTERNAL', label: 'Internal' },
                { value: 'EXTERNAL', label: 'External' },
                { value: 'SURVEILLANCE', label: 'Surveillance' },
                { value: 'RECERTIFICATION', label: 'Recertification' },
              ],
            },
          ]}
          resultCount={filtered.length}
          resultLabel="audits"
          activeFilters={activeFilters}
          onClearAll={reset}
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground/70">
            {t('audits.loading')}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/70" />
            <p className="text-sm font-medium text-muted-foreground">{t('audits.noAudits')}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t('audits.noAuditsDesc')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {[
                    t('audits.columns.name'),
                    t('audits.columns.framework'),
                    t('audits.columns.period'),
                    t('audits.columns.type'),
                    t('audits.columns.status'),
                    t('audits.columns.auditor'),
                    t('audits.columns.findings'),
                    t('audits.columns.progress'),
                  ].map((h) => (
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
                {filtered.map((audit) => {
                  const findings = audit.findings ?? [];
                  const majorCount = findings.filter(
                    (f) => f.severity === 'MAJOR',
                  ).length;
                  const minorCount = findings.filter(
                    (f) => f.severity === 'MINOR',
                  ).length;
                  const auditorLabel = resolveAuditorLabel(audit, usersById);

                  const auditControls = audit.auditControls ?? [];
                  const totalControls = auditControls.length || audit._count?.auditControls || 0;
                  const reviewedControls = auditControls.filter(
                    (c) => c.reviewStatus !== 'PENDING',
                  ).length;
                  const progressPct = totalControls > 0 ? Math.round((reviewedControls / totalControls) * 100) : 0;

                  return (
                    <tr
                      key={audit.id}
                      className="hover:bg-muted cursor-pointer"
                      onClick={() => navigate(`/compliance/audits/${audit.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">
                        {audit.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {audit.frameworkName ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {audit.periodStart
                          ? `${fmt(audit.periodStart)} → ${fmt(audit.periodEnd)}`
                          : fmt(audit.startDate)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {t(`auditPanel.typeLabels.${AUDIT_TYPE_KEYS[audit.type]}`)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={audit.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[140px] truncate">
                        {auditorLabel}
                      </td>
                      <td className="px-4 py-3">
                        {findings.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-xs">
                            {majorCount > 0 && (
                              <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium">
                                {majorCount} Major
                              </span>
                            )}
                            {minorCount > 0 && (
                              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                                {minorCount} Minor
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/70 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 w-[120px]">
                        {totalControls > 0 ? (
                          <div className="space-y-1">
                            <Progress value={progressPct} className="h-1.5" />
                            <p className="text-xs text-muted-foreground/70">
                              {reviewedControls}/{totalControls}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/70 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {showModal && (
        <ScheduleAuditModal
          onClose={() => setShowModal(false)}
          onCreated={onCreated}
        />
      )}
    </PageTemplate>
  );
}
