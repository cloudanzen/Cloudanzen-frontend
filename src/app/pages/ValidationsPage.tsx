import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, X, CheckCircle, AlertTriangle, Clock, UserRound } from 'lucide-react';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { ListPaginationBar } from '@/app/components/pagination/ListPaginationBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { testsService } from '@/services/api/tests';
import { controlsService } from '@/services/api/controls';
import { usersService } from '@/services/api/users';
import { authService } from '@/services/api/auth';
import type { TestRecord, TestStatus, TestCategory, TestType, ListTestsParams } from '@/services/api/tests';
import type { Control } from '@/services/api/types';
import { clearAuthSession } from '@/services/authStorage';

import { STATUS_CONFIG, CATEGORY_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, CATEGORY_COLOR, DEFAULT_COLUMNS } from './validationsPage/config';
import type { ColumnConfig } from './validationsPage/config';
import { fmtDate } from '@/lib/format-date';
import { StatusBadge, SortIcon } from './validationsPage/StatusBadge';
import { ColumnPicker } from './validationsPage/ColumnPicker';
import { LoadingState, ErrorState, EmptyState } from './validationsPage/StateComponents';
import { ReassignValidationOwnerDialog } from './validationsPage/ReassignValidationOwnerDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

const EMPTY_SELECT = '__empty__';
const ADMIN_ROLES = ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'];

function SelectFilter({ value, placeholder, allLabel, options, onChange }: {
  value: string;
  placeholder: string;
  allLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      value={value || EMPTY_SELECT}
      onValueChange={(v) => onChange(v === EMPTY_SELECT ? '' : v)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_SELECT}>{allLabel}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface TestFilter {
  search: string;
  category: string;
  status: string;
  type: string;
  owner: string;
  integration: string;
  control: string;
  dueFrom: string;
  dueTo: string;
}

// ─── Main page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

export function ValidationsPage() {
  const { t } = useTranslation('tests');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = authService.getCachedUser();
  const canManageAllValidations = ADMIN_ROLES.includes(currentUser?.role ?? '');
  const { filters: urlFilters, update, reset } = useUrlFilterState({
    defaults: { search: '', category: '', status: '', type: '', owner: '', integration: '', control: '', dueFrom: '', dueTo: '', frameworks: [] as string[] },
    arrayKeys: ['frameworks'],
  });
  const filter: TestFilter = {
    search: urlFilters.search,
    category: urlFilters.category,
    status: urlFilters.status,
    type: urlFilters.type,
    owner: urlFilters.owner,
    integration: urlFilters.integration,
    control: urlFilters.control,
    dueFrom: urlFilters.dueFrom,
    dueTo: urlFilters.dueTo,
  };
  const frameworkFilter = urlFilters.frameworks;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sortColumn, setSortColumn] = useState('dueDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [statusFilterOverride, setStatusFilterOverride] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkOwnerId, setBulkOwnerId] = useState('');
  const [bulkControlId, setBulkControlId] = useState('');
  const [reassignTarget, setReassignTarget] = useState<TestRecord | null>(null);

  // Persist column preferences
  useEffect(() => {
    const saved = localStorage.getItem('tests-columns');
    if (saved) { try { setColumns(JSON.parse(saved)); } catch { toast.error('Failed to parse saved column preferences'); } }
  }, []);
  useEffect(() => { localStorage.setItem('tests-columns', JSON.stringify(columns)); }, [columns]);

  // Merge status filter override (from summary panel click)
  const effectiveFilter: TestFilter = statusFilterOverride
    ? { ...filter, status: statusFilterOverride }
    : filter;

  const filterKey: ListTestsParams = {
    search:   effectiveFilter.search   || undefined,
    category: (effectiveFilter.category as TestCategory) || undefined,
    status:   (effectiveFilter.status  as TestStatus)   || undefined,
    type:     (effectiveFilter.type    as TestType)     || undefined,
    ownerId:  effectiveFilter.owner    || undefined,
    integrationId: effectiveFilter.integration || undefined,
    controlId: effectiveFilter.control || undefined,
    dueFrom:  effectiveFilter.dueFrom  || undefined,
    dueTo:    effectiveFilter.dueTo    || undefined,
    frameworkSlugs: frameworkFilter.length > 0 ? frameworkFilter : undefined,
    page,
    limit: pageSize,
  };

  // ── Tests list query ──
  const { data: testsResponse, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: QK.tests(filterKey),
    queryFn: async () => {
      const res = await testsService.listTests(filterKey);
      if (res.success && res.data) return res;
      throw new Error('Failed to load tests');
    },
    staleTime: STALE.TESTS,
      retry: (count: number, err: unknown) => {
        if ((err as { statusCode?: number })?.statusCode === 401) { clearAuthSession(); navigate('/login'); return false; }
        return count < 1;
      },
  });

  // ── Summary query ──
  const { data: summary } = useQuery({
    queryKey: [...QK.testSummary(), frameworkFilter.join(',')],
    queryFn: async () => {
      const res = await testsService.getTestSummary({ frameworkSlugs: frameworkFilter });
      if (res.success && res.data) return res.data;
      return null;
    },
    staleTime: STALE.TESTS,
  });

  const { data: usersData = [] } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      const res = await usersService.listUsers();
      return res;
    },
    staleTime: STALE.USERS,
  });

  const { data: filterOptions } = useQuery({
    queryKey: ['tests', 'filter-options'],
    queryFn: async () => {
      const res = await testsService.getFilterOptions();
      if (res.success && res.data) return res.data;
      return { integrations: [], owners: [], controls: [] };
    },
    staleTime: STALE.TESTS,
  });

  const { data: controlsData = [] } = useQuery({
    queryKey: ['controls', 'bulk-picker'],
    queryFn: async () => {
      const res = await controlsService.getControls({ limit: 200 });
      return (res.data ?? []) as Control[];
    },
    staleTime: STALE.CONTROLS,
  });



  const bulkCompleteMutation = useMutation({
    mutationFn: (testIds: string[]) => testsService.bulkComplete({ testIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      setSelectedIds([]);
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (payload: { testIds: string[]; ownerId: string }) => testsService.bulkAssign(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      setSelectedIds([]);
      setBulkOwnerId('');
    },
  });

  const reassignMutation = useMutation({
    mutationFn: (payload: { testId: string; ownerId: string }) =>
      testsService.updateTest(payload.testId, { ownerId: payload.ownerId }),
    onSuccess: (_res, payload) => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      qc.invalidateQueries({ queryKey: QK.testDetail(payload.testId) });
      toast.success(t('validationsPage.reassignDialog.success'));
      setReassignTarget(null);
    },
    onError: () => {
      toast.error(t('validationsPage.reassignDialog.error'));
    },
  });

  const bulkLinkControlMutation = useMutation({
    mutationFn: (payload: { testIds: string[]; controlId: string }) => testsService.bulkLinkControl(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      setSelectedIds([]);
      setBulkControlId('');
    },
  });

  const testsRaw = useMemo(() => (testsResponse?.data ?? []) as TestRecord[], [testsResponse?.data]);

  // Client-side sort — cast through unknown to allow dynamic key access
  const sorted = [...testsRaw].sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[sortColumn];
    const bVal = (b as unknown as Record<string, unknown>)[sortColumn];
    if (aVal == null || bVal == null) return 0;
    const cmp = typeof aVal === 'string' && typeof bVal === 'string'
      ? aVal.localeCompare(bVal)
      : typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : 0;
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const handleSort = (col: string) => {
    if (sortColumn === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDir('asc'); }
  };

  const hasActiveFilters = !!(filter.search || filter.category || filter.status || filter.type || filter.owner || filter.integration || filter.control || filter.dueFrom || filter.dueTo || statusFilterOverride || frameworkFilter.length > 0);

  const clearFilters = () => {
    reset();
    setStatusFilterOverride('');
    setPage(1);
  };

  // Build option lists from stable filter metadata, not the current result page.
  const ownerOptions = useMemo(() => {
    return (filterOptions?.owners ?? []).map((owner) => ({
      value: owner.id,
      label: owner.name || owner.email,
    }));
  }, [filterOptions?.owners]);

  const integrationOptions = useMemo(() => {
    return (filterOptions?.integrations ?? []).map((integration) => ({
      value: integration.id,
      label: integration.provider,
    }));
  }, [filterOptions?.integrations]);

  const controlOptions = useMemo(() => {
    return (filterOptions?.controls ?? []).map((control) => ({
      value: control.id,
      label: `${control.isoReference} - ${control.title}`,
    }));
  }, [filterOptions?.controls]);

  const activeFilters = [
    ...(filter.search.trim() ? [{ key: 'search', label: `Search: ${filter.search.trim()}`, onRemove: () => update({ search: '' }) }] : []),
    ...(filter.category ? [{ key: 'category', label: `Category: ${filter.category}`, onRemove: () => update({ category: '' }) }] : []),
    ...(effectiveFilter.status ? [{ key: 'status', label: `Status: ${STATUS_CONFIG[effectiveFilter.status as TestStatus]?.label ?? effectiveFilter.status}`, onRemove: () => { update({ status: '' }); setStatusFilterOverride(''); } }] : []),
    ...(filter.type ? [{ key: 'type', label: `Type: ${filter.type}`, onRemove: () => update({ type: '' }) }] : []),
    ...(filter.owner ? [{ key: 'owner', label: `Owner: ${ownerOptions.find((o) => o.value === filter.owner)?.label ?? filter.owner}`, onRemove: () => update({ owner: '' }) }] : []),
    ...(filter.integration ? [{ key: 'integration', label: `Integration: ${integrationOptions.find((i) => i.value === filter.integration)?.label ?? filter.integration}`, onRemove: () => update({ integration: '' }) }] : []),
    ...(filter.control ? [{ key: 'control', label: `Control: ${controlOptions.find((c) => c.value === filter.control)?.label ?? filter.control}`, onRemove: () => update({ control: '' }) }] : []),
    ...(filter.dueFrom ? [{ key: 'dueFrom', label: `Due from: ${filter.dueFrom}`, onRemove: () => update({ dueFrom: '' }) }] : []),
    ...(filter.dueTo ? [{ key: 'dueTo', label: `Due to: ${filter.dueTo}`, onRemove: () => update({ dueTo: '' }) }] : []),
    ...frameworkFilter.map((slug) => ({
      key: `framework-${slug}`,
      label: `Framework: ${slug.replace(/-/g, ' ')}`,
      onRemove: () => update({ frameworks: frameworkFilter.filter((item) => item !== slug) }),
    })),
  ];

  const visibleIds = sorted.map((test) => test.id);
  const selectedCount = selectedIds.length;
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleSelection = (testId: string) => {
    setSelectedIds((current) => current.includes(testId) ? current.filter((id) => id !== testId) : [...current, testId]);
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleIds.includes(id));
      return Array.from(new Set([...current, ...visibleIds]));
    });
  };

  const canReassignValidation = (test: TestRecord) =>
    canManageAllValidations || currentUser?.id === test.ownerId;

  const renderCell = (test: TestRecord, col: ColumnConfig) => {
    switch (col.id) {
      case 'name':
        return <span className="font-medium text-foreground text-sm leading-snug">{test.name}</span>;
      case 'category':
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLOR[test.category]}`}>
            {test.category}
          </span>
        );
      case 'type':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
            {test.type}
          </span>
        );
      case 'owner':
        return (
          <span className="text-sm text-muted-foreground">
            {test.owner?.name ?? test.ownerId}
          </span>
        );
      case 'status':
        return <StatusBadge status={test.status} />;
      case 'dueDate':
        return <span className="text-sm text-muted-foreground whitespace-nowrap">{fmtDate(test.dueDate)}</span>;
      case 'actions':
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/validations/${test.id}`)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {t('validationsPage.actions.view')}
            </button>
            {canReassignValidation(test) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setReassignTarget(test);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <UserRound className="h-3.5 w-3.5" />
                {t('validationsPage.actions.reassign')}
              </button>
            )}
            {test.status !== 'OK' && (
              test.type === 'Document' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/validations/${test.id}`);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {t('validationsPage.actions.upload')}
                </button>
              ) : (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    await testsService.completeTest(test.id);
                    qc.invalidateQueries({ queryKey: ['tests'] });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                >
                  {t('validationsPage.actions.complete')}
                </button>
              )
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="flex flex-col bg-muted">
      {/* ── App Bar ── */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{t('validationsPage.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t('validationsPage.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {t('validationsPage.filtersActive')}
            </span>
          )}
          <button
            onClick={() => { qc.invalidateQueries({ queryKey: ['tests'] }); refetch(); }}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('actions.refresh')}</span>
          </button>
          <ColumnPicker columns={columns} onToggle={(id) => setColumns(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c))} />
        </div>
      </div>

      <div className="px-6 pt-3 pb-1">
        <PageFilterBar
          searchValue={filter.search}
          onSearchChange={(value) => { update({ search: value }); setPage(1); }}
          searchPlaceholder={t('validationsPage.searchPlaceholder')}
          selects={[
            {
              key: 'category',
              value: filter.category,
              placeholder: t('validationsPage.filters.category'),
              onChange: (value) => { update({ category: value }); setPage(1); },
              options: [{ value: '', label: t('validationsPage.filters.allCategories') }, ...CATEGORY_OPTIONS.map((item) => ({ value: item, label: item }))],
            },
            {
              key: 'status',
              value: effectiveFilter.status,
              placeholder: t('validationsPage.filters.status'),
              onChange: (value) => { setStatusFilterOverride(''); update({ status: value }); setPage(1); },
              options: [{ value: '', label: t('validationsPage.filters.allStatuses') }, ...STATUS_OPTIONS.map((item) => ({ value: item, label: STATUS_CONFIG[item].label }))],
            },
            {
              key: 'type',
              value: filter.type,
              placeholder: t('validationsPage.filters.type'),
              onChange: (value) => { update({ type: value }); setPage(1); },
              options: [{ value: '', label: t('validationsPage.filters.allTypes') }, ...TYPE_OPTIONS.map((item) => ({ value: item, label: item }))],
            },
          ]}
          auxiliary={(
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <FrameworkFilter selected={frameworkFilter} onChange={(value) => { update({ frameworks: value }); setPage(1); }} />
              <SelectFilter
                value={filter.owner}
                placeholder={t('validationsPage.filters.owner')}
                allLabel={t('validationsPage.filters.allOwners')}
                options={ownerOptions}
                onChange={(value) => { update({ owner: value }); setPage(1); }}
              />
              <SelectFilter
                value={filter.integration}
                placeholder={t('validationsPage.filters.integration')}
                allLabel={t('validationsPage.filters.allIntegrations')}
                options={integrationOptions}
                onChange={(value) => { update({ integration: value }); setPage(1); }}
              />
              <SelectFilter
                value={filter.control}
                placeholder={t('validationsPage.filters.control')}
                allLabel={t('validationsPage.filters.allControls')}
                options={controlOptions}
                onChange={(value) => { update({ control: value }); setPage(1); }}
              />
            </div>
          )}
          resultCount={sorted.length}
          resultLabel={hasActiveFilters ? t('validationsPage.filteredTests') : t('validationsPage.tests')}
          activeFilters={activeFilters}
          onClearAll={clearFilters}
        />
      </div>

      {/* ── Summary panels ── */}
      {summary && !isLoading && (
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">

            {/* Pass % */}
            <div className="bg-card rounded-xl border border-border shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">{t('validationsPage.passRate')}</p>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-4xl font-bold text-foreground">{summary.passPercentage}%</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('validationsPage.completedOfTotal', { completed: summary.completed, total: summary.total })}</p>
                </div>
                <div className="flex-1 mb-2">
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all duration-500"
                      style={{ width: `${summary.passPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Needs attention */}
            <div className="bg-card rounded-xl border border-border shadow-sm px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-3">{t('validationsPage.needsAttention')}</p>
              <div className="flex gap-4">
                <button
                  onClick={() => { setStatusFilterOverride('Overdue'); setPage(1); }}
                  className={[
                    'flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-colors',
                    statusFilterOverride === 'Overdue'
                      ? 'border-red-400 bg-red-50'
                      : 'border-transparent bg-red-50 hover:border-red-300',
                  ].join(' ')}
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
                  <span className="text-2xl font-bold text-red-700">{summary.overdue}</span>
                  <span className="text-xs text-red-500 mt-0.5">{t('validationsPage.overdue')}</span>
                </button>
                <button
                  onClick={() => { setStatusFilterOverride('Due_soon'); setPage(1); }}
                  className={[
                    'flex-1 flex flex-col items-center p-3 rounded-xl border-2 transition-colors',
                    statusFilterOverride === 'Due_soon'
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-transparent bg-amber-50 hover:border-amber-300',
                  ].join(' ')}
                >
                  <Clock className="w-5 h-5 text-amber-500 mb-1" />
                  <span className="text-2xl font-bold text-amber-700">{summary.dueSoon}</span>
                  <span className="text-xs text-amber-500 mt-0.5">{t('validationsPage.dueSoon')}</span>
                </button>
                <div className="flex-1 flex flex-col items-center p-3 rounded-xl bg-green-50">
                  <CheckCircle className="w-5 h-5 text-green-500 mb-1" />
                  <span className="text-2xl font-bold text-green-700">{summary.total - summary.overdue - summary.dueSoon}</span>
                  <span className="text-xs text-green-500 mt-0.5">{t('validationsPage.onTrack')}</span>
                </div>
              </div>
              {statusFilterOverride && (
                <button
                  onClick={() => setStatusFilterOverride('')}
                  className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> {t('validationsPage.clearStatusFilter')}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-3 sm:px-6 py-4">

        {/* Table */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {selectedCount > 0 && (
            <div className="bg-slate-900 text-white rounded-xl shadow-sm px-4 py-3 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{t('validationsPage.bulk.selected', { count: selectedCount })}</span>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-slate-300 hover:text-white transition-colors"
                >
                  {t('validationsPage.bulk.clear')}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 lg:ml-auto">
                <button
                  onClick={() => bulkCompleteMutation.mutate(selectedIds)}
                  disabled={bulkCompleteMutation.isPending}
                  className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-sm font-medium disabled:opacity-50"
                >
                  {bulkCompleteMutation.isPending ? t('validationsPage.bulk.completing') : t('validationsPage.bulk.batchComplete')}
                </button>
                <div className="flex gap-2">
                  <select
                    value={bulkOwnerId}
                    onChange={(e) => setBulkOwnerId(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm min-w-44"
                  >
                    <option value="">{t('validationsPage.bulk.assignOwner')}</option>
                    {usersData.map((user) => (
                      <option key={user.id} value={user.id}>{user.name ?? user.email}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => bulkOwnerId && bulkAssignMutation.mutate({ testIds: selectedIds, ownerId: bulkOwnerId })}
                    disabled={!bulkOwnerId || bulkAssignMutation.isPending}
                    className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-sm font-medium disabled:opacity-50"
                  >
                    {t('validationsPage.bulk.assign')}
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={bulkControlId}
                    onChange={(e) => setBulkControlId(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm min-w-52"
                  >
                    <option value="">{t('validationsPage.bulk.linkControlPlaceholder')}</option>
                    {controlsData.map((control) => (
                      <option key={control.id} value={control.id}>{control.isoReference} - {control.title}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => bulkControlId && bulkLinkControlMutation.mutate({ testIds: selectedIds, controlId: bulkControlId })}
                    disabled={!bulkControlId || bulkLinkControlMutation.isPending}
                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-sm font-medium text-slate-950 disabled:opacity-50"
                  >
                    {t('validationsPage.bulk.linkControl')}
                  </button>
                </div>
              </div>
            </div>
          )}
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState onRetry={() => qc.invalidateQueries({ queryKey: ['tests'] })} />
          ) : sorted.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
          ) : (
            <>
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            className="w-4 h-4 rounded border-border text-blue-600"
                            aria-label="Select all visible tests"
                          />
                        </th>
                        {visibleColumns.map(col => (
                          <th
                            key={col.id}
                            style={{ minWidth: col.minWidth }}
                            onClick={() => col.sortable && handleSort(col.id)}
                            className={[
                              'px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none',
                              col.sortable ? 'cursor-pointer hover:bg-accent transition-colors' : '',
                            ].join(' ')}
                          >
                            <span className="flex items-center gap-1.5">
                              {col.label}
                              {col.sortable && <SortIcon active={sortColumn === col.id} direction={sortDir} />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sorted.map(test => (
                        <tr
                          key={test.id}
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                          onClick={() => navigate(`/validations/${test.id}`)}
                        >
                          <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(test.id)}
                              onChange={() => toggleSelection(test.id)}
                              className="w-4 h-4 rounded border-border text-blue-600"
                              aria-label={`Select ${test.name}`}
                            />
                          </td>
                          {visibleColumns.map(col => (
                            <td
                              key={col.id}
                              style={{ minWidth: col.minWidth }}
                              className="px-4 py-3 align-middle"
                              onClick={col.id === 'actions' ? (e) => e.stopPropagation() : undefined}
                            >
                              {renderCell(test, col)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border px-4 py-2 shadow-sm">
                <ListPaginationBar
                  page={testsResponse?.page ?? page}
                  pageSize={pageSize}
                  total={testsResponse?.total ?? sorted.length}
                  itemLabel="test"
                  onPageChange={setPage}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <ReassignValidationOwnerDialog
        open={!!reassignTarget}
        validationName={reassignTarget?.name}
        currentOwnerId={reassignTarget?.ownerId}
        users={usersData}
        saving={reassignMutation.isPending}
        onClose={() => setReassignTarget(null)}
        onSubmit={(ownerId) => {
          if (!reassignTarget) return;
          reassignMutation.mutate({ testId: reassignTarget.id, ownerId });
        }}
      />

    </div>
  );
}
