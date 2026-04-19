import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { accessManagementService } from '@/services/api/access-management';

const PAGE_SIZE = 50;

interface Props {
  campaignId: string;
  onBack: () => void;
}

export function CampaignReviewPage({ campaignId, onBack }: Props) {
  const { t } = useTranslation('personnel');
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const { data: campaign } = useQuery({
    queryKey: ['access-campaign', campaignId],
    queryFn: () => accessManagementService.getCampaign(campaignId),
  });

  const { data: itemsData, isLoading } = useQuery({
    queryKey: [
      'access-campaign-items',
      campaignId,
      search,
      decisionFilter,
      page,
    ],
    queryFn: () =>
      accessManagementService.listReviewItems(campaignId, {
        search: search || undefined,
        decision: decisionFilter !== 'all' ? decisionFilter : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
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
        queryKey: ['access-campaign', campaignId],
      });
      queryClient.invalidateQueries({ queryKey: ['access-campaigns'] });
    },
  });

  const items = itemsData?.rows ?? [];
  const total = itemsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const prog = campaign?.progress;
  const pct =
    prog && prog.total > 0 ? Math.round((prog.reviewed / prog.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Progress */}
      {prog && (
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium">
              {t('accessManagement.campaignReview.progress', { percent: pct })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('accessManagement.campaignReview.reviewed', {
                reviewed: prog.reviewed,
                total: prog.total,
              })}
            </span>
            <span className="text-xs text-green-600">
              {t('accessManagement.campaignReview.accepted', {
                count: prog.accepted,
              })}
            </span>
            <span className="text-xs text-red-600">
              {t('accessManagement.campaignReview.revoked', {
                count: prog.revoked,
              })}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('accessManagement.campaignReview.pending', {
                count: prog.pending,
              })}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('accessManagement.campaignReview.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={decisionFilter}
          onValueChange={(v) => {
            setDecisionFilter(v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue
              placeholder={t('accessManagement.campaignReview.filters.all')}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('accessManagement.campaignReview.filters.all')}
            </SelectItem>
            <SelectItem value="pending">
              {t('accessManagement.campaignReview.filters.pending')}
            </SelectItem>
            <SelectItem value="accept">
              {t('accessManagement.campaignReview.filters.accepted')}
            </SelectItem>
            <SelectItem value="revoke">
              {t('accessManagement.campaignReview.filters.revoked')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">
                  {t('accessManagement.campaignReview.columns.service')}
                </th>
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
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {t('accessManagement.campaignReview.loading')}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
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
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {item.snapshotServiceName}
                      </Badge>
                    </td>
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
                          className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                          variant="outline"
                        >
                          {t('accessManagement.campaignReview.acceptDecision')}
                        </Badge>
                      )}
                      {item.decision === 'revoke' && (
                        <Badge variant="destructive" className="text-xs">
                          {t('accessManagement.campaignReview.revokeDecision')}
                        </Badge>
                      )}
                      {!item.decision && (
                        <span className="text-xs text-amber-600">
                          {t('accessManagement.campaignReview.pendingDecision')}
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
                            {t('accessManagement.campaignReview.acceptAction')}
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
                            {t('accessManagement.campaignReview.revokeAction')}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t">
            <span className="text-xs text-muted-foreground">
              {t('accessManagement.campaignReview.showing', {
                start: page * PAGE_SIZE + 1,
                end: Math.min((page + 1) * PAGE_SIZE, total),
                total,
              })}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
