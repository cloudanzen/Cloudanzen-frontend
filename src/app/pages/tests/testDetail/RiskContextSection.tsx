import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';

export function RiskContextSection({ testId }: { testId: string }) {
  const { t } = useTranslation('tests');
  const { data, isLoading } = useQuery({
    queryKey: ['tests', 'risk-context', testId],
    queryFn: async () => {
      const res = await testsService.getRiskContext(testId);
      return res.data ?? null;
    },
    staleTime: STALE.TESTS,
  });

  if (isLoading)
    return (
      <p className="text-sm text-gray-400 animate-pulse">
        {t('riskContext.loading')}
      </p>
    );
  if (!data || (data.results.length === 0 && data.risks.length === 0))
    return (
      <p className="text-sm text-gray-400">{t('riskContext.noContext')}</p>
    );

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          {t('riskContext.linkedRiskEngine')}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900">
          {data.linkedTest.riskEngineTestId ?? t('riskContext.notLinked')}
        </p>
      </div>
      {data.results.slice(0, 3).map((result) => (
        <div key={result.id} className="rounded-lg border border-gray-100 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-gray-900">
              {result.resourceName}
            </p>
            <span className="text-xs text-gray-500">{result.signalType}</span>
          </div>
          <p className="mt-1 text-sm text-gray-600">{result.reason}</p>
        </div>
      ))}
      {data.risks.slice(0, 2).map((risk) => (
        <div
          key={risk.id}
          className="rounded-lg bg-red-50 border border-red-100 p-3"
        >
          <p className="text-sm font-medium text-red-900">{risk.title}</p>
          <p className="mt-1 text-xs text-red-700">
            {t('riskContext.riskInfo', {
              severity: risk.severity,
              score: risk.score,
              status: risk.status,
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
