import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Lock } from 'lucide-react';
import type {
  RiskSnapshotRecord,
  RiskSnapshotItem,
} from '@/services/api/risks';

const IMPACT_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  MITIGATED: 'bg-green-50 text-green-700',
  ACCEPTED: 'bg-slate-100 text-slate-600',
  TRANSFERRED: 'bg-purple-50 text-purple-700',
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Read-only view of a risk snapshot's body — title, immutable notice, metric
 * cards, and the items table. Used by both the admin SnapshotPage (wrapped
 * with share toggle + CSV export) and the auditor-portal route (rendered
 * standalone — no admin controls).
 */
export function RiskSnapshotItemsView({ snap }: { snap: RiskSnapshotRecord }) {
  const { t } = useTranslation('risk');

  const items: RiskSnapshotItem[] = useMemo(
    () => snap.items ?? [],
    [snap.items],
  );

  const metrics = useMemo(() => {
    return {
      total: items.length,
      criticalHigh: items.filter(
        (i) => i.impact === 'CRITICAL' || i.impact === 'HIGH',
      ).length,
      accepted: items.filter((i) => i.status === 'ACCEPTED').length,
      mitigated: items.filter((i) => i.status === 'MITIGATED').length,
    };
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{snap.name}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('snapshot.detail.createdInfo', {
            date: fmt(snap.createdAt),
            count: snap.riskCount,
          })}
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Lock className="w-4 h-4 shrink-0" />
        {t('snapshot.detail.immutableNotice')}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: t('snapshot.detail.totalRisks'), value: metrics.total },
          {
            label: t('snapshot.detail.criticalHigh'),
            value: metrics.criticalHigh,
          },
          { label: t('snapshot.detail.accepted'), value: metrics.accepted },
          { label: t('snapshot.detail.mitigated'), value: metrics.mitigated },
        ].map((m) => (
          <Card key={m.label} className="p-5">
            <p className="text-sm text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-3xl font-semibold">{m.value}</p>
          </Card>
        ))}
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          {t('snapshot.detail.noRisks')}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">
                    {t('snapshot.detail.columns.risk')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium">
                    {t('snapshot.detail.columns.source')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium">
                    {t('snapshot.detail.columns.asset')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium">
                    {t('snapshot.detail.columns.impact')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium">
                    {t('snapshot.detail.columns.likelihood')}
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    {t('snapshot.detail.columns.score')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium">
                    {t('snapshot.detail.columns.status')}
                  </th>
                  <th className="px-4 py-2 text-left font-medium">
                    {t('snapshot.detail.columns.treatments')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={`${item.source ?? 'legacy'}:${item.sourceId ?? item.id}`}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium max-w-xs">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600">
                        {item.source === 'prisma'
                          ? t('snapshot.detail.sources.prisma')
                          : item.source === 'register'
                            ? t('snapshot.detail.sources.register')
                            : t('snapshot.detail.sources.legacy')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.assetTitle}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${IMPACT_COLORS[item.impact] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {item.impact}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${IMPACT_COLORS[item.likelihood] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                      >
                        {item.likelihood}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {item.riskScore}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.treatments.length === 0 ? (
                        <span className="text-muted-foreground text-xs">
                          {t('snapshot.detail.none')}
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.treatments.map((tx) => (
                            <span
                              key={tx.controlId}
                              title={tx.title}
                              className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-700"
                            >
                              {tx.isoReference}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
