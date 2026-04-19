import React from 'react';
import { useTranslation } from 'react-i18next';
import { PolicyFilter, POLICY_STATUSES } from './types';
import { Search, X } from 'lucide-react';

export function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-primary hover:text-primary/80">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export function FilterPanel({
  filter, onChange, onClear, hasActiveFilters, mobileDrawer,
}: {
  filter: PolicyFilter;
  onChange: (field: keyof PolicyFilter, value: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  mobileDrawer?: boolean;
}) {
  const { t } = useTranslation('compliance');
  return (
    <div className={`bg-card border border-border shadow-sm overflow-hidden ${mobileDrawer ? 'rounded-b-xl lg:rounded-xl' : 'rounded-xl'}`}>
      <div className={`px-5 py-4 border-b border-border flex items-center justify-between ${mobileDrawer ? 'hidden lg:flex' : ''}`}>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{t('policiesPage.filter.title')}</h2>
        {hasActiveFilters && (
          <button onClick={onClear} className="text-xs font-medium text-primary hover:text-primary/80">{t('policiesPage.filter.clearAll')}</button>
        )}
      </div>
      <div className="px-5 py-4 space-y-5">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{t('policiesPage.filter.search')}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
            <input
              type="text"
              value={filter.search}
              onChange={e => onChange('search', e.target.value)}
              placeholder={t('policiesPage.filter.searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring placeholder-muted-foreground/70"
            />
            {filter.search && (
              <button onClick={() => onChange('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{t('policiesPage.filter.status')}</label>
          <select
            value={filter.status}
            onChange={e => onChange('status', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-card"
          >
            <option value="">{t('policiesPage.filter.allStatuses')}</option>
            {POLICY_STATUSES.map(s => (
              <option key={s} value={s}>{t(`policiesPage.statusLabels.${s}`, { defaultValue: s })}</option>
            ))}
          </select>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {filter.search && <FilterChip label={`"${filter.search}"`} onRemove={() => onChange('search', '')} />}
          {filter.status && <FilterChip label={filter.status} onRemove={() => onChange('status', '')} />}
        </div>
      )}
    </div>
  );
}
