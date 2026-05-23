import { usePlatformAdmin } from '@/app/hooks/usePlatformAdmin';
import { Card } from '@/app/components/ui/card';

// Placeholder dashboard. Real cards (orgs, frameworks, integration health,
// job DLQ depth, support sessions, recent incidents) land in PR-X7 backed
// by GET /api/platform/health.
export function PlatformDashboardPage() {
  const { data: admin, isLoading } = usePlatformAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <Card className="p-6 bg-white">
        <p className="text-gray-700">
          Welcome,{' '}
          <strong>{isLoading ? '…' : (admin?.email ?? 'admin')}</strong>.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Health dashboard ships in PR-X7. Use the sidebar to access
          organizations, support sessions, and the catalog.
        </p>
      </Card>
    </div>
  );
}
