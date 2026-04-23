import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, GitMerge, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { assetsService } from '@/services/api/assets';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

const REVIEW_OPTIONS = ['PENDING', 'APPROVED', 'DISMISSED'] as const;

export function MergeReviewPage() {
  const { t } = useTranslation('assets');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [reviewStatus, setReviewStatus] = useState<(typeof REVIEW_OPTIONS)[number]>('PENDING');

  const { data, isLoading, error } = useQuery({
    queryKey: QK.assetMergeGroups(reviewStatus),
    queryFn: () => assetsService.getMergeGroups(reviewStatus),
    staleTime: STALE.DASHBOARD,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ groupId, nextStatus }: { groupId: string; nextStatus: 'APPROVED' | 'DISMISSED' }) =>
      assetsService.reviewMergeGroup(groupId, { reviewStatus: nextStatus }),
    onSuccess: async () => {
      toast.success(t('mergeReview.saved'));
      await qc.invalidateQueries({ queryKey: QK.assetMergeGroups(reviewStatus) });
      await qc.invalidateQueries({ queryKey: QK.assets() });
    },
    onError: () => toast.error(t('mergeReview.saveFailed')),
  });

  const groups = data?.data ?? [];

  return (
    <PageTemplate
      title={t('mergeReview.title')}
      description={t('mergeReview.description')}
      actions={
        <div className="flex items-center gap-2">
          {REVIEW_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setReviewStatus(option)}
              className={`rounded-md px-3 py-2 text-sm ${reviewStatus === option ? 'bg-blue-600 text-white' : 'border border-gray-200 bg-white text-gray-700'}`}
            >
              {t(`mergeReview.status.${option.toLowerCase()}`)}
            </button>
          ))}
        </div>
      }
    >
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error instanceof Error ? error.message : t('mergeReview.loadFailed')}
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">{t('mergeReview.empty')}</Card>
          ) : groups.map((group) => (
            <Card key={group.id} className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <GitMerge className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground">{group.displayName || group.dedupeKey}</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {group.groupType} · {group._count?.assets ?? 0} {t('mergeReview.assetsLabel')}
                  </p>
                  {group.notes ? <p className="mt-2 text-sm text-muted-foreground">{group.notes}</p> : null}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate({ groupId: group.id, nextStatus: 'APPROVED' })}
                    disabled={reviewMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t('mergeReview.approve')}
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewMutation.mutate({ groupId: group.id, nextStatus: 'DISMISSED' })}
                    disabled={reviewMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    {t('mergeReview.dismiss')}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {group.assets?.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => navigate(`/assets/inventory/${asset.id}`)}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <span>{asset.name}</span>
                    <span className="text-xs text-muted-foreground">{asset.provider ?? 'manual'}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldAlert className="h-4 w-4" />
                <span>{t(`mergeReview.status.${group.reviewStatus.toLowerCase()}`)}</span>
                {group.reviewedAt ? <span>· {new Date(group.reviewedAt).toLocaleString()}</span> : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageTemplate>
  );
}
