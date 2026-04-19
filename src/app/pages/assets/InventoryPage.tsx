import { useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Loader2,
  Database,
  Cloud,
  Monitor,
  Server,
  Package,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { assetsService } from '@/services/api/assets';

const TYPE_ICONS: Record<string, React.ElementType> = {
  CLOUD: Cloud,
  APPLICATION: Monitor,
  DATABASE: Database,
  SAAS: Globe,
  ENDPOINT: Server,
  NETWORK: Package,
  OTHER: HelpCircle,
};

function criticalityVariant(
  c: string,
): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (c === 'CRITICAL') return 'destructive';
  if (c === 'HIGH') return 'destructive';
  if (c === 'MEDIUM') return 'secondary';
  return 'outline';
}

interface AssetItem {
  id: string;
  name: string;
  type: string;
  criticality: string;
  description?: string | null;
  owner?: string | null;
  environment?: string | null;
  tags?: string[];
  createdAt?: string;
  risks?: unknown[];
}

export function InventoryPage() {
  const { t } = useTranslation('assets');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { filters, update, reset } = useUrlFilterState({
    defaults: { search: '', type: 'ALL', criticality: 'ALL' },
  });

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    assetsService
      .getAssets()
      .then((res) => {
        if (!cancelled) {
          setAssets(res?.data ?? []);
          setLoadError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load assets',
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch =
        !search ||
        `${asset.name} ${asset.description ?? ''}`
          .toLowerCase()
          .includes(search);
      const matchesType = filters.type === 'ALL' || asset.type === filters.type;
      const matchesCriticality =
        filters.criticality === 'ALL' ||
        asset.criticality === filters.criticality;
      return matchesSearch && matchesType && matchesCriticality;
    });
  }, [assets, filters.criticality, filters.search, filters.type]);

  const activeFilters = [
    ...(filters.search.trim()
      ? [
          {
            key: 'search',
            label: `Search: ${filters.search.trim()}`,
            onRemove: () => update({ search: '' }),
          },
        ]
      : []),
    ...(filters.type !== 'ALL'
      ? [
          {
            key: 'type',
            label: `Type: ${filters.type}`,
            onRemove: () => update({ type: 'ALL' }),
          },
        ]
      : []),
    ...(filters.criticality !== 'ALL'
      ? [
          {
            key: 'criticality',
            label: `Criticality: ${filters.criticality}`,
            onRemove: () => update({ criticality: 'ALL' }),
          },
        ]
      : []),
  ];

  // Summary by type
  const typeCounts = assets.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <PageTemplate
      title={t('inventory.title')}
      description={t('inventory.description')}
    >
      {loadError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load assets: {loadError}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          <PageFilterBar
            searchValue={filters.search}
            onSearchChange={(value) => update({ search: value })}
            searchPlaceholder={t('inventory.searchPlaceholder')}
            selects={[
              {
                key: 'type',
                value: filters.type,
                placeholder: 'Type',
                onChange: (value) => update({ type: value }),
                options: [
                  { value: 'ALL', label: 'All types' },
                  ...Object.keys(typeCounts).map((type) => ({
                    value: type,
                    label: type,
                  })),
                ],
              },
              {
                key: 'criticality',
                value: filters.criticality,
                placeholder: 'Criticality',
                onChange: (value) => update({ criticality: value }),
                options: [
                  { value: 'ALL', label: 'All criticality' },
                  { value: 'LOW', label: 'Low' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'HIGH', label: 'High' },
                  { value: 'CRITICAL', label: 'Critical' },
                ],
              },
            ]}
            resultCount={filteredAssets.length}
            resultLabel="assets"
            activeFilters={activeFilters}
            onClearAll={reset}
          />

          {/* Type summary */}
          {assets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(typeCounts).map(([type, count]) => {
                const Icon = TYPE_ICONS[type] ?? HelpCircle;
                return (
                  <Card key={type} className="p-4 text-center">
                    <Icon className="w-6 h-6 text-gray-500 mx-auto mb-1" />
                    <div className="text-xl font-bold text-gray-900">
                      {count}
                    </div>
                    <div className="text-xs text-gray-500">{type}</div>
                  </Card>
                );
              })}
            </div>
          )}

          <Card>
            <div className="overflow-x-auto">
              <table
                className="w-full"
                role="table"
                aria-label="Asset inventory"
              >
                <thead className="bg-gray-50 border-b" role="rowgroup">
                  <tr role="row">
                    {[
                      t('inventory.columns.name'),
                      t('inventory.columns.type'),
                      t('inventory.columns.criticality'),
                      t('inventory.columns.risks'),
                      t('inventory.columns.owner'),
                      t('inventory.columns.createdAt'),
                    ].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        role="columnheader"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className="bg-white divide-y divide-gray-200"
                  role="rowgroup"
                >
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-sm text-gray-400"
                      >
                        {t('inventory.noAssets')}
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => {
                      const Icon = TYPE_ICONS[asset.type] ?? HelpCircle;
                      return (
                        <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {asset.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {asset.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={criticalityVariant(asset.criticality)}
                            >
                              {asset.criticality}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                            {asset.risks?.length ?? 0}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-400 max-w-[200px]">
                            <span className="truncate block">
                              {asset.description ?? '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                            {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}
