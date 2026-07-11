/**
 * AiSystemDetailPage.tsx — AI Systems Registry detail (Phase 4 slice 2).
 *
 * Route /ai-trust/systems/:id. Shows one system's attributes plus its
 * use cases, with add / delete for use cases. The BE getAiSystem already
 * includes useCases; mutations refetch the detail query.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, ArrowLeft, Check, X } from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  AI_RISK_TIERS,
  AI_USE_CASE_STATUSES,
  aiSystemsService,
  type AiRiskTier,
  type AiUseCaseStatus,
} from '@/services/api/aiSystems';
import { titleCase } from '@/lib/format';
import { RISK_TIER_COLORS } from '@/lib/statusColors';

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function UseCaseDialog({
  systemId,
  open,
  onOpenChange,
}: {
  systemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [riskTier, setRiskTier] = useState<AiRiskTier>('LIMITED');
  const [status, setStatus] = useState<AiUseCaseStatus>('PROPOSED');

  const mutation = useMutation({
    mutationFn: () =>
      aiSystemsService.createUseCase(systemId, {
        name: name.trim(),
        description: description.trim() || undefined,
        purpose: purpose.trim() || undefined,
        riskTier,
        status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiSystem', systemId] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add use case</DialogTitle>
          <DialogDescription>
            A specific application of this AI system, with its own risk tier and
            approval status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="uc-name">Name</Label>
            <Input
              id="uc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Auto-draft support replies"
            />
          </div>
          <div>
            <Label htmlFor="uc-purpose">Purpose</Label>
            <Input
              id="uc-purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Why this use case exists"
            />
          </div>
          <div>
            <Label htmlFor="uc-desc">Description</Label>
            <Textarea
              id="uc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Risk tier</Label>
              <Select
                value={riskTier}
                onValueChange={(v) => setRiskTier(v as AiRiskTier)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_RISK_TIERS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {titleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AiUseCaseStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_USE_CASE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {mutation.isError ? (
            <p className="text-sm text-red-600">
              {(mutation.error as Error)?.message ?? 'Save failed'}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={name.trim().length === 0 || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add use case'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AiSystemDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [ucDialogOpen, setUcDialogOpen] = useState(false);

  const { data: system, isLoading } = useQuery({
    queryKey: ['aiSystem', id],
    queryFn: () => aiSystemsService.get(id),
    enabled: id.length > 0,
  });

  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['aiSystem', id] });
    qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
  };

  const deleteUseCase = useMutation({
    mutationFn: (useCaseId: string) =>
      aiSystemsService.removeUseCase(useCaseId),
    onSuccess: invalidate,
  });

  const decide = useMutation({
    mutationFn: (v: {
      useCaseId: string;
      decision: 'APPROVED' | 'REJECTED';
      reason?: string;
    }) => aiSystemsService.decideUseCase(v.useCaseId, v.decision, v.reason),
    onSuccess: () => {
      invalidate();
      setRejecting(null);
      setRejectReason('');
    },
  });

  return (
    <PageTemplate
      title={system?.name ?? 'AI system'}
      description="AI system detail and its use cases."
      actions={
        <Button asChild variant="outline">
          <Link to="/ai-trust/systems">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to registry
          </Link>
        </Button>
      }
    >
      {isLoading || !system ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className={RISK_TIER_COLORS[system.riskTier]}
              >
                {titleCase(system.riskTier)}
              </Badge>
              <Badge variant="outline">
                {titleCase(system.lifecycleStage)}
              </Badge>
              {system.customerFacing ? (
                <Badge variant="outline">Customer-facing</Badge>
              ) : null}
            </div>
            {system.description ? (
              <p className="text-sm text-muted-foreground mb-4">
                {system.description}
              </p>
            ) : null}
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Attr label="Product area" value={system.productArea || '—'} />
              <Attr
                label="Model provider"
                value={system.modelProvider || '—'}
              />
              <Attr
                label="Data exposure"
                value={titleCase(system.customerDataExposure)}
              />
              <Attr
                label="Human oversight"
                value={titleCase(system.humanOversight)}
              />
              <Attr label="Uses RAG" value={system.ragUsage ? 'Yes' : 'No'} />
              <Attr
                label="Fine-tuned"
                value={system.fineTuned ? 'Yes' : 'No'}
              />
            </dl>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Use cases</h2>
              <Button size="sm" onClick={() => setUcDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add use case
              </Button>
            </div>
            {(system.useCases ?? []).length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No use cases yet. Add the specific applications of this system.
              </Card>
            ) : (
              <Card>
                <div className="divide-y">
                  {(system.useCases ?? []).map((uc) => (
                    <div
                      key={uc.id}
                      className="flex items-center justify-between px-4 py-3 gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {uc.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={RISK_TIER_COLORS[uc.riskTier]}
                          >
                            {titleCase(uc.riskTier)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {titleCase(uc.status)}
                          </Badge>
                        </div>
                        {uc.purpose ? (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {uc.purpose}
                          </p>
                        ) : null}
                        {uc.status !== 'PROPOSED' && uc.decisionReason ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {titleCase(uc.status)}: {uc.decisionReason}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {uc.status === 'PROPOSED' ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700"
                              disabled={decide.isPending}
                              onClick={() =>
                                decide.mutate({
                                  useCaseId: uc.id,
                                  decision: 'APPROVED',
                                })
                              }
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-700"
                              onClick={() => setRejecting(uc.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteUseCase.mutate(uc.id)}
                          aria-label="Delete use case"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {ucDialogOpen ? (
        <UseCaseDialog
          systemId={id}
          open={ucDialogOpen}
          onOpenChange={setUcDialogOpen}
        />
      ) : null}

      <Dialog
        open={rejecting !== null}
        onOpenChange={(o) => {
          if (!o) {
            setRejecting(null);
            setRejectReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject use case</DialogTitle>
            <DialogDescription>
              Record why this use case is rejected. The reason is stored on the
              audit trail.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejecting(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700"
              disabled={decide.isPending}
              onClick={() =>
                rejecting &&
                decide.mutate({
                  useCaseId: rejecting,
                  decision: 'REJECTED',
                  reason: rejectReason.trim() || undefined,
                })
              }
            >
              {decide.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTemplate>
  );
}
