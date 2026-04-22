import { useMemo, useState } from 'react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  Github,
  HardDrive,
  Link2,
  HelpCircle,
  Layers3,
  Loader2,
  Monitor,
  ShieldAlert,
  Package,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageTemplate } from '@/app/components/PageTemplate';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { assetsService } from '@/services/api/assets';
import { Asset } from '@/services/api/types';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';

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
  gitlab: 'bg-orange-50 text-orange-700 border-orange-200',
  bitbucket: 'bg-sky-50 text-sky-700 border-sky-200',
  gcp: 'bg-violet-50 text-violet-700 border-violet-200',
  azure: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  jamf: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  kandji: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  intune: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  manual: 'bg-gray-100 text-gray-700 border-gray-200',
};

const HEALTH_STYLES: Record<string, string> = {
  healthy: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  stale: 'bg-red-50 text-red-700 border-red-200',
  not_connected: 'bg-gray-100 text-gray-700 border-gray-200',
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

function healthIcon(health: string) {
  if (health === 'healthy') return CheckCircle2;
  if (health === 'warning' || health === 'stale') return ShieldAlert;
  return Link2;
}

function asUrlValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

export function InventoryPage() {
  const { t } = useTranslation('assets');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [bulkClassification, setBulkClassification] = useState({
    dataSensitivity: 'STANDARD',
    environment: 'production',
    internetExposed: 'false',
  });
  const { filters, update, reset } = useUrlFilterState({
    defaults: {
      search: '',
      type: 'ALL',
      criticality: 'ALL',
      category: 'ALL',
      subtype: '',
      provider: 'ALL',
      isStale: 'ALL',
      recentDays: '',
      unclassified: 'ALL',
      withoutControls: 'ALL',
      ownerless: 'ALL',
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
    ...(filters.subtype ? { subtype: filters.subtype } : {}),
    ...(filters.provider !== 'ALL' ? { provider: filters.provider } : {}),
    ...(filters.isStale !== 'ALL' ? { isStale: filters.isStale === 'true' } : {}),
    ...(filters.recentDays ? { recentDays: Number(filters.recentDays) } : {}),
    ...(filters.unclassified !== 'ALL' ? { unclassified: filters.unclassified === 'true' } : {}),
    ...(filters.withoutControls !== 'ALL' ? { withoutControls: filters.withoutControls === 'true' } : {}),
    ...(filters.ownerless !== 'ALL' ? { ownerless: filters.ownerless === 'true' } : {}),
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
  const { data: reviewQueueData } = useQuery({
    queryKey: QK.assetReviewQueues(),
    queryFn: () => assetsService.getReviewQueues(),
    staleTime: STALE.DASHBOARD,
  });
  const { data: savedViewsData } = useQuery({
    queryKey: QK.assetSavedViews(),
    queryFn: () => assetsService.getSavedViews(),
    staleTime: STALE.DASHBOARD,
  });

  const assets = Array.isArray(assetsData?.data) ? (assetsData.data as Asset[]) : [];
  const pagination = assetsData?.pagination;
  const coverage = coverageData?.data;
  const reviewQueues = reviewQueueData?.data ?? [];
  const savedViews = savedViewsData?.data ?? [];
  const providerOptions = useMemo(() => {
    const defaults = ['aws', 'github', 'fleet', 'gitlab', 'bitbucket', 'gcp', 'azure', 'jamf', 'kandji', 'intune', 'manual'];
    const dynamic = (coverage?.providerHealth ?? []).map((item) => item.provider);
    return Array.from(new Set([...defaults, ...dynamic]));
  }, [coverage?.providerHealth]);

  const specializedViews = [
    { label: 'Endpoints', patch: { category: 'ENDPOINT', subtype: '' } },
    { label: 'Repositories', patch: { category: 'ALL', subtype: 'git_repository' } },
    { label: 'Databases', patch: { category: 'DATA_STORE', subtype: '' } },
    { label: 'Cloud Infra', patch: { category: 'INFRASTRUCTURE', subtype: '' } },
    { label: 'Secrets', patch: { category: 'SECRETS', subtype: '' } },
  ];

  const saveViewMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => assetsService.createSavedView({
      ...payload,
      filters: filters as Record<string, string | number | boolean | null>,
      sharedWithTeam: true,
    }),
    onSuccess: async () => {
      toast.success('Saved view created');
      await qc.invalidateQueries({ queryKey: QK.assetSavedViews() });
    },
    onError: () => toast.error('Failed to save view'),
  });

  const deleteViewMutation = useMutation({
    mutationFn: (viewId: string) => assetsService.deleteSavedView(viewId),
    onSuccess: async () => {
      toast.success('Saved view removed');
      await qc.invalidateQueries({ queryKey: QK.assetSavedViews() });
    },
    onError: () => toast.error('Failed to delete saved view'),
  });

  const updateViewMutation = useMutation({
    mutationFn: ({ viewId, name, description, sharedWithTeam }: { viewId: string; name: string; description?: string; sharedWithTeam?: boolean }) =>
      assetsService.updateSavedView(viewId, {
        name,
        description,
        filters: filters as Record<string, string | number | boolean | null>,
        sharedWithTeam,
      }),
    onSuccess: async () => {
      toast.success('Saved view updated');
      await qc.invalidateQueries({ queryKey: QK.assetSavedViews() });
    },
    onError: () => toast.error('Failed to update saved view'),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof assetsService.bulkUpdateAssets>[0]) => assetsService.bulkUpdateAssets(payload),
    onSuccess: async () => {
      toast.success('Assets updated');
      setSelectedAssetIds([]);
      await Promise.all([
        qc.invalidateQueries({ queryKey: QK.assets() }),
        qc.invalidateQueries({ queryKey: QK.assetCoverage() }),
        qc.invalidateQueries({ queryKey: QK.assetReviewQueues() }),
      ]);
    },
    onError: () => toast.error('Failed to update selected assets'),
  });

  async function handleExport(format: 'csv' | 'xlsx' | 'pdf') {
    try {
      const blob = await assetsService.exportAssets(format, cleanFilters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asset-inventory.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export assets');
    }
  }

  function applyQueueFilters(queueFilters?: Record<string, unknown>) {
    const next = Object.fromEntries(
      Object.entries(queueFilters ?? {}).map(([key, value]) => [key, asUrlValue(value)]),
    );
    update({ ...next, page: '1' });
  }

  function applySavedView(viewFilters?: Record<string, unknown>) {
    const next = Object.fromEntries(
      Object.entries(viewFilters ?? {}).map(([key, value]) => [key, value === null ? '' : asUrlValue(value)]),
    );
    update({ ...next, page: '1' });
  }

  function handleSaveCurrentView() {
    const name = window.prompt('Name this saved view');
    if (!name?.trim()) return;
    const description = window.prompt('Optional description') ?? undefined;
    saveViewMutation.mutate({ name: name.trim(), description: description?.trim() || undefined });
  }

  function handleUpdateView(viewId: string, currentName: string, currentDescription?: string | null) {
    const name = window.prompt('Rename saved view', currentName);
    if (!name?.trim()) return;
    const description = window.prompt('Description', currentDescription ?? '') ?? undefined;
    updateViewMutation.mutate({ viewId, name: name.trim(), description: description?.trim() || undefined, sharedWithTeam: true });
  }

  function handleToggleSharedView(viewId: string, currentName: string, currentDescription: string | null | undefined, sharedWithTeam: boolean) {
    updateViewMutation.mutate({
      viewId,
      name: currentName,
      description: currentDescription ?? undefined,
      sharedWithTeam: !sharedWithTeam,
    });
  }

  function toggleAssetSelection(assetId: string) {
    setSelectedAssetIds((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]);
  }

  function toggleSelectAll() {
    setSelectedAssetIds((current) => current.length === assets.length ? [] : assets.map((asset) => asset.id));
  }

  function handleBulkAssignToMe() {
    if (!currentUser || selectedAssetIds.length === 0) return;
    bulkUpdateMutation.mutate({ assetIds: selectedAssetIds, ownerId: currentUser.id });
  }

  function handleBulkClearOwner() {
    if (selectedAssetIds.length === 0) return;
    bulkUpdateMutation.mutate({ assetIds: selectedAssetIds, ownerId: null });
  }

  function handleBulkClassification() {
    if (selectedAssetIds.length === 0) return;
    bulkUpdateMutation.mutate({
      assetIds: selectedAssetIds,
      classification: {
        dataSensitivity: bulkClassification.dataSensitivity || null,
        environment: bulkClassification.environment || null,
        internetExposed: bulkClassification.internetExposed === 'mixed'
          ? null
          : bulkClassification.internetExposed === 'true',
      },
    });
  }

  const activeFilters = [
    ...(filters.search.trim() ? [{ key: 'search', label: `Search: ${filters.search.trim()}`, onRemove: () => update({ search: '' }) }] : []),
    ...(filters.type !== 'ALL' ? [{ key: 'type', label: `${t('inventory.columns.type')}: ${filters.type}`, onRemove: () => update({ type: 'ALL' }) }] : []),
    ...(filters.criticality !== 'ALL' ? [{ key: 'criticality', label: `${t('inventory.columns.criticality')}: ${filters.criticality}`, onRemove: () => update({ criticality: 'ALL' }) }] : []),
    ...(filters.category !== 'ALL' ? [{ key: 'category', label: `${t('inventory.filters.category')}: ${filters.category}`, onRemove: () => update({ category: 'ALL' }) }] : []),
    ...(filters.subtype ? [{ key: 'subtype', label: `Subtype: ${filters.subtype}`, onRemove: () => update({ subtype: '' }) }] : []),
    ...(filters.provider !== 'ALL' ? [{ key: 'provider', label: `${t('inventory.filters.provider')}: ${providerLabel(filters.provider, t)}`, onRemove: () => update({ provider: 'ALL' }) }] : []),
    ...(filters.isStale !== 'ALL' ? [{ key: 'isStale', label: filters.isStale === 'true' ? t('inventory.filters.staleOnly') : t('inventory.filters.activeOnly'), onRemove: () => update({ isStale: 'ALL' }) }] : []),
    ...(filters.recentDays ? [{ key: 'recentDays', label: `Discovered in ${filters.recentDays}d`, onRemove: () => update({ recentDays: '' }) }] : []),
    ...(filters.unclassified !== 'ALL' ? [{ key: 'unclassified', label: 'Unclassified only', onRemove: () => update({ unclassified: 'ALL' }) }] : []),
    ...(filters.withoutControls !== 'ALL' ? [{ key: 'withoutControls', label: 'Without controls', onRemove: () => update({ withoutControls: 'ALL' }) }] : []),
    ...(filters.ownerless !== 'ALL' ? [{ key: 'ownerless', label: 'Ownerless only', onRemove: () => update({ ownerless: 'ALL' }) }] : []),
  ];

  return (
    <PageTemplate title={t('inventory.title')} description={t('inventory.description')}>
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load assets: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      ) : null}

      {coverage ? (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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

          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ownership completeness</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{coverage.ownershipPct}%</p>
              <p className="text-xs text-muted-foreground">{coverage.ownedCount} of {coverage.total} assets have owners</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Classification completeness</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{coverage.classificationPct}%</p>
              <p className="text-xs text-muted-foreground">{coverage.classifiedCount} of {coverage.total} assets are classified</p>
            </Card>
          </div>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('inventory.coverage.providerHealth')}</p>
                <p className="text-sm text-muted-foreground">{t('inventory.coverage.providerHealthDesc')}</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {coverage.providerHealth.slice(0, 6).map((item) => {
                const Icon = healthIcon(item.health);
                return (
                  <button
                    key={item.provider}
                    type="button"
                    onClick={() => update({ provider: item.provider, page: '1' })}
                    className="rounded-xl border border-border p-4 text-left transition-shadow hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{providerLabel(item.provider, t)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.count} {t('inventory.resultsLabel')} · {item.configuredCount} {t('inventory.coverage.connections')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${HEALTH_STYLES[item.health]}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {t(`inventory.coverage.health.${item.health}`)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.stalePct}% {t('inventory.coverage.stale').toLowerCase()}</span>
                      <span>{item.lastScanAt ? relativeTime(item.lastScanAt) : t('inventory.coverage.noScan')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {reviewQueues.length ? (
            <Card className="p-4">
              <div className="mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review queues</p>
                <p className="text-sm text-muted-foreground">Jump into stale, unclassified, or critical asset follow-up work.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                {reviewQueues.map((queue) => (
                  <button
                    key={queue.key}
                    type="button"
                    onClick={() => applyQueueFilters(queue.filters)}
                    className="rounded-xl border border-border p-4 text-left transition-shadow hover:shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{queue.label}</p>
                    <p className="mt-2 text-2xl font-bold text-foreground">{queue.count}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{queue.reviewType.toLowerCase()} review</p>
                  </button>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specialized views</p>
                <p className="text-sm text-muted-foreground">Apply focused inventory slices for common audit and ops workflows.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {specializedViews.map((view) => (
                <button
                  key={view.label}
                  type="button"
                  onClick={() => update({ ...view.patch, page: '1' })}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {view.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saved views</p>
                <p className="text-sm text-muted-foreground">Reuse the filter combinations your team comes back to most often.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveCurrentView}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                Save current view
              </button>
            </div>
            {savedViews.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {savedViews.map((view) => (
                  <div key={view.id} className="rounded-xl border border-border p-4">
                    {(() => {
                      const canManage = !view.isSystem && (!view.createdBy || view.createdBy === currentUser?.id);
                      return (
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => applySavedView(view.filters)} className="text-left">
                        <p className="text-sm font-semibold text-foreground">{view.name}</p>
                        {view.description ? <p className="mt-1 text-xs text-muted-foreground">{view.description}</p> : null}
                      </button>
                      {canManage ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSharedView(view.id, view.name, view.description, view.sharedWithTeam)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {view.sharedWithTeam ? 'Unshare' : 'Share'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateView(view.id, view.name, view.description)}
                            className="text-xs text-muted-foreground hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteViewMutation.mutate(view.id)}
                            className="text-xs text-muted-foreground hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </div>
                      );
                    })()}
                    <p className="mt-3 text-xs text-muted-foreground">{Object.keys(view.filters ?? {}).length} filters saved</p>
                    <p className="mt-1 text-xs text-muted-foreground">{view.sharedWithTeam ? 'Shared with team' : 'Private view'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No saved views yet.</p>
            )}
          </Card>
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => void handleExport('csv')}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => void handleExport('xlsx')}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            Export XLSX
          </button>
          <button
            type="button"
            onClick={() => void handleExport('pdf')}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={() => navigate('/assets/merge-review')}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
          >
            {t('mergeReview.title')}
          </button>
        </div>
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
                  ...providerOptions.map((value) => ({ value, label: providerLabel(value, t) })),
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

        {selectedAssetIds.length ? (
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-foreground">{selectedAssetIds.length} assets selected</p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={handleBulkAssignToMe} disabled={!currentUser || bulkUpdateMutation.isPending} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50">Assign to me</button>
                  <button type="button" onClick={handleBulkClearOwner} disabled={bulkUpdateMutation.isPending} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50">Clear owner</button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
                <label className="text-sm text-foreground">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Data sensitivity</span>
                  <select
                    value={bulkClassification.dataSensitivity}
                    onChange={(event) => setBulkClassification((current) => ({ ...current, dataSensitivity: event.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </label>
                <label className="text-sm text-foreground">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Environment</span>
                  <select
                    value={bulkClassification.environment}
                    onChange={(event) => setBulkClassification((current) => ({ ...current, environment: event.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                <label className="text-sm text-foreground">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Internet exposed</span>
                  <select
                    value={bulkClassification.internetExposed}
                    onChange={(event) => setBulkClassification((current) => ({ ...current, internetExposed: event.target.value }))}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                    <option value="mixed">Clear</option>
                  </select>
                </label>
                <button type="button" onClick={handleBulkClassification} disabled={bulkUpdateMutation.isPending} className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:opacity-50">Apply classification</button>
              </div>
            </div>
          </Card>
        ) : null}

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="Asset inventory">
              <thead className="border-b bg-gray-50" role="rowgroup">
                <tr role="row">
                  <th scope="col" role="columnheader" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    <input type="checkbox" checked={assets.length > 0 && selectedAssetIds.length === assets.length} onChange={toggleSelectAll} aria-label="Select all assets" />
                  </th>
                  {[t('inventory.columns.name'), t('inventory.columns.type'), t('inventory.columns.provider'), t('inventory.columns.category'), t('inventory.columns.criticality'), t('inventory.columns.lastSeen'), t('inventory.columns.status')].map((h) => (
                    <th key={h} scope="col" role="columnheader" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white" role="rowgroup">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-gray-400" />
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400">{t('inventory.noAssets')}</td>
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
                        <td className="px-4 py-4 text-sm" onClick={(event) => event.stopPropagation()}>
                          <input type="checkbox" checked={selectedAssetIds.includes(asset.id)} onChange={() => toggleAssetSelection(asset.id)} aria-label={`Select ${asset.name}`} />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="max-w-[220px] truncate">{asset.name}</span>
                            {(asset.mergeGroup?._count?.assets ?? 0) > 1 ? (
                              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                {asset.mergeGroup?._count?.assets} dupes
                              </Badge>
                            ) : null}
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
