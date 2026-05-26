import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { Suspense, useEffect, useState } from 'react';
import { usePlatformAdmin } from '@/app/hooks/usePlatformAdmin';
import { platformAuthService } from '@/services/api/platformAuth';
import { authService } from '@/services/api/auth';
import { Button } from '@/app/components/ui/button';
import { cn } from '@/app/components/ui/utils';
import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  GitPullRequest,
  Headphones,
  Home,
  Layers3,
  LogOut,
  Menu,
  ScrollText,
  Settings2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Hostname-rooted at platform.cloudanzen.com. Deliberately NO customer-org
// chrome (no org switcher, no settings, no notifications) — platform admins
// are not members of any customer org.
//
type PlatformNavItem = {
  to: string;
  label: string;
  section: 'Workspace' | 'Catalog' | 'System';
  icon: LucideIcon;
};

const SIDEBAR_STORAGE_KEY = 'cloudanzen.platform.sidebar.collapsed';

const NAV: PlatformNavItem[] = [
  { to: '/', label: 'Dashboard', section: 'Workspace', icon: Home },
  {
    to: '/organizations',
    label: 'Organizations',
    section: 'Workspace',
    icon: Building2,
  },
  {
    to: '/support-sessions',
    label: 'Support Sessions',
    section: 'Workspace',
    icon: Headphones,
  },
  {
    to: '/templates/control',
    label: 'Control Templates',
    section: 'Catalog',
    icon: ClipboardCheck,
  },
  {
    to: '/templates/test',
    label: 'Test Templates',
    section: 'Catalog',
    icon: FileCheck2,
  },
  {
    to: '/templates/policy',
    label: 'Policy Templates',
    section: 'Catalog',
    icon: FileText,
  },
  { to: '/frameworks', label: 'Frameworks', section: 'Catalog', icon: Layers3 },
  {
    to: '/framework-requests',
    label: 'Framework Requests',
    section: 'Catalog',
    icon: GitPullRequest,
  },
  {
    to: '/catalog/batches',
    label: 'Catalog Batches',
    section: 'Catalog',
    icon: ScrollText,
  },
  {
    to: '/catalog/versions',
    label: 'Catalog Versions',
    section: 'Catalog',
    icon: Activity,
  },
  {
    to: '/allowlist',
    label: 'Admin Allowlist',
    section: 'System',
    icon: Settings2,
  },
  { to: '/activity', label: 'Activity Log', section: 'System', icon: Activity },
];

function CloudAnzenMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm',
        compact ? 'h-9 w-9 text-sm' : 'h-10 w-10 text-base',
      )}
      aria-hidden="true"
    >
      <span className="font-bold tracking-normal">CA</span>
    </div>
  );
}

export function PlatformShell() {
  const { data: admin } = usePlatformAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await platformAuthService.logout();
    // Wipe the cached SUPER_ADMIN entry that platform login wrote into
    // authStorage so useCurrentUser() returns null after logout.
    authService.clearCachedUser();
    navigate('/login', { replace: true });
  };

  const currentTitle =
    NAV.find((item) =>
      item.to === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(item.to),
    )?.label ?? 'Platform Console';

  let lastSection: PlatformNavItem['section'] | null = null;

  return (
    <div className="flex h-screen overflow-hidden bg-muted">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close platform navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-slate-950 text-slate-100 shadow-2xl transition-all duration-300 lg:relative lg:translate-x-0 lg:shadow-none',
          collapsed ? 'lg:w-20' : 'lg:w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-slate-800 px-4',
            collapsed ? 'lg:justify-center' : 'justify-between',
          )}
        >
          <Link
            to="/"
            className={cn(
              'flex min-w-0 items-center gap-3',
              collapsed && 'lg:justify-center',
            )}
            aria-label="CloudAnzen Platform Dashboard"
          >
            <CloudAnzenMark compact={collapsed} />
            <div className={cn('min-w-0', collapsed && 'lg:hidden')}>
              <div className="truncate text-sm font-semibold text-white">
                CloudAnzen
              </div>
              <div className="truncate text-xs text-slate-400">
                Platform Console
              </div>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-md p-2 text-slate-400 hover:bg-slate-900 hover:text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close platform navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            const showSection = item.section !== lastSection;
            lastSection = item.section;
            const Icon = item.icon;

            return (
              <div key={item.to}>
                {showSection && (
                  <div
                    className={cn(
                      'px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500 first:pt-0',
                      collapsed && 'lg:hidden',
                    )}
                  >
                    {item.section}
                  </div>
                )}
                {showSection && collapsed && (
                  <div className="my-3 hidden border-t border-slate-800 first:mt-0 lg:block" />
                )}
                <Link
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group mb-1 flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                    collapsed && 'lg:justify-center lg:px-0',
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 flex-shrink-0',
                      active ? 'text-white' : 'text-slate-400',
                    )}
                  />
                  <span className={cn('truncate', collapsed && 'lg:hidden')}>
                    {item.label}
                  </span>
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-3">
          <div
            className={cn(
              'mb-3 rounded-lg bg-slate-900 px-3 py-2',
              collapsed && 'lg:hidden',
            )}
          >
            <div
              className={cn(
                'text-xs text-slate-500',
                collapsed && 'lg:text-center',
              )}
            >
              Signed in
            </div>
            <div
              className={cn(
                'truncate text-sm font-medium text-slate-100',
                collapsed && 'lg:hidden',
              )}
            >
              {admin?.email ?? 'Platform admin'}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'w-full justify-start gap-2 text-slate-300 hover:bg-slate-900 hover:text-white',
              collapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(collapsed && 'lg:hidden')}>Logout</span>
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-background px-4 shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open platform navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:inline-flex"
              onClick={toggleCollapsed}
              aria-label={
                collapsed
                  ? 'Expand platform navigation'
                  : 'Collapse platform navigation'
              }
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-foreground">
                {currentTitle}
              </h1>
              <p className="hidden truncate text-xs text-muted-foreground sm:block">
                Platform-wide configuration and customer operations
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            {admin && (
              <span className="hidden max-w-64 truncate text-sm text-muted-foreground md:block">
                {admin.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="text-gray-500">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
