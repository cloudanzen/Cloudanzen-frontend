import { Link, useRouteError, isRouteErrorResponse } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
          <ShieldAlert className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-7xl font-bold text-foreground tracking-tight">404</h1>
        <h2 className="text-xl font-semibold text-foreground mt-2">{t('notFound.title')}</h2>
        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
          {t('notFound.description')}
        </p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('notFound.goBack')}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('notFound.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Route error boundary — handles both 404s and unexpected route errors. */
export function RouteErrorBoundary() {
  const { t } = useTranslation('common');
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  // For non-404 route errors, show a generic error with reload
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-destructive/10 mb-6">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>

        <h1 className="text-4xl font-bold text-foreground tracking-tight">{t('notFound.errorTitle')}</h1>
        <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
          {t('notFound.errorDescription')}
        </p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-accent transition-colors"
          >
            {t('notFound.refreshPage')}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('notFound.dashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
