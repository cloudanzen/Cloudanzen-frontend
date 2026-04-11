import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, AlertCircle, Plus } from 'lucide-react';

export function SummaryCard({ label, value, color, bg, accent = 'border-gray-200' }: {
  label: string; value: number; color: string; bg: string; accent?: string;
}) {
  return (
    <div className={`rounded-xl border ${accent} ${bg} px-4 py-3 shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export function LoadingState() {
  const { t } = useTranslation('compliance');
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500">{t('policiesPage.states.loadingPolicies')}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useTranslation('compliance');
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">{t('policiesPage.states.failedToLoad')}</p>
      <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
      >
        {t('policiesPage.states.tryAgain')}
      </button>
    </div>
  );
}

export function EmptyState({ hasFilters, onClear, onCreate }: { hasFilters: boolean; onClear: () => void; onCreate: () => void }) {
  const { t } = useTranslation('compliance');
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-base font-medium text-gray-900 mb-1">{t('policiesPage.states.noPoliciesFound')}</p>
      <p className="text-sm text-gray-500 mb-4">
        {hasFilters ? t('policiesPage.states.noMatchFilters') : t('policiesPage.states.noPoliciesCreated')}
      </p>
      {hasFilters ? (
        <button onClick={onClear} className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">
          {t('policiesPage.states.clearFilters')}
        </button>
      ) : (
        <button onClick={onCreate} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
          <Plus className="w-4 h-4" />
          {t('policiesPage.states.createFirst')}
        </button>
      )}
    </div>
  );
}
