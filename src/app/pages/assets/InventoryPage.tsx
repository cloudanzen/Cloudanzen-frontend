import { useMemo } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Cloud,
  Database,
  Github,
  HardDrive,
  HelpCircle,
  Layers3,
  Loader2,
  Monitor,
  Package,
  Server,
} from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { assetsService } from '@/services/api/assets';
import { Asset } from '@/services/api/types';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

const TYPE_ICONS: Record<string, React.ElementType> = {
  CLOUD: Cloud,
  APPLICATION: Monitor,
  DATABASE: Database,
  SAAS: Layers3,
  ENDPOINT: Server,
  NETWORK: Package,
  REPOSITORY: Github,
  VENDOR: HardDrive,
  OTHER: HelpCircle,
};

const PROVIDER_STYLES: Record<string, string> = {
  aws: 'bg-amber-50 text-amber-700 border-amber-200',
  github: 'bg-slate-100 text-slate-800 border-slate-200',
  fleet: 'bg-blue-50 text-blue-700 border-blue-200',
  manual: 'bg-gray-100 text-gray-700 border-gray-200',
};

function providerLabel(provider: string, t: (key: string) => string) {
  return t(`inventory.providers.${provider}`);
}

function criticalityVariant(
  c: string,
): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (c === 'CRITICAL' || c === 'HIGH') return 'destructive';
  if (c === 'MEDIUM') return 'secondary';
  return 'outline';
}

function relativeTime(value?: string | null) {
  if (!value) return '—';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function InventoryPage() {
  const { t } = useTranslation('assets');
  const navigate = useNavigate();
  const { filters, update, reset } = useUrlFilterState({
    defaults: {
      search: '',
      type: 'ALL',
      criticality: 'ALL',
      category: 'ALL',
      provider: 'ALL',
      isStale: 'ALL',
      page: '1',
      limit: '50',
    },
  });

  const cleanFilters = useMemo(() => ({
    page: Number(filters.page || '1'),
    limit: Number(filters.limit || '50'),
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.type !== 'ALL' ? { type: filters.type } : {}),
    ...(filters.criticality !== 'ALL' ? { criticality: filters.criticality } : {}),
    ...(filters.category !== 'ALL' ? { category: filters.category } : {}),
    ...(filters.provider !== 'ALL' ? { provider: filters.provider } : {}),
    ...(filters.isStale !== 'ALL' ? { isStale: filters.isStale === 'true' } : {}),
  }), [filters]);

  const { data: assetsData, isLoading, error } = useQuery({
    queryKey: QK.assets(cleanFilters),
    queryFn: () => assetsService.getAssets(cleanFilters),
    staleTime: STALE.DASHBOARD,
  });
  const { data: coverageData } = useQuery({
    queryKey: QK.assetCoverage(),
    queryFn: () => assetsService.getCoverage(),
    staleTime: STALE.DASHBOARD,
  });

  const assets = Array.isArray(assetsData?.data) ? (assetsData.data as Asset[]) : [];
  const pagination = assetsData?.pagination;
  const coverage = coverageData?.data;

  const activeFilters = [
    ...(filters.search.trim() ? [{ key: 'search', label: `Search: ${filters.search.trim()}`, onRemove: () => update({ search: '' }) }] : []),
    ...(filters.type !== 'ALL' ? [{ key: 'type', label: `${t('inventory.columns.type')}: ${filters.type}`, onRemove: () => update({ type: 'ALL' }) }] : []),
    ...(filters.criticality !== 'ALL' ? [{ key: 'criticality', label: `${t('inventory.columns.criticality')}: ${filters.criticality}`, onRemove: () => update({ criticality: 'ALL' }) }] : []),
    ...(filters.category !== 'ALL' ? [{ key: 'category', label: `${t('inventory.filters.category')}: ${filters.category}`, onRemove: () => update({ category: 'ALL' }) }] : []),
    ...(filters.provider !== 'ALL' ? [{ key: 'provider', label: `${t('inventory.filters.provider')}: ${providerLabel(filters.provider, t)}`, onRemove: () => update({ provider: 'ALL' }) }] : []),
    ...(filters.isStale !== 'ALL' ? [{ key: 'isStale', label: filters.isStale === 'true' ? t('inventory.filters.staleOnly') : t('inventory.filters.activeOnly'), onRemove: () => update({ isStale: 'ALL' }) }] : []),
  ];

  return (
    <PageTemplate title={t('inventory.title')} description={t('inventory.description')}>
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load assets: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : null}

      {coverage ? (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('inventory.summary.total')}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{coverage.total}</p>
          </Card>
          {coverage.byProvider.slice(0, 3).map((item) => (
            <Card
              key={item.provider}
              className="cursor-pointer p-4 transition-shadow hover:shadow-md"
              onClick={() => update({ provider: item.provider, page: '1' })}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.provider.toUpperCase()}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{item.count}</p>
               <p className="text-xs text-muted-foreground">{item.staleCount} {t('inventory.coverage.stale').toLowerCase()}</p>
            </Card>
          ))}
          <Card className="p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">{t('inventory.summary.stale')}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{coverage.staleCount}</p>
          </Card>
        </div>
      ) : null}

      <div className="space-y-6">
        <PageFilterBar
          searchValue={filters.search}
          onSearchChange={(value) => update({ search: value, page: '1' })}
          searchPlaceholder={t('inventory.searchPlaceholder')}
          selects={[
            {
              key: 'type',
              value: filters.type,
              placeholder: t('inventory.columns.type'),
              onChange: (value) => update({ type: value, page: '1' }),
              options: [
                 { value: 'ALL', label: t('inventory.filters.allTypes') },
                ...['CLOUD', 'APPLICATION', 'DATABASE', 'SAAS', 'ENDPOINT', 'NETWORK', 'REPOSITORY', 'VENDOR', 'OTHER'].map((value) => ({ value, label: value })),
              ],
            },
            {
              key: 'criticality',
              value: filters.criticality,
              placeholder: t('inventory.columns.criticality'),
              onChange: (value) => update({ criticality: value, page: '1' }),
              options: [
                 { value: 'ALL', label: t('inventory.filters.allCriticality') },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ],
            },
            {
              key: 'category',
              value: filters.category,
              placeholder: t('inventory.filters.category'),
              onChange: (value) => update({ category: value, page: '1' }),
              options: [
                 { value: 'ALL', label: t('inventory.filters.allCategories') },
                ...['INFRASTRUCTURE', 'DATA_STORE', 'APPLICATION', 'ENDPOINT', 'NETWORK', 'IDENTITY', 'SECRETS', 'OTHER'].map((value) => ({ value, label: value })),
              ],
            },
            {
              key: 'provider',
              value: filters.provider,
              placeholder: t('inventory.filters.provider'),
              onChange: (value) => update({ provider: value, page: '1' }),
              options: [
                 { value: 'ALL', label: t('inventory.filters.allProviders') },
                { value: 'aws', label: t('inventory.providers.aws') },
                { value: 'github', label: t('inventory.providers.github') },
                { value: 'fleet', label: t('inventory.providers.fleet') },
                { value: 'manual', label: t('inventory.providers.manual') },
              ],
            },
            {
              key: 'isStale',
              value: filters.isStale,
              placeholder: t('inventory.filters.stale'),
              onChange: (value) => update({ isStale: value, page: '1' }),
              options: [
                { value: 'ALL', label: t('inventory.filters.allStatuses') },
                { value: 'false', label: t('inventory.filters.activeOnly') },
                { value: 'true', label: t('inventory.filters.staleOnly') },
              ],
            },
          ]}
          resultCount={assets.length}
          resultLabel={t('inventory.resultsLabel')}
          activeFilters={activeFilters}
          onClearAll={reset}
        />

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Asset inventory">
              <thead className="border-b bg-gray-50" role="rowgroup">
                <tr role="row">
                  {[t('inventory.columns.name'), t('inventory.columns.type'), t('inventory.columns.provider'), t('inventory.columns.category'), t('inventory.columns.criticality'), t('inventory.columns.lastSeen'), t('inventory.columns.status')].map((h) => (
                    <th key={h} scope="col" role="columnheader" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white" role="rowgroup">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">{t('inventory.noAssets')}</td>
                  </tr>
                ) : (
                  assets.map((asset) => {
                    const Icon = TYPE_ICONS[asset.type] ?? HelpCircle;
                    const provider = asset.provider ?? 'manual';
                    return (
                      <tr
                        key={asset.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => navigate(`/assets/inventory/${asset.id}`)}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="max-w-[220px] truncate">{asset.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{asset.type}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${PROVIDER_STYLES[provider] ?? PROVIDER_STYLES.manual}`}>{providerLabel(provider, t)}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{asset.category ?? '—'}</td>
                        <td className="px-6 py-4"><Badge variant={criticalityVariant(asset.criticality)}>{asset.criticality}</Badge></td>
                        <td className="px-6 py-4 text-xs text-gray-500">{relativeTime(asset.lastDiscoveredAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {asset.isStale ? (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{t('inventory.stale')}</Badge>
                          ) : (
                            asset.status ?? 'ACTIVE'
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {pagination ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>{t('inventory.pagination', { page: pagination.page, totalPages: pagination.totalPages })}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => update({ page: String(Math.max(1, pagination.page - 1)) })}
                className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-50"
              >
                {t('inventory.prev')}
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => update({ page: String(Math.min(pagination.totalPages, pagination.page + 1)) })}
                className="rounded-md border border-gray-200 px-3 py-1.5 disabled:opacity-50"
              >
                {t('inventory.next')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </PageTemplate>
  );
}
