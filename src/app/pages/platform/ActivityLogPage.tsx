import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  platformOpsService,
  type ActivityFilters,
} from '@/services/api/platformOps';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Clock, Filter, AlertCircle } from 'lucide-react';

export function ActivityLogPage() {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [draft, setDraft] = useState<ActivityFilters>({});

  const q = useInfiniteQuery({
    queryKey: ['platform', 'activity', filters],
    queryFn: ({ pageParam }) =>
      platformOpsService.listActivity({
        ...filters,
        cursor: pageParam as string | undefined,
        limit: 50,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const applyFilters = () => setFilters({ ...draft });
  const resetFilters = () => {
    setDraft({});
    setFilters({});
  };

  const allRows = q.data?.pages.flatMap((p) => p.rows) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Activity log</h1>

      <Card className="p-4 bg-white">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Filters</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <Input
            placeholder="action (e.g. PUBLISHED)"
            value={draft.action ?? ''}
            onChange={(e) => setDraft({ ...draft, action: e.target.value })}
          />
          <Input
            placeholder="targetType"
            value={draft.targetType ?? ''}
            onChange={(e) => setDraft({ ...draft, targetType: e.target.value })}
          />
          <Input
            placeholder="targetOrgId"
            value={draft.targetOrgId ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, targetOrgId: e.target.value })
            }
          />
          <Input
            placeholder="supportSessionId"
            value={draft.supportSessionId ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, supportSessionId: e.target.value })
            }
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={applyFilters} size="sm">
            Apply
          </Button>
          <Button onClick={resetFilters} variant="outline" size="sm">
            Reset
          </Button>
        </div>
      </Card>

      {q.isLoading ? (
        <Card className="p-6 bg-white text-sm text-gray-500">Loading…</Card>
      ) : q.isError ? (
        <Card className="p-4 bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Failed to load activity.
        </Card>
      ) : allRows.length === 0 ? (
        <Card className="p-6 bg-white text-sm text-gray-500">
          No activity matches the current filters.
        </Card>
      ) : (
        <Card className="bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500">
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Org</th>
                <th className="px-3 py-2 font-medium">Session</th>
                <th className="px-3 py-2 font-medium">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allRows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                    <Clock className="inline w-3 h-3 mr-1" />
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      {r.action}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-700">
                    {r.targetType}
                    {r.targetId ? ` · ${r.targetId.slice(0, 8)}` : ''}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-600">
                    {r.targetOrgId ? r.targetOrgId.slice(0, 8) : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-600">
                    {r.supportSessionId ? r.supportSessionId.slice(0, 8) : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-gray-600">
                    {r.platformAdminId.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {q.hasNextPage && (
            <div className="border-t border-gray-100 p-3 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => q.fetchNextPage()}
                disabled={q.isFetchingNextPage}
              >
                {q.isFetchingNextPage ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
