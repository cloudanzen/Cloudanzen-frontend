import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export function LoadingState() {
  const { t } = useTranslation('tests');
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-muted-foreground">{t('testsPage.loading')}</p>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('tests');
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-red-200 shadow-sm">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">{t('testsPage.loadFailed')}</p>
      <button onClick={onRetry} className="mt-3 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm">
        {t('testsPage.tryAgain')}
      </button>
    </div>
  );
}

export function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  const { t } = useTranslation('tests');
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-border shadow-sm">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <CheckCircle className="w-6 h-6 text-muted-foreground/70" />
      </div>
      <p className="text-base font-medium text-foreground mb-1">{t('testsPage.noTestsFound')}</p>
      <p className="text-sm text-muted-foreground mb-4">
        {hasFilters ? t('testsPage.noTestsMatchFilters') : t('testsPage.activateFramework')}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted">
          {t('testsPage.clearFilters')}
        </button>
      )}
    </div>
  );
}
