import { Card } from '@/app/components/ui/card';

// TODO PR-X6: PlatformActivityLog viewer with filters (date range,
// platformAdminId, action, targetType, supportSessionId). Mounted as a
// stub so the sidebar link doesn't 404 during the dual-mode window.
export function ActivityLogPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Activity Log</h1>
      <Card className="p-6 bg-white text-sm text-gray-600">
        Platform activity viewer ships in PR-X6.
      </Card>
    </div>
  );
}
