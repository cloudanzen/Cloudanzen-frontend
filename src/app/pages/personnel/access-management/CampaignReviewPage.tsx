import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Upload,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  accessManagementService,
  type CampaignServiceSummary,
} from '@/services/api/access-management';
import { ApiError } from '@/services/api/client';
import { CsvUploadDialog } from './CsvUploadDialog';

interface Props {
  campaignId: string;
  onBack: () => void;
}

export function CampaignReviewPage({ campaignId, onBack }: Props) {
  const { t } = useTranslation('personnel');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  const { data: campaign } = useQuery({
    queryKey: ['access-campaign', campaignId],
    queryFn: () => accessManagementService.getCampaign(campaignId),
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['access-campaign-services', campaignId],
    queryFn: () => accessManagementService.getCampaignServices(campaignId),
  });

  const safeServices: CampaignServiceSummary[] = Array.isArray(services)
    ? services
    : [];
  const prog = campaign?.progress;

  if (selectedServiceId) {
    const service = safeServices.find((s) => s.serviceId === selectedServiceId);
    return (
      <ServiceReviewPanel
        campaignId={campaignId}
        service={service}
        onBack={() => setSelectedServiceId(null)}
      />
    );
  }

  const completedCount = safeServices.filter((s) => s.isCompleted).length;
  const pendingServiceCount =
    safeServices.length - completedCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-medium">
            {campaign?.name ?? t('accessManagement.campaignReview.title')}
          </h2>
          {campaign?.description && (
            <p className="text-xs text-muted-foreground">
              {campaign.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label={t('accessManagement.campaignReview.systemsReviewed', {
            completed: prog?.completedServices ?? 0,
            total: prog?.totalServices ?? 0,
          })}
        />
        <StatCard
          label={t('accessManagement.campaignReview.accountsReviewed', {
            count: prog?.reviewed ?? 0,
          })}
        />
        <StatCard
          label={t('accessManagement.campaignReview.accountsFlagged', {
            count: prog?.revoked ?? 0,
          })}
        />
        <StatCard
          label={t('accessManagement.campaignReview.accessChanges', {
            count: 0,
          })}
        />
      </div>

      {/* Incomplete services warning */}
      {pendingServiceCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900 rounded p-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {t('accessManagement.campaignReview.cannotComplete', {
              count: pendingServiceCount,
            })}
          </span>
        </div>
      )}

      {/* Service table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">
                  {t('accessManagement.campaignReview.columns.system')}
                </th>
                <th className="text-left p-3 font-medium">
                  {t('accessManagement.campaignReview.reviewer')}
                </th>
                <th className="text-left p-3 font-medium hidden md:table-cell">
                  {t('accessManagement.campaignReview.accessData')}
                </th>
                <th className="text-left p-3 font-medium">
                  {t('accessManagement.campaignReview.status')}
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {servicesLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t('accessManagement.campaignReview.loading')}
                  </td>
                </tr>
              ) : safeServices.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t('accessManagement.campaignReview.empty')}
                  </td>
                </tr>
              ) : (
                safeServices.map((s) => (
                  <ServiceRow
                    key={s.serviceId}
                    service={s}
                    onClick={() => setSelectedServiceId(s.serviceId)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label }: { label: string }) {
  return (
    <Card className="p-3">
      <div className="text-sm font-medium">{label}</div>
    </Card>
  );
}

function ServiceRow({
  service,
  onClick,
}: {
  service: CampaignServiceSummary;
  onClick: () => void;
}) {
  const { t } = useTranslation('personnel');
  const reviewerLabel = service.reviewerName ?? service.reviewerEmail ?? '—';

  const accessDataBadge =
    service.accessDataType === 'synced' ? (
      <Badge
        className="text-xs bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
        variant="outline"
      >
        {service.lastSyncedAt
          ? t('accessManagement.campaignReview.syncedOn', {
              date: new Date(service.lastSyncedAt).toLocaleDateString(),
            })
          : t('accessManagement.campaignReview.synced')}
      </Badge>
    ) : service.accessDataType === 'uploaded' ? (
      <Badge
        className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
        variant="outline"
      >
        {t('accessManagement.campaignReview.fileUploaded')}
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        {t('accessManagement.campaignReview.noData')}
      </Badge>
    );

  const statusBadge = service.isAwaitingUpload ? (
    <Badge variant="secondary" className="text-xs">
      {t('accessManagement.campaignReview.awaitingUpload')}
    </Badge>
  ) : service.isCompleted ? (
    <Badge
      className="text-xs bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
      variant="outline"
    >
      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
      {t('accessManagement.campaignReview.completed')}
    </Badge>
  ) : (
    <Badge className="text-xs" variant="outline">
      {t('accessManagement.campaignReview.pendingCount', {
        count: service.pendingAccounts,
      })}
    </Badge>
  );

  return (
    <tr
      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <td className="p-3 font-medium">{service.serviceName ?? '—'}</td>
      <td className="p-3 text-muted-foreground">{reviewerLabel}</td>
      <td className="p-3 hidden md:table-cell">{accessDataBadge}</td>
      <td className="p-3">{statusBadge}</td>
      <td className="p-3 text-muted-foreground">
        <ChevronRight className="w-4 h-4" />
      </td>
    </tr>
  );
}

function ServiceReviewPanel({
  campaignId,
  service,
  onBack,
}: {
  campaignId: string;
  service: CampaignServiceSummary | undefined;
  onBack: () => void;
}) {
  const { t } = useTranslation('personnel');
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);

  const { data: allServices } = useQuery({
    queryKey: ['access-services'],
    queryFn: () => accessManagementService.listServices(),
  });

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['access-campaign-items', campaignId, service?.serviceId],
    queryFn: () =>
      accessManagementService.listReviewItems(campaignId, {
        serviceId: service?.serviceId,
        limit: 500,
      }),
    enabled: Boolean(service?.serviceId),
  });

  const reviewMutation = useMutation({
    mutationFn: ({
      itemId,
      decision,
    }: {
      itemId: string;
      decision: 'accept' | 'revoke';
    }) => accessManagementService.reviewItem(campaignId, itemId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['access-campaign-items', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['access-campaign-services', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['access-campaign', campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ['access-campaigns'] });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.error : 'Failed to save review';
      toast.error(msg);
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () =>
      accessManagementService.refreshServiceItems(
        campaignId,
        service!.serviceId,
      ),
    onSuccess: (data) => {
      toast.success(
        t('accessManagement.campaignReview.refreshed', {
          count: data.itemCount,
        }),
      );
      queryClient.invalidateQueries({
        queryKey: ['access-campaign-items', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['access-campaign-services', campaignId],
      });
    },
    onError: (err) => {
      const msg =
        err instanceof ApiError ? err.error : 'Failed to refresh service items';
      toast.error(msg);
    },
  });

  if (!service) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Card className="p-8 text-center text-muted-foreground">
          {t('accessManagement.campaignReview.serviceMissing')}
        </Card>
      </div>
    );
  }

  const items = itemsData?.rows ?? [];
  const accessService = Array.isArray(allServices)
    ? allServices.find((s) => s.id === service.serviceId)
    : undefined;

  const canUpload =
    service.accessDataType !== 'synced' && service.reviewedAccounts === 0;
  const uploadDisabledReason = !canUpload && service.reviewedAccounts > 0
    ? t('accessManagement.campaignReview.cannotRefreshDecisionsExist')
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-medium">{service.serviceName ?? '—'}</h2>
            <p className="text-xs text-muted-foreground">
              {t('accessManagement.campaignReview.servicePanelSubtitle', {
                reviewed: service.reviewedAccounts,
                total: service.totalAccounts,
              })}
            </p>
          </div>
        </div>

        {service.accessDataType !== 'synced' && accessService && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUpload(true)}
            disabled={!canUpload}
            title={uploadDisabledReason ?? undefined}
          >
            <Upload className="w-4 h-4 mr-1" />
            {t('accessManagement.campaignReview.uploadData')}
          </Button>
        )}
      </div>

      {service.isAwaitingUpload ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>{t('accessManagement.campaignReview.awaitingUploadBody')}</p>
          {accessService && (
            <Button
              size="sm"
              className="mt-3"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="w-4 h-4 mr-1" />
              {t('accessManagement.campaignReview.uploadData')}
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">
                    {t('accessManagement.campaignReview.columns.account')}
                  </th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">
                    {t('accessManagement.campaignReview.columns.email')}
                  </th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">
                    {t('accessManagement.campaignReview.columns.role')}
                  </th>
                  <th className="text-left p-3 font-medium">
                    {t('accessManagement.campaignReview.columns.status')}
                  </th>
                  <th className="text-left p-3 font-medium">
                    {t('accessManagement.campaignReview.columns.decision')}
                  </th>
                  <th className="text-left p-3 font-medium w-[160px]">
                    {t('accessManagement.campaignReview.columns.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {t('accessManagement.campaignReview.loading')}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-muted-foreground"
                    >
                      {t('accessManagement.campaignReview.empty')}
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3 font-medium">
                        {item.snapshotAccountName}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {item.snapshotAccountEmail ?? t('common.none')}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {item.snapshotRole ?? t('common.none')}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            item.snapshotStatus === 'active'
                              ? 'default'
                              : 'destructive'
                          }
                          className="text-xs"
                        >
                          {item.snapshotStatus ?? t('common.unknown')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {item.decision === 'accept' && (
                          <Badge
                            className="text-xs bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                            variant="outline"
                          >
                            {t(
                              'accessManagement.campaignReview.acceptDecision',
                            )}
                          </Badge>
                        )}
                        {item.decision === 'revoke' && (
                          <Badge variant="destructive" className="text-xs">
                            {t(
                              'accessManagement.campaignReview.revokeDecision',
                            )}
                          </Badge>
                        )}
                        {!item.decision && (
                          <span className="text-xs text-amber-600">
                            {t(
                              'accessManagement.campaignReview.pendingDecision',
                            )}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {!item.decision && (
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-green-600 hover:bg-green-50"
                              onClick={() =>
                                reviewMutation.mutate({
                                  itemId: item.id,
                                  decision: 'accept',
                                })
                              }
                              disabled={reviewMutation.isPending}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {t(
                                'accessManagement.campaignReview.acceptAction',
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-red-600 hover:bg-red-50"
                              onClick={() =>
                                reviewMutation.mutate({
                                  itemId: item.id,
                                  decision: 'revoke',
                                })
                              }
                              disabled={reviewMutation.isPending}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              {t(
                                'accessManagement.campaignReview.revokeAction',
                              )}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showUpload && accessService && (
        <CsvUploadDialog
          service={accessService}
          onClose={() => {
            setShowUpload(false);
            refreshMutation.mutate();
          }}
        />
      )}
    </div>
  );
}
