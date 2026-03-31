import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  const { data: campaign } = useQuery({
    queryKey: ['access-campaign', campaignId],
    queryFn: () => accessManagementService.getCampaign(campaignId),
  });

  const { data: itemsData, isLoading } = useQuery({
    queryKey: ['access-campaign-items', campaignId, search, decisionFilter, page],
    queryFn: () =>
      accessManagementService.listReviewItems(campaignId, {
        search: search || undefined,
        decision: decisionFilter !== 'all' ? decisionFilter : undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ itemId, decision }: { itemId: string; decision: 'accept' | 'revoke' }) =>
      accessManagementService.reviewItem(campaignId, itemId, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-campaign-items', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['access-campaign', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['access-campaigns'] });
    },
  });

  const items = itemsData?.rows ?? [];
  const total = itemsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const prog = campaign?.progress;
  const pct = prog && prog.total > 0 ? Math.round((prog.reviewed / prog.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-lg font-medium">{campaign?.name ?? 'Campaign Review'}</h2>
          {campaign?.description && (
            <p className="text-xs text-muted-foreground">{campaign.description}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      {prog && (
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-sm font-medium">Progress: {pct}%</span>
            <span className="text-xs text-muted-foreground">
              {prog.reviewed}/{prog.total} reviewed
            </span>
            <span className="text-xs text-green-600">{prog.accepted} accepted</span>
            <span className="text-xs text-red-600">{prog.revoked} revoked</span>
            <span className="text-xs text-muted-foreground">{prog.pending} pending</span>
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
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>

        <Select value={decisionFilter} onValueChange={(v) => { setDecisionFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accept">Accepted</SelectItem>
            <SelectItem value="revoke">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Service</th>
                <th className="text-left p-3 font-medium">Account</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Email</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Role</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Decision</th>
                <th className="text-left p-3 font-medium w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading review items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No items match your filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{item.snapshotServiceName}</Badge>
                    </td>
                    <td className="p-3 font-medium">{item.snapshotAccountName}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {item.snapshotAccountEmail ?? '—'}
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {item.snapshotRole ?? '—'}
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={item.snapshotStatus === 'active' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {item.snapshotStatus ?? 'unknown'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {item.decision === 'accept' && (
                        <Badge className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" variant="outline">
                          Accepted
                        </Badge>
                      )}
                      {item.decision === 'revoke' && (
                        <Badge variant="destructive" className="text-xs">Revoked</Badge>
                      )}
                      {!item.decision && (
                        <span className="text-xs text-amber-600">Pending</span>
                      )}
                    </td>
                    <td className="p-3">
                      {!item.decision && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-green-600 hover:bg-green-50"
                            onClick={() => reviewMutation.mutate({ itemId: item.id, decision: 'accept' })}
                            disabled={reviewMutation.isPending}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-600 hover:bg-red-50"
                            onClick={() => reviewMutation.mutate({ itemId: item.id, decision: 'revoke' })}
                            disabled={reviewMutation.isPending}
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Revoke
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
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
