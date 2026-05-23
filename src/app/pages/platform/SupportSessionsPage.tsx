import { Card } from '@/app/components/ui/card';

// TODO PR-X4.5: list + revoke. Mounted now so the sidebar link doesn't 404
// during the dual-mode rollout window. Full implementation pulls
// GET /api/platform/support-sessions and renders a table with status,
// effectiveRole, expiresAt, [Revoke] button.
export function SupportSessionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Support Sessions</h1>
      <Card className="p-6 bg-white text-sm text-gray-600">
        List + revoke ships in PR-X4.5. The backend already supports{' '}
        <code className="bg-gray-100 px-1 rounded">
          GET /api/platform/support-sessions
        </code>{' '}
        and{' '}
        <code className="bg-gray-100 px-1 rounded">
          POST /api/platform/support-sessions/:id/end
        </code>
        .
      </Card>
    </div>
  );
}
