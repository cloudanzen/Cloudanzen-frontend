import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { assetsService } from '@/services/api/assets';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

export function AssetDetailPage() {
  const { t } = useTranslation('assets');
  const navigate = useNavigate();
  const { id = '' } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: QK.assetDetail(id),
    queryFn: () => assetsService.getAssetDetail(id),
    enabled: Boolean(id),
    staleTime: STALE.DASHBOARD,
  });

  const { data: changelogData } = useQuery({
    queryKey: QK.assetChangelog(id),
    queryFn: () => assetsService.getAssetChangelog(id, { page: 1, limit: 20 }),
    enabled: Boolean(id),
    staleTime: STALE.DASHBOARD,
  });

  const asset = data?.data;
  const changelog = changelogData?.data ?? asset?.changeLog ?? [];

  function renderDiff(values?: Record<string, unknown> | null) {
    if (!values || Object.keys(values).length === 0) return null;
    return (
      <div className="mt-2 rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
        <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(values, null, 2)}</pre>
      </div>
    );
  }

  return (
    <PageTemplate
      title={asset?.name ?? t('detail.title')}
      description={asset?.description ?? t('detail.description')}
      actions={
        <button type="button" onClick={() => navigate('/assets/inventory')} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
          <ArrowLeft className="h-4 w-4" />
          {t('detail.back')}
        </button>
      }
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : error || !asset ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error instanceof Error ? error.message : t('detail.loadFailed')}</div>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">{t('detail.overview')}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{asset.type}</Badge>
              {asset.provider ? <Badge variant="outline">{asset.provider}</Badge> : null}
              {asset.category ? <Badge variant="outline">{asset.category}</Badge> : null}
              {asset.isStale ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">{t('inventory.stale')}</Badge> : null}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">External ID</p>
                <p className="mt-1 text-sm text-foreground">{asset.externalId ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Region</p>
                <p className="mt-1 text-sm text-foreground">{asset.region ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hostname</p>
                <p className="mt-1 text-sm text-foreground">{asset.hostname ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serial Number</p>
                <p className="mt-1 text-sm text-foreground">{asset.serialNumber ?? '—'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">{t('detail.relationships')}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.parents')}</p>
                <div className="mt-2 space-y-2">
                  {asset.parentRelations?.length ? asset.parentRelations.map((relation) => (
                    <button key={relation.parentAsset.id} type="button" onClick={() => navigate(`/assets/inventory/${relation.parentAsset.id}`)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      {relation.parentAsset.name} <span className="text-xs text-muted-foreground">({relation.relationshipType})</span>
                    </button>
                  )) : <p className="text-sm text-muted-foreground">{t('detail.noRelationships')}</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.children')}</p>
                <div className="mt-2 space-y-2">
                  {asset.childRelations?.length ? asset.childRelations.map((relation) => (
                    <button key={relation.childAsset.id} type="button" onClick={() => navigate(`/assets/inventory/${relation.childAsset.id}`)} className="w-full rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50">
                      {relation.childAsset.name} <span className="text-xs text-muted-foreground">({relation.relationshipType})</span>
                    </button>
                  )) : <p className="text-sm text-muted-foreground">{t('detail.noRelationships')}</p>}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">{t('detail.compliance')}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.linkedControls')}</p>
                <div className="mt-2 space-y-2">
                  {asset.controlMappings?.length ? asset.controlMappings.map((mapping) => (
                    <div key={mapping.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                      <div className="font-medium text-foreground">{mapping.control.title}</div>
                      <div className="text-xs text-muted-foreground">{mapping.control.status}</div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">—</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.linkedTests')}</p>
                <div className="mt-2 space-y-2">
                  {asset.testMappings?.length ? asset.testMappings.map((mapping) => (
                    <div key={mapping.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                      <div className="font-medium text-foreground">{mapping.test.name}</div>
                      <div className="text-xs text-muted-foreground">{mapping.test.status}</div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">—</p>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.openFindings')}</p>
                <div className="mt-2 space-y-2">
                  {asset.findings?.length ? asset.findings.map((finding) => (
                    <div key={finding.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                      <div className="font-medium text-foreground">{finding.title}</div>
                      <div className="text-xs text-muted-foreground">{finding.severity} • {finding.status}</div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">—</p>}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">{t('detail.history')}</h2>
            <div className="mt-4 space-y-3">
              {changelog.length ? changelog.map((entry) => (
                <div key={entry.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{entry.changeType}</span>
                    <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  {entry.source ? <p className="mt-1 text-xs text-muted-foreground">{entry.source}</p> : null}
                  {renderDiff(entry.previousValues)}
                  {renderDiff(entry.newValues)}
                </div>
              )) : <p className="text-sm text-muted-foreground">{t('detail.noChanges')}</p>}
            </div>
          </Card>
        </div>
      )}
    </PageTemplate>
  );
}
