import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import type { TestRunRecord } from '@/services/api/tests';
import { LastResultBadge } from './StatusBadge';
import { fmtDateTime } from '@/lib/format-date';

export function RunsSection({ testId }: { testId: string }) {
  const { t } = useTranslation('tests');
  const { data, isLoading } = useQuery({
    queryKey: QK.testRuns(testId),
    queryFn: async () => {
      const res = await testsService.getTestRuns(testId);
      if (res.success && res.data) return res.data as TestRunRecord[];
      return [];
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading)
    return (
      <p className="text-sm text-gray-400 animate-pulse">{t('runs.loading')}</p>
    );
  if (!data || data.length === 0)
    return <p className="text-sm text-gray-400">{t('runs.noRuns')}</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100">
            <th className="text-left pb-2 pr-3">{t('runs.runAt')}</th>
            <th className="text-left pb-2 pr-3">{t('runs.result')}</th>
            <th className="text-left pb-2 pr-3">{t('runs.source')}</th>
            <th className="text-left pb-2 pr-3">{t('runs.summary')}</th>
            <th className="text-left pb-2">{t('runs.duration')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {data.map((run) => (
            <tr key={run.id} className="py-2">
              <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                {fmtDateTime(run.executedAt)}
              </td>
              <td className="py-2 pr-3">
                <LastResultBadge result={run.status} />
              </td>
              <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                {run.executionSource ?? '\u2014'}
              </td>
              <td
                className="py-2 pr-3 text-xs text-gray-700 max-w-[200px] truncate"
                title={run.summary}
              >
                {run.summary || '\u2014'}
              </td>
              <td className="py-2 text-xs text-gray-400">
                {run.durationMs != null ? `${run.durationMs}ms` : '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TrendSparkline({ testId }: { testId: string }) {
  const { t } = useTranslation('tests');
  const { data } = useQuery({
    queryKey: QK.testRuns(testId),
    queryFn: async () => {
      const res = await testsService.getTestRuns(testId);
      return (res.data ?? []) as TestRunRecord[];
    },
    staleTime: STALE.TESTS,
  });

  const items = (data ?? []).slice(0, 10).reverse();
  if (items.length === 0)
    return <p className="text-xs text-gray-400">{t('runs.noTrend')}</p>;

  const colorFor = (status: string) =>
    status === 'Pass'
      ? 'bg-green-500'
      : status === 'Fail'
        ? 'bg-red-500'
        : status === 'Warning'
          ? 'bg-amber-500'
          : 'bg-gray-300';
  const heightFor = (status: string) =>
    status === 'Pass'
      ? 'h-6'
      : status === 'Fail'
        ? 'h-10'
        : status === 'Warning'
          ? 'h-8'
          : 'h-4';

  return (
    <div>
      <div className="flex items-end gap-1.5 h-10">
        {items.map((run) => (
          <div
            key={run.id}
            title={`${run.status} - ${fmtDateTime(run.executedAt)}`}
            className={`w-3 rounded-sm ${colorFor(run.status)} ${heightFor(run.status)}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {t('runs.lastExecutions', { count: items.length })}
      </p>
    </div>
  );
}
