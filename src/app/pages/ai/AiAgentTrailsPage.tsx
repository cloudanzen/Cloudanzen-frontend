/**
 * AiAgentTrailsPage.tsx — AI TrustOps Agent Trails (list).
 *
 * Route /ai-trust/agent-trails. Lists sanitized agent execution/decision
 * traces; create a trace or open one to review its steps. Feeds the dashboard
 * agentTraceCoverage card.
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Route as RouteIcon } from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
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
  AI_TRACE_STATUSES,
  aiAgentTrailsService,
  type AiAgentTrace,
  type AiTraceStatus,
} from '@/services/api/aiAgentTrails';
import { titleCase } from '@/lib/format';

const STATUS_COLORS: Record<AiTraceStatus, string> = {
  OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BLOCKED: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

function TraceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [sessionRef, setSessionRef] = useState('');
  const [agentName, setAgentName] = useState('');
  const [userIdentity, setUserIdentity] = useState('');
  const [model, setModel] = useState('');
  const [status, setStatus] = useState<AiTraceStatus>('COMPLETED');
  const [finalAction, setFinalAction] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      aiAgentTrailsService.createTrace({
        sessionRef: sessionRef.trim(),
        agentName: agentName.trim(),
        userIdentity: userIdentity.trim() || undefined,
        model: model.trim() || undefined,
        status,
        finalAction: finalAction.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiAgentTraces'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  const valid = sessionRef.trim().length > 0 && agentName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New agent trace</DialogTitle>
          <DialogDescription>
            A sanitized record of an agent session for review — not raw
            chain-of-thought.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t-session">Session ref</Label>
              <Input
                id="t-session"
                value={sessionRef}
                onChange={(e) => setSessionRef(e.target.value)}
                placeholder="sess_2026_07_06_123"
              />
            </div>
            <div>
              <Label htmlFor="t-agent">Agent name</Label>
              <Input
                id="t-agent"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="support-copilot"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="t-user">User identity</Label>
              <Input
                id="t-user"
                value={userIdentity}
                onChange={(e) => setUserIdentity(e.target.value)}
                placeholder="user_ab12 (pseudonymous)"
              />
            </div>
            <div>
              <Label htmlFor="t-model">Model</Label>
              <Input
                id="t-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AiTraceStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_TRACE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="t-final">Final action</Label>
              <Input
                id="t-final"
                value={finalAction}
                onChange={(e) => setFinalAction(e.target.value)}
                placeholder="Sent refund email"
              />
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
            disabled={!valid || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Create'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AiAgentTrailsPage() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['aiAgentTraces'],
    queryFn: () => aiAgentTrailsService.listTraces(),
  });
  const del = useMutation({
    mutationFn: (id: string) => aiAgentTrailsService.removeTrace(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiAgentTraces'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
    },
  });

  return (
    <PageTemplate
      title="Agent Trails"
      description="Sanitized agent execution and decision traces for review and incident investigation."
      actions={
        <Button onClick={() => setDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New trace
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="p-8 text-center">
          <RouteIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No agent traces yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Send agent execution traces via the API, or create a trace summary
            for a reviewed incident.
          </p>
          <Button className="mt-4" onClick={() => setDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New trace
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {(data ?? []).map((t: AiAgentTrace) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/ai-trust/agent-trails/${t.id}`}
                      className="text-sm font-medium truncate hover:underline"
                    >
                      {t.agentName}
                    </Link>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[t.status]}
                    >
                      {titleCase(t.status)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {t._count?.steps ?? 0} steps
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {[t.sessionRef, t.userIdentity, t.model]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => del.mutate(t.id)}
                  aria-label="Delete trace"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {dialog ? <TraceDialog open={dialog} onOpenChange={setDialog} /> : null}
    </PageTemplate>
  );
}
