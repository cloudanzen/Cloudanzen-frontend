/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { useNavigate } from 'react-router';
import { clearAuthSession } from '@/services/authStorage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { policiesService } from '@/services/api/policies';
import { Policy } from '@/services/api/types';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { PolicyDetailPanel } from '@/app/components/compliance/PolicyDetailPanel';
import { RefreshCw, LayoutTemplate, Plus } from 'lucide-react';

import {
  PolicyFilter,
  SortKey,
  POLICY_STATUSES,
  STATUS_CONFIG,
} from './policies/types';
import { UploadModal } from './policies/UploadModal';
import { TemplatesModal } from './policies/TemplatesModal';
import { CreatePolicyModal } from './policies/CreatePolicyModal';
import { PoliciesTable } from './policies/PoliciesTable';
import {
  SummaryCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from './policies/StateComponents';

export function PoliciesPage() {
  const { t } = useTranslation('compliance');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<PolicyFilter>({
    search: '',
    status: '',
  });
  const [frameworkFilter, setFrameworkFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [uploadPolicy, setUploadPolicy] = useState<Policy | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const filterKey = {
    search: filter.search,
    status: filter.status,
    frameworkSlugs: frameworkFilter,
  };

  const {
    data: rawPolicies,
    isLoading: loading,
    isError,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: QK.policies(filterKey),
    queryFn: async () => {
      const response = await policiesService.getPolicies({
        search: filter.search || undefined,
        status: filter.status || undefined,
        frameworkSlugs:
          frameworkFilter.length > 0 ? frameworkFilter : undefined,
      });
      if (response.success && response.data) return response.data as Policy[];
      throw new Error('Failed to load policies from the server.');
    },
    staleTime: STALE.POLICIES,
    retry: (count, err: any) => {
      if (err?.statusCode === 401) {
        clearAuthSession();
        navigate('/login');
        return false;
      }
      return count < 1;
    },
  });

  const policies: Policy[] = rawPolicies
    ? [...rawPolicies].sort((a, b) => {
        const aVal = String(a[sortKey as keyof Policy] ?? '');
        const bVal = String(b[sortKey as keyof Policy] ?? '');
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'desc' ? -cmp : cmp;
      })
    : [];

  const error: string | null = isError
    ? ((queryError as any)?.message ?? 'An unexpected error occurred.')
    : null;
  const fetchPolicies = () => qc.invalidateQueries({ queryKey: ['policies'] });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleFilterChange = (field: keyof PolicyFilter, value: string) =>
    setFilter((prev) => ({ ...prev, [field]: value }));

  const clearFilters = () => {
    setFilter({ search: '', status: '' });
    setFrameworkFilter([]);
  };
  const hasActiveFilters = !!(
    filter.search ||
    filter.status ||
    frameworkFilter.length > 0
  );
  const activeFilters = [
    ...(filter.search.trim()
      ? [
          {
            key: 'search',
            label: `${t('policies.filterLabels.search')}: ${filter.search.trim()}`,
            onRemove: () => handleFilterChange('search', ''),
          },
        ]
      : []),
    ...(filter.status
      ? [
          {
            key: 'status',
            label: `${t('policies.filterLabels.status')}: ${STATUS_CONFIG[filter.status]?.label ?? filter.status}`,
            onRemove: () => handleFilterChange('status', ''),
          },
        ]
      : []),
    ...frameworkFilter.map((slug) => ({
      key: `framework-${slug}`,
      label: `${t('policies.filterLabels.framework')}: ${slug.replace(/-/g, ' ')}`,
      onRemove: () =>
        setFrameworkFilter((current) =>
          current.filter((item) => item !== slug),
        ),
    })),
  ];

  const published = policies.filter((p) => p.status === 'PUBLISHED').length;
  const draft = policies.filter((p) => p.status === 'DRAFT').length;
  const inReview = policies.filter((p) => p.status === 'REVIEW').length;
  const archived = policies.filter((p) => p.status === 'ARCHIVED').length;

  return (
    <div className="flex flex-col bg-muted">
      {/* Modals */}
      {uploadPolicy && (
        <UploadModal
          policy={uploadPolicy}
          onClose={() => setUploadPolicy(null)}
          onUploaded={() => {
            qc.invalidateQueries({ queryKey: ['policies'] });
            setUploadPolicy(null);
          }}
        />
      )}
      {showTemplates && (
        <TemplatesModal
          onClose={() => setShowTemplates(false)}
          onCreated={() => qc.invalidateQueries({ queryKey: ['policies'] })}
        />
      )}
      {showCreate && (
        <CreatePolicyModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['policies'] });
            setShowCreate(false);
          }}
        />
      )}

      {/* Policy detail slide-over */}
      {selectedPolicy && (
        <PolicyDetailPanel
          policy={selectedPolicy}
          onClose={() => setSelectedPolicy(null)}
          onMutated={() => {
            qc.invalidateQueries({ queryKey: ['policies'] });
            setSelectedPolicy(null);
          }}
        />
      )}

      {/* ── Top App Bar ── */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {t('policies.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
            {t('policies.description')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {t('policies.filtersActive')}
            </span>
          )}
          <button
            onClick={fetchPolicies}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm disabled:opacity-50"
            title={t('policies.refreshTitle')}
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">{t('policies.refresh')}</span>
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm"
          >
            <LayoutTemplate className="w-4 h-4" />
            <span className="hidden sm:inline">{t('policies.useTemplate')}</span>
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('policies.newPolicy')}</span>
          </button>
        </div>
      </div>

      <div className="px-6 pt-3 pb-1">
        <PageFilterBar
          searchValue={filter.search}
          onSearchChange={(value) => handleFilterChange('search', value)}
          searchPlaceholder={t('policies.searchPlaceholder')}
          selects={[
            {
              key: 'status',
              value: filter.status,
              placeholder: t('policies.statusPlaceholder'),
              onChange: (value) => handleFilterChange('status', value),
              options: [
                { value: '', label: t('policies.allStatuses') },
                ...POLICY_STATUSES.map((status) => ({
                  value: status,
                  label: STATUS_CONFIG[status]?.label ?? status,
                })),
              ],
            },
          ]}
          inlineExtras={
            <FrameworkFilter
              selected={frameworkFilter}
              onChange={setFrameworkFilter}
              className="w-full"
            />
          }
          resultCount={policies.length}
          resultLabel={hasActiveFilters ? 'filtered policies' : 'policies'}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      </div>

      {/* ── Summary Cards ── */}
      {!loading && !error && policies.length > 0 && (
        <div className="px-6 pt-4 pb-2 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label={t('policies.stats.total')}
              value={policies.length}
              color="text-foreground"
              bg="bg-card"
              accent="border-border"
            />
            <SummaryCard
              label={t('policies.stats.published')}
              value={published}
              color="text-green-700"
              bg="bg-green-50"
              accent="border-green-200"
            />
            <SummaryCard
              label={t('policies.stats.review')}
              value={inReview}
              color="text-amber-700"
              bg="bg-amber-50"
              accent="border-amber-200"
            />
            <SummaryCard
              label={t('policies.draftArchived')}
              value={draft + archived}
              color="text-muted-foreground"
              bg="bg-muted"
              accent="border-border"
            />
          </div>
          <div className="bg-card rounded-xl border border-border px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">
                {t('policies.publicationRate')}
              </span>
              <span className="text-sm font-semibold text-blue-700">
                {Math.round((published / policies.length) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${Math.round((published / policies.length) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex flex-col gap-4 px-3 sm:px-6 py-4">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchPolicies} />
          ) : policies.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClear={clearFilters}
              onCreate={() => setShowCreate(true)}
            />
          ) : (
            <>
              <PoliciesTable
                policies={policies}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onUpload={setUploadPolicy}
                onSelect={setSelectedPolicy}
              />
              <div className="flex items-center justify-between px-4 py-2 bg-card rounded-xl border border-border shadow-sm">
                <span className="text-sm text-muted-foreground">
                  Showing{' '}
                  <span className="font-medium text-foreground">
                    {policies.length}
                  </span>{' '}
                  polic{policies.length !== 1 ? 'ies' : 'y'}
                  {hasActiveFilters && ' (filtered)'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
