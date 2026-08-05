/**
 * audit-detail/DataSummaryTab.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { SharedRiskSnapshotsCard, SnapshotSummaryCard } from './SnapshotCards';
import { BreakdownChips } from './FrameworkTab';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { auditsService, AuditSummaryResponse } from '@/services/api/audits';

/** Rows come from four differently-shaped endpoints; every rendered cell
 * is a scalar. */
type SummaryRow = Record<string, string | number | null | undefined>;

export function DataSummaryTab({
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
    []) as SummaryRow[];

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
