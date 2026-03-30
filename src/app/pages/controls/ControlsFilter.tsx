import React from 'react';
import { ControlFilter, ControlStatus } from './types';

interface ControlsFilterProps {
  filter: ControlFilter;
  onFilterChange: (filter: ControlFilter) => void;
  onClearFilters: () => void;
  /** When true, removes top rounded corners (mobile drawer handle provides them) */
  mobileDrawer?: boolean;
}

export function ControlsFilter({ filter, onFilterChange, onClearFilters, mobileDrawer }: ControlsFilterProps) {
  const handleChange = (field: keyof ControlFilter, value: string) => {
    onFilterChange({ ...filter, [field]: value });
  };

  const hasActiveFilters = !!(filter.search || filter.status || filter.isoReference);

  return (
    <div className={`bg-white border border-gray-200 shadow-sm overflow-hidden ${mobileDrawer ? 'rounded-b-xl lg:rounded-xl' : 'rounded-xl'}`}>
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter fields — always visible (Material standard) */}
      <div className="px-5 py-4 space-y-5">
        {/* Search */}
        <div>
          <label
            htmlFor="ctrl-search"
            className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide"
          >
            Search
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
            <input
              id="ctrl-search"
              type="text"
              value={filter.search}
              onChange={(e) => handleChange('search', e.target.value)}
              placeholder="Search title or description…"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
            />
            {filter.search && (
              <button
                onClick={() => handleChange('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="ctrl-status"
            className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide"
          >
            Status
          </label>
          <select
            id="ctrl-status"
            value={filter.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
          >
            <option value="">All statuses</option>
            <option value={ControlStatus.IMPLEMENTED}>Implemented</option>
            <option value={ControlStatus.PARTIALLY_IMPLEMENTED}>Partially Implemented</option>
            <option value={ControlStatus.NOT_IMPLEMENTED}>Not Implemented</option>
          </select>
        </div>

        {/* Reference */}
        <div>
          <label
            htmlFor="ctrl-iso"
            className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide"
          >
            Reference
          </label>
          <input
            id="ctrl-iso"
            type="text"
            value={filter.isoReference}
            onChange={(e) => handleChange('isoReference', e.target.value)}
            placeholder="e.g. A.5.1"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-colors"
          />
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {filter.search && (
            <Chip label={`"${filter.search}"`} onRemove={() => handleChange('search', '')} />
          )}
          {filter.status && (
            <Chip
              label={filter.status.replace(/_/g, ' ').toLowerCase()}
              onRemove={() => handleChange('status', '')}
            />
          )}
          {filter.isoReference && (
            <Chip label={filter.isoReference} onRemove={() => handleChange('isoReference', '')} />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 capitalize">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 text-blue-500 hover:text-blue-700 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
