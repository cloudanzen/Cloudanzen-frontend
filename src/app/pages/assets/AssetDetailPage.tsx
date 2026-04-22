import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { assetsService } from '@/services/api/assets';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function AssetDetailPage() {
  const { t } = useTranslation('assets');
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [targetAssetId, setTargetAssetId] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [assetReviewType, setAssetReviewType] = useState<'OWNERSHIP' | 'CLASSIFICATION' | 'STALE' | 'COMPLIANCE'>('CLASSIFICATION');
  const [assetReviewDisposition, setAssetReviewDisposition] = useState<'CONFIRMED' | 'UPDATED' | 'ARCHIVED' | 'DEFERRED'>('CONFIRMED');
  const [assetReviewNotes, setAssetReviewNotes] = useState('');
  const [resolvingField, setResolvingField] = useState<string | null>(null);
  const [preferredProvider, setPreferredProvider] = useState('');

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

  const { data: reviewsData } = useQuery({
    queryKey: QK.assetReviews(id),
    queryFn: () => assetsService.getAssetReviews(id, { page: 1, limit: 20 }),
    enabled: Boolean(id),
    staleTime: STALE.DASHBOARD,
  });

  const { data: settingsData } = useQuery({
    queryKey: ['assets', 'settings'],
    queryFn: () => assetsService.getSettings(),
    staleTime: STALE.DASHBOARD,
  });

  const asset = data?.data;
  const changelog = changelogData?.data ?? asset?.changeLog ?? [];
  const reviews = reviewsData?.data ?? asset?.reviews ?? [];

  const refreshAsset = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: QK.assetDetail(id) }),
      qc.invalidateQueries({ queryKey: QK.assetReviews(id) }),
      qc.invalidateQueries({ queryKey: QK.assets() }),
    ]);
  };

  const reviewMutation = useMutation({
    mutationFn: (reviewStatus: 'APPROVED' | 'DISMISSED') =>
      assetsService.reviewMergeGroup(asset!.mergeGroup!.id, { reviewStatus, notes: reviewNotes || undefined }),
    onSuccess: async () => {
      toast.success(t('detail.reviewSaved'));
      await refreshAsset();
    },
    onError: () => toast.error(t('detail.reviewSaveFailed')),
  });

  const mergeMutation = useMutation({
    mutationFn: () => assetsService.mergeWithAsset(id, targetAssetId),
    onSuccess: async () => {
      toast.success(t('detail.mergeSucceeded'));
      setTargetAssetId('');
      await refreshAsset();
    },
    onError: () => toast.error(t('detail.mergeFailed')),
  });

  const unmergeMutation = useMutation({
    mutationFn: (assetId: string) => assetsService.unmergeAsset(asset!.mergeGroup!.id, assetId),
    onSuccess: async () => {
      toast.success(t('detail.unmergeSucceeded'));
      await refreshAsset();
    },
    onError: () => toast.error(t('detail.unmergeFailed')),
  });

  const assetReviewMutation = useMutation({
    mutationFn: () => assetsService.createAssetReview(id, {
      reviewType: assetReviewType,
      disposition: assetReviewDisposition,
      notes: assetReviewNotes || undefined,
    }),
    onSuccess: async () => {
      toast.success('Asset review recorded');
      setAssetReviewNotes('');
      await refreshAsset();
    },
    onError: () => toast.error('Failed to record asset review'),
  });

  const assignToMeMutation = useMutation({
    mutationFn: () => assetsService.updateAsset(id, { ownerId: currentUser?.id ?? null }),
    onSuccess: async () => {
      toast.success('Asset assigned to you');
      await refreshAsset();
    },
    onError: () => toast.error('Failed to assign asset'),
  });

  const resolveConflictMutation = useMutation({
    mutationFn: ({ field, value }: { field: 'name' | 'provider' | 'externalId' | 'hostname' | 'serialNumber' | 'osType' | 'osVersion' | 'region' | 'externalResourceName' | 'criticality' | 'category' | 'subtype'; value: string | null }) =>
      assetsService.resolveMergeConflict(asset!.mergeGroup!.id, { field, value }),
    onSuccess: async () => {
      toast.success('Merge conflict resolved');
      setResolvingField(null);
      await refreshAsset();
    },
    onError: () => toast.error('Failed to resolve merge conflict'),
  });

  const resolveFromProviderMutation = useMutation({
    mutationFn: (provider: string) => assetsService.resolveMergeFromProvider(asset!.mergeGroup!.id, { provider }),
    onSuccess: async (_, provider) => {
      toast.success(`Applied ${provider} values to merge group`);
      await refreshAsset();
    },
    onError: () => toast.error('Failed to apply provider priority'),
  });

  function renderDiff(values?: Record<string, unknown> | null) {
    if (!values || Object.keys(values).length === 0) return null;
    return (
      <div className="mt-2 rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(values).map(([key, value]) => (
            <div key={key} className="rounded border border-border/60 bg-background px-2 py-1">
              <p className="font-medium text-foreground">{key}</p>
              <p className="mt-1 break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const configuredPriority = settingsData?.data?.providerPriority ?? [];
  const mergeProviders = Array.from(new Set((asset?.mergeGroup?.assets ?? []).map((groupedAsset) => groupedAsset.provider).filter(Boolean)))
    .sort((left, right) => {
      const leftIndex = configuredPriority.indexOf(left as string);
      const rightIndex = configuredPriority.indexOf(right as string);
      if (leftIndex === -1 && rightIndex === -1) return String(left).localeCompare(String(right));
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    }) as string[];

  useEffect(() => {
    if (!mergeProviders.length) return;
    setPreferredProvider((current) => (current && mergeProviders.includes(current) ? current : (mergeProviders[0] ?? '')));
  }, [mergeProviders]);

  return (
    <PageTemplate
      title={asset?.name ?? t('detail.title')}
      description={asset?.description ?? t('detail.description')}
      actions={
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate('/assets/inventory')} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
            <ArrowLeft className="h-4 w-4" />
            {t('detail.back')}
          </button>
          <button type="button" onClick={() => navigate('/assets/merge-review')} className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
            {t('mergeReview.title')}
          </button>
          <button
            type="button"
            onClick={() => assignToMeMutation.mutate()}
            disabled={assignToMeMutation.isPending || !currentUser || asset?.ownerId === currentUser.id}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm disabled:opacity-50"
          >
            Assign to me
          </button>
        </div>
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
            <h2 className="text-sm font-semibold text-foreground">Sources</h2>
            <div className="mt-4 space-y-3">
              {asset.sourceRecords?.length ? asset.sourceRecords.map((source) => (
                <div key={source.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={source.isPrimary ? 'default' : 'outline'}>{source.provider}</Badge>
                      <span className="font-medium text-foreground">{source.externalId}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(source.lastSeenAt).toLocaleString()}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Confidence: {source.confidence}</span>
                    {source.isPrimary ? <span>Primary</span> : null}
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No source records available.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">Merge conflicts</h2>
            <div className="mt-4 space-y-3">
              {mergeProviders.length ? (
                <div className="rounded-md border border-gray-200 px-3 py-3 text-sm">
                  <p className="font-medium text-foreground">Provider priority</p>
                  <p className="mt-1 text-xs text-muted-foreground">Apply one provider’s values across all conflicting fields in this merge group.</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={preferredProvider}
                      onChange={(event) => setPreferredProvider(event.target.value)}
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select provider</option>
                      {mergeProviders.map((provider) => (
                        <option key={provider} value={provider}>{provider}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => preferredProvider && resolveFromProviderMutation.mutate(preferredProvider)}
                      disabled={!preferredProvider || resolveFromProviderMutation.isPending}
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
                    >
                      Apply provider
                    </button>
                  </div>
                </div>
              ) : null}
              {asset.mergeConflicts?.length ? asset.mergeConflicts.map((conflict) => (
                <div key={conflict.field} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{conflict.field}</p>
                    <button
                      type="button"
                      onClick={() => setResolvingField(resolvingField === conflict.field ? null : conflict.field)}
                      className="text-xs text-muted-foreground hover:text-blue-600"
                    >
                      {resolvingField === conflict.field ? 'Cancel' : 'Resolve'}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {conflict.values.map((value) => (
                      <button
                        key={`${conflict.field}-${value.value}`}
                        type="button"
                        disabled={resolveConflictMutation.isPending && resolvingField === conflict.field}
                        onClick={() => resolveConflictMutation.mutate({ field: conflict.field as Parameters<typeof resolveConflictMutation.mutate>[0]['field'], value: value.value })}
                        className="disabled:opacity-50"
                      >
                        <Badge variant={resolvingField === conflict.field ? 'default' : 'outline'}>
                          {value.value} ({value.assetIds.length})
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">No merge conflicts detected for this group.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">{t('detail.deduplication')}</h2>
            {asset.mergeGroup ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.mergeGroupType')}</p>
                    <p className="mt-1 text-sm text-foreground">{asset.mergeGroup.groupType ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.groupedAssets')}</p>
                    <p className="mt-1 text-sm text-foreground">{asset.mergeGroup._count?.assets ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.reviewStatus')}</p>
                    <p className="mt-1 text-sm text-foreground">{asset.mergeGroup.reviewStatus ?? 'PENDING'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.reviewedAt')}</p>
                    <p className="mt-1 text-sm text-foreground">{asset.mergeGroup.reviewedAt ? new Date(asset.mergeGroup.reviewedAt).toLocaleString() : '—'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.reviewNotes')}</p>
                  <textarea
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    placeholder={asset.mergeGroup.notes ?? ''}
                    className="min-h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => reviewMutation.mutate('APPROVED')}
                      disabled={reviewMutation.isPending}
                      className="rounded-md bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {t('detail.approveGroup')}
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewMutation.mutate('DISMISSED')}
                      disabled={reviewMutation.isPending}
                      className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                    >
                      {t('detail.dismissGroup')}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.potentialDuplicates')}</p>
                  <div className="mt-2 space-y-2">
                    {asset.mergeGroup.assets?.filter((item) => item.id !== asset.id).length ? (
                      asset.mergeGroup.assets
                        ?.filter((item) => item.id !== asset.id)
                        .map((item) => (
                          <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => navigate(`/assets/inventory/${item.id}`)}
                                className="text-left hover:text-blue-700"
                              >
                                {item.name} <span className="text-xs text-muted-foreground">({item.provider ?? 'manual'})</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => unmergeMutation.mutate(item.id)}
                              className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700"
                            >
                              {t('detail.removeFromGroup')}
                            </button>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{t('detail.noDuplicates')}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">{t('detail.noDuplicates')}</p>
            )}
            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('detail.manualMerge')}</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={targetAssetId}
                  onChange={(event) => setTargetAssetId(event.target.value)}
                  placeholder={t('detail.targetAssetId')}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => mergeMutation.mutate()}
                  disabled={mergeMutation.isPending || !targetAssetId.trim()}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {t('detail.mergeAssets')}
                </button>
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
            <h2 className="text-sm font-semibold text-foreground">Asset reviews</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-sm text-foreground">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Review type</span>
                    <select
                      value={assetReviewType}
                      onChange={(event) => setAssetReviewType(event.target.value as typeof assetReviewType)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="OWNERSHIP">Ownership</option>
                      <option value="CLASSIFICATION">Classification</option>
                      <option value="STALE">Stale</option>
                      <option value="COMPLIANCE">Compliance</option>
                    </select>
                  </label>
                  <label className="text-sm text-foreground">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Disposition</span>
                    <select
                      value={assetReviewDisposition}
                      onChange={(event) => setAssetReviewDisposition(event.target.value as typeof assetReviewDisposition)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                    >
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="UPDATED">Updated</option>
                      <option value="ARCHIVED">Archived</option>
                      <option value="DEFERRED">Deferred</option>
                    </select>
                  </label>
                </div>
                <textarea
                  value={assetReviewNotes}
                  onChange={(event) => setAssetReviewNotes(event.target.value)}
                  placeholder="Add review notes"
                  className="mt-3 min-h-24 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => assetReviewMutation.mutate()}
                    disabled={assetReviewMutation.isPending}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Record review
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssetReviewType(asset.isStale ? 'STALE' : 'CLASSIFICATION');
                      setAssetReviewDisposition(asset.isStale ? 'ARCHIVED' : 'CONFIRMED');
                    }}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  >
                    Use suggested review
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {reviews.length ? reviews.map((review) => (
                  <div key={review.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{review.reviewType}</span>
                      <Badge variant="outline">{review.disposition}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(review.reviewedAt).toLocaleString()}</p>
                    {review.notes ? <p className="mt-2 text-sm text-muted-foreground">{review.notes}</p> : null}
                  </div>
                )) : <p className="text-sm text-muted-foreground">No reviews recorded yet.</p>}
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
