import { createContext, useContext, useState, Suspense, useEffect } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "@/app/components/Sidebar";
import { Header } from "@/app/components/Header";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { useTranslation } from "react-i18next";
import { authService } from "@/services/api/auth";

function RouteErrorFallback() {
  const { t } = useTranslation('common');
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900">{t('errors.somethingWentWrong')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('errors.pageLoadError')}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          {t('errors.tryAgain')}
        </button>
        <a
          href="/"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          {t('errors.goToDashboard')}
        </a>
      </div>
    </div>
  );
}

// Shared context so Header can toggle the sidebar
interface SidebarContextValue {
  open: boolean;
  collapsed: boolean;
  toggle: () => void;
  close: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  collapsed: false,
  toggle: () => {},
  close: () => {},
  setCollapsed: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function Layout() {
  const { i18n, t } = useTranslation('common');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync i18next locale with the user's backend preference on mount
  useEffect(() => {
    const cached = authService.getCachedUser();
    const locale = cached?.preferredLocale ?? 'en';
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [i18n]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("manzen.sidebar.collapsed") === "1";
    } catch {
      return false;
    }
  });

  const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

  const ctx: SidebarContextValue = {
    open: sidebarOpen,
    collapsed: sidebarCollapsed,
    toggle: () => {
      if (isDesktop()) {
        setSidebarCollapsed((v) => {
          const next = !v;
          localStorage.setItem("manzen.sidebar.collapsed", next ? "1" : "0");
          return next;
        });
        return;
      }
      setSidebarOpen((v) => !v);
    },
    close: () => setSidebarOpen(false),
    setCollapsed: (collapsed) => {
      setSidebarCollapsed(collapsed);
      localStorage.setItem("manzen.sidebar.collapsed", collapsed ? "1" : "0");
    },
  };

  return (
    <SidebarContext.Provider value={ctx}>
      <div className="flex h-screen bg-muted overflow-hidden">
        {/* Skip to content link — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:text-sm focus:font-medium"
        >
          {t('a11y.skipToContent')}
        </a>
        {/* Overlay (mobile only) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={ctx.close}
            aria-hidden="true"
          />
        )}

        {/* Sidebar — off-canvas on mobile, static on desktop */}
        <div
          className={[
            "fixed inset-y-0 left-0 z-30 flex-shrink-0 transition-transform duration-300 ease-in-out",
            "lg:relative lg:translate-x-0 lg:z-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          ].join(" ")}
        >
          <Sidebar collapsed={sidebarCollapsed} />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header />
          <main id="main-content" className="flex-1 overflow-y-auto">
            <ErrorBoundary fallback={<RouteErrorFallback />}>
              <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              }>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
