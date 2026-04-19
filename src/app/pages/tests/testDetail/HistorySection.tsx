import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import { fmtDate } from '@/lib/format-date';

export function HistorySection({ testId }: { testId: string }) {
  const { t } = useTranslation('tests');
  const { data, isLoading } = useQuery({
    queryKey: QK.testHistory(testId),
    queryFn: async () => {
      const res = await testsService.getHistory(testId);
      if (res.success && res.data) return res.data;
      return [];
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading)
    return (
      <p className="text-sm text-gray-400 animate-pulse">
        {t('history.loading')}
      </p>
    );
  if (!data || data.length === 0)
    return <p className="text-sm text-gray-400">{t('history.noHistory')}</p>;

  return (
    <ol className="relative border-l border-gray-200 ml-2 space-y-4">
      {data.map((entry) => (
        <li key={entry.id} className="ml-4">
          <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-400 border-2 border-white" />
          <p className="text-xs text-gray-400">{fmtDate(entry.createdAt)}</p>
          <p className="text-sm font-medium text-gray-800">
            {entry.changeType}
          </p>
          {(entry.oldValue || entry.newValue) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {entry.oldValue && (
                <span className="line-through mr-2">{entry.oldValue}</span>
              )}
              {entry.newValue && (
                <span className="text-green-700">{entry.newValue}</span>
              )}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}
