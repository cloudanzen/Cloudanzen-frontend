/**
 * frameworkDetail/CoverageTiles.tsx — split out of FrameworkDetailPage.tsx in
 * Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/app/components/ui/card';
import { type CoverageSnapshotDto } from '@/services/api/frameworks';

export function CoverageTiles({ snap }: { snap: CoverageSnapshotDto | null }) {
  const { t } = useTranslation('compliance');
  const tiles = [
    {
      label: t('frameworkDetail.tiles.totalRequirements'),
      value: snap?.totalRequirements ?? '—',
      color: 'text-gray-700',
    },
    {
      label: t('frameworkDetail.tiles.applicable'),
      value: snap?.applicable ?? '—',
      color: 'text-blue-700',
    },
    {
      label: t('frameworkDetail.tiles.covered'),
      value: snap?.covered ?? '—',
      color: 'text-green-700',
    },
    {
      label: t('frameworkDetail.tiles.openGaps'),
      value: snap?.openGaps ?? '—',
      color: 'text-red-700',
    },
    {
      label: t('frameworkDetail.tiles.controlCoverage'),
      value: snap ? `${snap.controlCoveragePct}%` : '—',
      color: 'text-blue-700',
    },
    {
      label: t('frameworkDetail.tiles.testPassRate'),
      value: snap ? `${snap.testPassRatePct}%` : '—',
      color: 'text-green-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {tiles.map((tile) => (
        <Card key={tile.label} className="border-gray-100">
          <CardContent className="py-3 px-4">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide">
              {tile.label}
            </p>
            <p className={`text-2xl font-bold mt-0.5 ${tile.color}`}>
              {tile.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Filter Bar ───────────────────────────────────────────────────────────────
