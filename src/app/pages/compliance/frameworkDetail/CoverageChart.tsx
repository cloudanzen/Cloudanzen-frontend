/**
 * CoverageChart.tsx — F2: Recharts lazy-loaded chart component
 *
 * This component is intentionally split from OverviewTab.tsx so that the
 * Recharts vendor chunk (vendor-charts) is only loaded when this component
 * is actually rendered. OverviewTab imports it via React.lazy + Suspense.
 *
 * When history data is absent (< 2 snapshots), OverviewTab never renders this
 * component, so the Recharts chunk is never fetched for framework overview
 * pages without coverage history — saving ~341 KB on the initial page load.
 */

import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CoverageSnapshotDto } from '@/services/api/frameworks';

interface CoverageChartProps {
  history: CoverageSnapshotDto[];
  openGaps: number;
}

export function CoverageChart({ history, openGaps }: CoverageChartProps) {
  const { t } = useTranslation('compliance');
  const data = history.map((item) => ({
    time: new Date(item.calculatedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    controlCoveragePct: item.controlCoveragePct,
    testPassRatePct: item.testPassRatePct,
    openGaps: item.openGaps,
  }));

  return (
    <>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="controlCoveragePct"
              stroke="#2563eb"
              fill="#bfdbfe"
              name={t('frameworkTabs.overview.controlCoverage')}
            />
            <Area
              type="monotone"
              dataKey="testPassRatePct"
              stroke="#16a34a"
              fill="#bbf7d0"
              name={t('frameworkTabs.overview.testPassRate')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        {t('frameworkTabs.overview.openGapsNow')}{' '}
        <span className="font-medium text-gray-800">{openGaps}</span>
      </div>
    </>
  );
}
