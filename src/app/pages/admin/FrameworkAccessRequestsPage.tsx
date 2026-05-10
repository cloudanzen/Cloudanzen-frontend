import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle2, XCircle, Wrench, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { useHasRole } from '@/hooks/useCurrentUser';
import { fmtDateTime } from '@/lib/format-date';
import {
  frameworksService,
  type FrameworkAccessRequestDto,
  type FrameworkGrantInconsistencyDto,
} from '@/services/api/frameworks';

type StatusFilter = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'ALL';

const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CANCELLED', label: 'Cancelled' },
  { key: 'ALL', label: 'All' },
];

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'PENDING'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : status === 'APPROVED'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : status === 'REJECTED'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-slate-100 text-slate-700 border-slate-200';
  return <Badge variant="outline" className={cls}>{status}</Badge>;
}

export function FrameworkAccessRequestsPage() {
  const isSuperAdmin = useHasRole('SUPER_ADMIN');
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [decisionTarget, setDecisionTarget] = useState<{
    request: FrameworkAccessRequestDto;
    action: 'approve' | 'reject';
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const requestsQuery = useQuery({
    queryKey: ['admin', 'framework-access-requests', statusFilter],
    queryFn: () => frameworksService.listFrameworkAccessRequests({ status: statusFilter }),
    enabled: isSuperAdmin,
  });

  const inconsistenciesQuery = useQuery({
    queryKey: ['admin', 'framework-grant-inconsistencies'],
    queryFn: () => frameworksService.listFrameworkGrantInconsistencies(),
    enabled: isSuperAdmin,
  });

  const decideMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      action: 'approve' | 'reject';
      note?: string;
    }) => {
      if (input.action === 'approve') {
        return frameworksService.approveFrameworkAccessRequest(input.id, input.note);
      }
      return frameworksService.rejectFrameworkAccessRequest(input.id, input.note);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin', 'framework-access-requests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'framework-grant-inconsistencies'] });
      toast.success(vars.action === 'approve' ? 'Request approved' : 'Request rejected');
      setDecisionTarget(null);
      setDecisionNote('');
    },
    onError: (err: unknown) => {
      const message = (err as { message?: string })?.message ?? 'Decision failed';
      toast.error(message);
    },
  });

  const repairMutation = useMutation({
    mutationFn: (input: { organizationId: string; frameworkSlug: string }) =>
      frameworksService.repairFrameworkGrant(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'framework-grant-inconsistencies'] });
      qc.invalidateQueries({ queryKey: ['admin', 'framework-access-requests'] });
      toast.success('Grant repaired');
    },
    onError: (err: unknown) => {
      const message = (err as { message?: string })?.message ?? 'Repair failed';
      toast.error(message);
    },
  });

  const requests = useMemo(() => requestsQuery.data?.data ?? [], [requestsQuery.data]);
  const inconsistencies = useMemo(
    () => inconsistenciesQuery.data?.data ?? [],
    [inconsistenciesQuery.data],
  );

  if (!isSuperAdmin) {
    return (
      <PageTemplate title="Framework Requests" description="SUPER_ADMIN access required.">
        <Card><CardContent className="p-6 text-sm text-muted-foreground">You do not have permission to view this page.</CardContent></Card>
      </PageTemplate>
    );
  }

  return (
    <PageTemplate
      title="Framework Requests"
      description="Review and act on customer requests for new frameworks. Surface and repair partial grants."
    >
      <div className="space-y-8">
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Filter className="h-4 w-4 text-muted-foreground" /> Access Requests
              </div>
              <div className="flex gap-1">
                {STATUS_CHIPS.map((chip) => (
                  <Button
                    key={chip.key}
                    type="button"
                    size="sm"
                    variant={statusFilter === chip.key ? 'default' : 'outline'}
                    onClick={() => setStatusFilter(chip.key)}
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>
            </div>

            {requestsQuery.isLoading ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">No requests in this filter.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Org</th>
                      <th className="py-2 pr-3">Framework</th>
                      <th className="py-2 pr-3">Requested by</th>
                      <th className="py-2 pr-3">Note</th>
                      <th className="py-2 pr-3">Submitted</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => (
                      <tr key={req.id} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 font-medium text-foreground">{req.organizationName ?? req.organizationId}</td>
                        <td className="py-2 pr-3">{req.frameworkName ?? req.frameworkSlug}</td>
                        <td className="py-2 pr-3">{req.requestedBy?.name ?? req.requestedBy?.email ?? req.requestedById}</td>
                        <td className="py-2 pr-3 max-w-xs truncate text-muted-foreground" title={req.note ?? undefined}>{req.note ?? '—'}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{fmtDateTime(req.createdAt)}</td>
                        <td className="py-2 pr-3"><StatusBadge status={req.status} /></td>
                        <td className="py-2 pr-3 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => { setDecisionTarget({ request: req, action: 'approve' }); setDecisionNote(''); }}>
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => { setDecisionTarget({ request: req, action: 'reject' }); setDecisionNote(''); }}>
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{req.decidedBy?.name ?? req.decidedBy?.email ?? '—'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Wrench className="h-4 w-4 text-muted-foreground" /> Grant Inconsistencies
            </div>
            {inconsistenciesQuery.isLoading ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : inconsistencies.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">All grants are consistent. Nothing to repair.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Org</th>
                      <th className="py-2 pr-3">Framework</th>
                      <th className="py-2 pr-3">Missing</th>
                      <th className="py-2 pr-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inconsistencies.map((row: FrameworkGrantInconsistencyDto) => (
                      <tr key={`${row.organizationId}-${row.frameworkSlug}`} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 font-medium text-foreground">{row.organizationName ?? row.organizationId}</td>
                        <td className="py-2 pr-3">{row.frameworkName}</td>
                        <td className="py-2 pr-3"><Badge variant="outline">{row.missing}</Badge></td>
                        <td className="py-2 pr-3 text-right">
                          <Button
                            size="sm"
                            disabled={repairMutation.isPending}
                            onClick={() => repairMutation.mutate({ organizationId: row.organizationId, frameworkSlug: row.frameworkSlug })}
                          >
                            <Wrench className="mr-1 h-3.5 w-3.5" /> Repair
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!decisionTarget} onOpenChange={(open) => { if (!open) { setDecisionTarget(null); setDecisionNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionTarget?.action === 'approve' ? 'Approve request' : 'Reject request'}</DialogTitle>
          </DialogHeader>
          {decisionTarget ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {decisionTarget.action === 'approve'
                  ? `Grant ${decisionTarget.request.frameworkName ?? decisionTarget.request.frameworkSlug} to ${decisionTarget.request.organizationName ?? decisionTarget.request.organizationId}? Allowlist + entitlement will be set; the customer activates separately.`
                  : `Reject the request for ${decisionTarget.request.frameworkName ?? decisionTarget.request.frameworkSlug}? The requester will be notified.`}
              </p>
              <Textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Optional note (visible to the requester)"
                rows={3}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDecisionTarget(null); setDecisionNote(''); }}>Cancel</Button>
            <Button
              disabled={decideMutation.isPending}
              onClick={() => decisionTarget && decideMutation.mutate({
                id: decisionTarget.request.id,
                action: decisionTarget.action,
                note: decisionNote.trim() ? decisionNote.trim() : undefined,
              })}
            >
              {decisionTarget?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
