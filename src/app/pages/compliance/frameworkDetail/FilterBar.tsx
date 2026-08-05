/**
 * frameworkDetail/FilterBar.tsx — split out of FrameworkDetailPage.tsx in
 * Phase 4. Component body is unchanged.
 */

import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { FilterMode } from './shared';

export function FilterBar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
}: {
  filter: FilterMode;
  onFilterChange: (f: FilterMode) => void;
  search: string;
  onSearchChange: (s: string) => void;
  counts: { all: number; gaps: number; excluded: number };
}) {
  const { t } = useTranslation('compliance');
  const modes: { key: FilterMode; label: string; count: number }[] = [
    { key: 'all', label: t('frameworkDetail.filter.all'), count: counts.all },
    {
      key: 'gaps',
      label: t('frameworkDetail.filter.gapsOnly'),
      count: counts.gaps,
    },
    {
      key: 'excluded',
      label: t('frameworkDetail.filter.excluded'),
      count: counts.excluded,
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {modes.map((m) => (
          <button
            key={m.key}
            onClick={() => onFilterChange(m.key)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === m.key
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {m.label}{' '}
            <span
              className={`ml-1 ${filter === m.key ? 'text-gray-300' : 'text-gray-400'}`}
            >
              {m.count}
            </span>
          </button>
        ))}
      </div>
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder={t('frameworkDetail.filter.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>
    </div>
  );
}

// ── Requirement Row ──────────────────────────────────────────────────────────
