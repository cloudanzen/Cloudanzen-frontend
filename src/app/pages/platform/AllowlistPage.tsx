import { Card } from '@/app/components/ui/card';

// TODO PR-X4.5: CRUD on PlatformAdminEmailAllowlist. Mounted as a stub so
// the sidebar link doesn't 404. Backend routes already exist:
//   GET    /api/platform/allowlist
//   POST   /api/platform/allowlist     { email, notes? }
//   DELETE /api/platform/allowlist/:id
export function AllowlistPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Allowlist</h1>
      <Card className="p-6 bg-white text-sm text-gray-600">
        Allowlist CRUD ships in PR-X4.5.
      </Card>
    </div>
  );
}
