import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Plus, Play, CheckCircle2, Download } from 'lucide-react';
import {
  accessManagementService,
  type AccessReviewCampaign,
} from '@/services/api/access-management';
import { CampaignCreateDialog } from './CampaignCreateDialog';
import { CampaignReviewPage } from './CampaignReviewPage';

const statusColors: Record<string, string> = {
  draft: 'secondary',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
};

export function CampaignListPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [reviewCampaignId, setReviewCampaignId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['access-campaigns'],
    queryFn: () => accessManagementService.listCampaigns(),
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => accessManagementService.launchCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-campaigns'] }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => accessManagementService.completeCampaign(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['access-campaigns'] }),
  });

  const safeCampaigns: AccessReviewCampaign[] = Array.isArray(campaigns) ? campaigns : [];

  // If reviewing a campaign, show the review page
  if (reviewCampaignId) {
    return (
      <CampaignReviewPage
        campaignId={reviewCampaignId}
        onBack={() => setReviewCampaignId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create access review campaigns to periodically verify that all accounts are legitimate and properly authorized.
        </p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground p-4">Loading campaigns...</div>
      ) : safeCampaigns.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>No access review campaigns yet.</p>
          <p className="text-sm mt-1">Create one to start reviewing account access across your services.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {safeCampaigns.map((c) => {
            const prog = c.progress;
            const pct = prog && prog.total > 0 ? Math.round((prog.reviewed / prog.total) * 100) : 0;
            return (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm truncate">{c.name}</h3>
                      <Badge
                        variant={statusColors[c.status] as 'default' | 'secondary' | 'outline' | 'destructive'}
                        className="text-xs"
                      >
                        {c.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {c.description && (
                      <p className="text-xs text-muted-foreground mb-2">{c.description}</p>
                    )}
                    {prog && (
                      <div className="space-y-1">
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span>{prog.total} accounts</span>
                          <span>{prog.reviewed} reviewed</span>
                          <span className="text-green-600">{prog.accepted} accepted</span>
                          <span className="text-red-600">{prog.revoked} revoked</span>
                          <span>{prog.pending} pending</span>
                        </div>
                        {c.status === 'in_progress' && (
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary rounded-full h-1.5 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                      {c.deadline && <span>Deadline: {new Date(c.deadline).toLocaleDateString()}</span>}
                      {c.cadence && <span>Cadence: {c.cadence.replace('_', ' ')}</span>}
                      {c.nextReviewAt && <span>Next review: {new Date(c.nextReviewAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {c.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => launchMutation.mutate(c.id)}
                        disabled={launchMutation.isPending}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Launch
                      </Button>
                    )}
                    {c.status === 'in_progress' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewCampaignId(c.id)}
                        >
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => completeMutation.mutate(c.id)}
                          disabled={completeMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      </>
                    )}
                    {c.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = accessManagementService.getReportUrl(c.id);
                          window.open(url, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Report
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CampaignCreateDialog onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}
