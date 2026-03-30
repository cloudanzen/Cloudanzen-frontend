/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { clearAuthSession } from '@/services/authStorage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { controlsService } from '@/services/api/controls';
import { Control, ControlFilter, ColumnConfig, DEFAULT_COLUMNS } from './types';
import { ControlsTable } from './ControlsTable';
import { ColumnSelector } from './ColumnSelector';
import { ControlDetailPanel } from './ControlDetailPanel';
import { FrameworkFilter } from '@/app/components/compliance/FrameworkFilter';
import { PageFilterBar } from '@/app/components/filters/PageFilterBar';
import { useUrlFilterState } from '@/app/hooks/useUrlFilterState';
import { RefreshCw } from 'lucide-react';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

export function ControlsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { filters, update, reset } = useUrlFilterState({
    defaults: {
      search: '',
      status: '',
      isoReference: '',
      frameworks: [] as string[],
    },
    arrayKeys: ['frameworks'],
  });
  const filter: ControlFilter = {
    search: filters.search,
    status: filters.status as ControlFilter['status'],
    isoReference: filters.isoReference,
  };
  const frameworkFilter = filters.frameworks;
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [sortColumn, setSortColumn] = useState<string>('isoReference');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);

  // Load / persist column preferences in localStorage (unchanged)
  useEffect(() => {
    const saved = localStorage.getItem('controls-columns');
    if (saved) {
      try {
        setColumns(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('controls-columns', JSON.stringify(columns));
  }, [columns]);

  const filterKey = {
    search: filter.search,
    status: filter.status,
    isoReference: filter.isoReference,
    frameworkSlugs: frameworkFilter,
  };

  const {
    data: rawControls,
    isLoading: loading,
    isError,
    error: queryError,
    isFetching,
  } = useQuery({
    queryKey: QK.controls(filterKey),
    queryFn: async () => {
      const response = await controlsService.getControls({
        search: filter.search || undefined,
        status: filter.status || undefined,
        isoReference: filter.isoReference || undefined,
        frameworkSlugs:
          frameworkFilter.length > 0 ? frameworkFilter : undefined,
      });
      if (response.success && response.data) return response.data as Control[];
      throw new Error('Failed to load controls from the server.');
    },
    staleTime: STALE.CONTROLS,
    retry: (count, err: any) => {
      if (err?.statusCode === 401) {
        clearAuthSession();
        navigate('/login');
        return false;
      }
      return count < 1;
    },
  });

  // Client-side sort applied to cached data
  const controls: Control[] = rawControls
    ? [...rawControls].sort((a, b) => {
        const aVal = a[sortColumn as keyof Control];
        const bVal = b[sortColumn as keyof Control];
        if (aVal === undefined || bVal === undefined) return 0;
        const cmp =
          typeof aVal === 'string' && typeof bVal === 'string'
            ? aVal.localeCompare(bVal)
            : typeof aVal === 'number' && typeof bVal === 'number'
              ? aVal - bVal
              : String(aVal).localeCompare(String(bVal));
        return sortDirection === 'desc' ? -cmp : cmp;
      })
    : [];

  const error: string | null = isError
    ? ((queryError as any)?.message ?? 'An unexpected error occurred.')
    : null;

  const filteredControls: Control[] = controls;

  const fetchControls = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['controls'] });
  }, [qc]);

  const handleClearFilters = () => {
    reset();
  };

  const handleColumnToggle = (columnId: string) =>
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col,
      ),
    );

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters = !!(
    filter.search ||
    filter.status ||
    filter.isoReference ||
    frameworkFilter.length > 0
  );
  const activeFilters = [
    ...(filter.search.trim()
      ? [
          {
            key: 'search',
            label: `Search: ${filter.search.trim()}`,
            onRemove: () => update({ search: '' }),
          },
        ]
      : []),
    ...(filter.status
      ? [
          {
            key: 'status',
            label: `Status: ${filter.status.replace(/_/g, ' ').toLowerCase()}`,
            onRemove: () => update({ status: '' }),
          },
        ]
      : []),
    ...(filter.isoReference.trim()
      ? [
          {
            key: 'isoReference',
            label: `Ref: ${filter.isoReference.trim()}`,
            onRemove: () => update({ isoReference: '' }),
          },
        ]
      : []),
    ...frameworkFilter.map((slug) => ({
      key: `framework-${slug}`,
      label: `Framework: ${slug.replace(/-/g, ' ')}`,
      onRemove: () =>
        update({ frameworks: frameworkFilter.filter((item) => item !== slug) }),
    })),
  ];

  // Compliance summary counts
  const implemented = filteredControls.filter(
    (c) => c.status === 'IMPLEMENTED',
  ).length;
  const partial = filteredControls.filter(
    (c) => c.status === 'PARTIALLY_IMPLEMENTED',
  ).length;
  const notImpl = filteredControls.filter(
    (c) => c.status === 'NOT_IMPLEMENTED',
  ).length;
  const compliancePct = filteredControls.length
    ? Math.round((implemented / filteredControls.length) * 100)
    : 0;

  return (
    <div className="flex flex-col bg-muted">
      {selectedControl && (
        <ControlDetailPanel
          control={selectedControl}
          onClose={() => setSelectedControl(null)}
        />
      )}
      {/* ── Top App Bar (Material-style) ── */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Controls
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Filters active
            </span>
          )}
          <button
            onClick={fetchControls}
            disabled={isFetching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm disabled:opacity-50"
            title="Refresh controls"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <ColumnSelector
            columns={columns}
            onColumnToggle={handleColumnToggle}
          />
        </div>
      </div>

      <div className="px-6 pt-3 pb-1">
        <PageFilterBar
          searchValue={filter.search}
          onSearchChange={(value) => update({ search: value })}
          searchPlaceholder="Search title or description"
          selects={[
            {
              key: 'isoReference',
              value: filter.isoReference,
              placeholder: 'Reference',
              onChange: (value) => update({ isoReference: value }),
              options: [{ value: '', label: 'All references' }],
            },
            {
              key: 'status',
              value: filter.status,
              placeholder: 'Status',
              onChange: (value) => update({ status: value }),
              options: [
                { value: '', label: 'All statuses' },
                { value: 'IMPLEMENTED', label: 'Implemented' },
                {
                  value: 'PARTIALLY_IMPLEMENTED',
                  label: 'Partially Implemented',
                },
                { value: 'NOT_IMPLEMENTED', label: 'Not Implemented' },
              ],
            },
          ]}
          inlineExtras={
            <FrameworkFilter
              selected={frameworkFilter}
              onChange={(value) => update({ frameworks: value })}
              className="w-full"
            />
          }
          resultCount={filteredControls.length}
          resultLabel="controls"
          activeFilters={activeFilters}
          onClearAll={handleClearFilters}
        />
      </div>

      {/* ── Compliance Summary Cards (Material-style) ── */}
      {!loading && !error && filteredControls.length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="Total Controls"
              value={filteredControls.length}
              color="text-foreground"
              bg="bg-card"
            />
            <SummaryCard
              label="Implemented"
              value={implemented}
              color="text-green-700"
              bg="bg-green-50"
              accent="border-green-200"
            />
            <SummaryCard
              label="Partial"
              value={partial}
              color="text-amber-700"
              bg="bg-amber-50"
              accent="border-amber-200"
            />
            <SummaryCard
              label="Not Implemented"
              value={notImpl}
              color="text-red-700"
              bg="bg-red-50"
              accent="border-red-200"
            />
          </div>

          {/* Compliance progress bar */}
          <div className="mt-3 bg-card rounded-xl border border-border px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">
                Compliance score
              </span>
              <span className="text-sm font-semibold text-blue-700">
                {compliancePct}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${compliancePct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content: Filters + Table ── */}
      <div className="flex flex-col lg:flex-row gap-4 px-3 sm:px-6 py-4">
        {/* Table area */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchControls} />
          ) : filteredControls.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClear={handleClearFilters}
            />
          ) : (
            <>
              <ControlsTable
                controls={filteredControls}
                columns={columns}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSelect={setSelectedControl}
              />
              <div className="flex items-center justify-between px-4 py-2 bg-card rounded-xl border border-border shadow-sm">
                <span className="text-sm text-muted-foreground">
                  Showing{' '}
                  <span className="font-medium text-foreground">
                    {filteredControls.length}
                  </span>{' '}
                  control{filteredControls.length !== 1 ? 's' : ''}
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

// ── Helper sub-components ──────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
  bg,
  accent = 'border-border',
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
  accent?: string;
}) {
  return (
    <div className={`rounded-xl border ${accent} ${bg} px-4 py-3 shadow-sm`}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">Loading controls...</p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-foreground mb-1">
        Failed to load controls
      </p>
      <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-sm"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-muted-foreground/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-base font-medium text-foreground mb-1">
        No controls found
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        {hasFilters
          ? 'No controls match your current filters.'
          : 'No controls have been created yet.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="px-5 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
