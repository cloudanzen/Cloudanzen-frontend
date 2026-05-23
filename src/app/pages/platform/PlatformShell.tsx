import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { Suspense } from 'react';
import { usePlatformAdmin } from '@/app/hooks/usePlatformAdmin';
import { platformAuthService } from '@/services/api/platformAuth';
import { Button } from '@/app/components/ui/button';
import { Shield, LogOut } from 'lucide-react';

// Hostname-rooted at platform.cloudanzen.com. Deliberately NO customer-org
// chrome (no org switcher, no settings, no notifications) — platform admins
// are not members of any customer org.
//
// Sidebar links are placeholders for paths shipped in PR-X4/X6/X7; routes
// for them don't exist yet. Clicking a not-yet-built link 404s on the
// platform tree, which is intentional during the rollout window.
const NAV: { to: string; label: string }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/organizations', label: 'Organizations' },
  { to: '/support-sessions', label: 'Support Sessions' },
  { to: '/templates/control', label: 'Control Templates' },
  { to: '/templates/test', label: 'Test Templates' },
  { to: '/templates/policy', label: 'Policy Templates' },
  { to: '/frameworks', label: 'Frameworks' },
  { to: '/framework-requests', label: 'Framework Requests' },
  { to: '/catalog/batches', label: 'Catalog Batches' },
  { to: '/catalog/versions', label: 'Catalog Versions' },
  { to: '/allowlist', label: 'Admin Allowlist' },
  { to: '/activity', label: 'Activity Log' },
];

export function PlatformShell() {
  const { data: admin } = usePlatformAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await platformAuthService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-gray-900">
              CloudAnzen Platform Console
            </span>
          </div>
          <div className="flex items-center gap-4">
            {admin && (
              <span className="text-sm text-gray-600">{admin.email}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-56 bg-white border-r border-gray-200 py-4">
          <nav className="flex flex-col">
            {NAV.map((item) => {
              const active =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-4 py-2 text-sm ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Suspense fallback={<div className="text-gray-500">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
