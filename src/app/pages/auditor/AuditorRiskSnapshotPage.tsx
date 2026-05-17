/**
 * AuditorRiskSnapshotPage — /auditor/audits/:auditId/risk-snapshots/:snapshotId
 *
 * Read-only view of a single shared risk snapshot, scoped to the auditor's
 * audit observation window. No share toggle, no CSV export — auditors see
 * the items table only. Out-of-window or not-shared → 404 from the backend.
 */

import { useParams, Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Loader2, ChevronLeft, AlertCircle, LogOut } from 'lucide-react';
import { auditsService } from '@/services/api/audits';
import type { RiskSnapshotRecord } from '@/services/api/risks';
import { RiskSnapshotItemsView } from '@/app/pages/risk/RiskSnapshotItemsView';
import { useIsAdmin } from '@/hooks/useCurrentUser';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

export function AuditorRiskSnapshotPage() {
  const { t } = useTranslation('risk');
  const { auditId, snapshotId } = useParams<{
    auditId: string;
    snapshotId: string;
  }>();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();

  const {
    data: snap,
    isLoading,
    isError,
    refetch,
  } = useQuery<RiskSnapshotRecord>({
    queryKey: QK.auditorRiskSnapshotDetail(auditId!, snapshotId!),
    queryFn: () =>
      auditsService
        .getRiskSnapshotDetail(auditId!, snapshotId!)
        .then((r) => r.data!),
    enabled: Boolean(auditId && snapshotId),
    staleTime: STALE.RISKS,
  });

  const backTo = `/auditor/audits/${auditId}/final-report`;

  if (isLoading) {
    return (
      <PageTemplate title={t('snapshot.title')}>
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageTemplate>
    );
  }

  if (isError) {
    return (
      <PageTemplate title={t('snapshot.title')}>
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <div>
            <p className="font-medium">{t('snapshot.detail.errorTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('snapshot.detail.errorBody')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(backTo)}>
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              {t('snapshot.detail.backToSnapshots')}
            </Button>
            <Button onClick={() => refetch()}>
              {t('snapshot.detail.retry')}
            </Button>
          </div>
        </Card>
      </PageTemplate>
    );
  }

  if (!snap) {
    return (
      <PageTemplate title={t('snapshot.title')}>
        <Card className="flex flex-col items-center gap-4 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">{t('snapshot.detail.notFound')}</p>
          <Button variant="outline" onClick={() => navigate(backTo)}>
            <ChevronLeft className="w-4 h-4 mr-1.5" />
            {t('snapshot.detail.backToSnapshots')}
          </Button>
        </Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title={t('snapshot.title')}
      actions={
        isAdmin ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/compliance/audits/${auditId}`)}
          >
            <LogOut className="w-4 h-4 mr-1" />
            {t('snapshot.detail.exitPreview')}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          {t('snapshot.detail.backToSnapshots')}
        </Link>
        <RiskSnapshotItemsView snap={snap} />
      </div>
    </PageTemplate>
  );
}
