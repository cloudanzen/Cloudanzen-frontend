/**
 * audit-detail/SnapshotCards.tsx — split out of the original 2,267-line
 * AuditDetailPage.tsx in Phase 4. Component body is unchanged.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Link } from 'react-router';
import { Camera } from 'lucide-react';
import type { RiskSnapshotRecord } from '@/services/api/risks';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { auditsService, AuditDataSnapshotType } from '@/services/api/audits';

/** Snapshot sections are typed loosely upstream; each carries a count. */
type SectionTotal = { total?: number } | undefined;

export function SnapshotSummaryCard({ auditId }: { auditId: string }) {
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
            {(snapshotData.data.riskRegister as SectionTotal)?.total ?? 0}
          </span>
          <span>
            {t('auditDetail.tabs.assets')}:{' '}
            {(snapshotData.data.assetInventory as SectionTotal)?.total ?? 0}
          </span>
          <span>
            {t('auditDetail.tabs.personnel')}:{' '}
            {(snapshotData.data.personnel as SectionTotal)?.total ?? 0}
          </span>
          <span>
            {t('auditDetail.tabs.integrations')}:{' '}
            {(snapshotData.data.integrations as SectionTotal)?.total ?? 0}
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
export function SharedRiskSnapshotsCard({ auditId }: { auditId: string }) {
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
