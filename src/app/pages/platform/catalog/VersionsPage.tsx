import { useQuery } from '@tanstack/react-query';
import {
  platformCatalogService,
  type CatalogVersion,
  type ApplyStatus,
} from '@/services/api/platformCatalog';
import { Card } from '@/app/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function ApplyStatusInline({ versionId }: { versionId: string }) {
  const { data } = useQuery({
    queryKey: ['platform', 'catalog', 'apply-status', versionId],
    queryFn: () => platformCatalogService.getApplyStatus(versionId),
    refetchInterval: (q) => {
      const s = q.state.data as ApplyStatus | undefined;
      return s && s.pending > 0 ? 5_000 : false;
    },
    staleTime: 5_000,
  });

  if (!data) return null;
  const total = data.pending + data.applied + data.failed;
  if (total === 0)
    return <span className="text-xs text-gray-500">no outbox rows</span>;

  if (data.pending > 0)
    return (
      <span className="text-xs text-blue-600 flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        applying {data.applied}/{total}
      </span>
    );
  if (data.failed > 0)
    return (
      <span className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {data.failed} failed
      </span>
    );
  return (
    <span className="text-xs text-green-600 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" />
      applied {data.applied}/{total}
    </span>
  );
}

function ManifestSummary({ v }: { v: CatalogVersion }) {
  const parts: string[] = [];
  for (const kind of ['control', 'test', 'policy', 'mapping'] as const) {
    const m = v.manifestJson?.[kind];
    if (!m) continue;
    const n = m.created + m.updated + m.retired;
    if (n > 0) {
      const bits: string[] = [];
      if (m.created) bits.push(`${m.created} new`);
      if (m.updated) bits.push(`${m.updated} updated`);
      if (m.retired) bits.push(`${m.retired} retired`);
      parts.push(`${kind}: ${bits.join(', ')}`);
    }
  }
  if (parts.length === 0) return <span className="text-gray-500">empty</span>;
  return <span>{parts.join(' · ')}</span>;
}

export function VersionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'catalog', 'versions'],
    queryFn: () => platformCatalogService.listVersions(),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-gray-900">Catalog versions</h1>

      {isLoading ? (
        <Card className="p-6 bg-white text-sm text-gray-500">Loading…</Card>
      ) : !data?.versions.length ? (
        <Card className="p-6 bg-white text-sm text-gray-500">
          No published versions yet. Publish a batch to create the first
          version.
        </Card>
      ) : (
        <Card className="bg-white divide-y divide-gray-100">
          {data.versions.map((v) => (
            <div key={v.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    v{v.version}
                  </span>
                  <span className="font-medium text-gray-900">{v.summary}</span>
                </div>
                <ApplyStatusInline versionId={v.id} />
              </div>
              <div className="text-xs text-gray-500">
                Published {new Date(v.publishedAt).toLocaleString()}
              </div>
              <div className="text-xs text-gray-700 mt-1">
                <ManifestSummary v={v} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
