/**
 * AiTraceDetailPage.tsx — AI TrustOps Agent Trails (trace detail).
 *
 * Route /ai-trust/agent-trails/:id. Shows a trace's attributes and its steps
 * as an ordered timeline (tool calls, policy decisions, human approvals,
 * retrievals, actions) with add / delete. Summaries are sanitized review
 * notes — not raw chain-of-thought.
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, ArrowLeft, ShieldAlert } from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
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
  AI_TRACE_STEP_TYPES,
  AI_STEP_OUTCOMES,
  aiAgentTrailsService,
  type AiTraceStepType,
  type AiStepOutcome,
} from '@/services/api/aiAgentTrails';
import { titleCase } from '@/lib/format';

const OUTCOME_COLORS: Record<AiStepOutcome, string> = {
  NA: 'bg-gray-50 text-gray-600 border-gray-200',
  ALLOWED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border-blue-200',
  DENIED: 'bg-rose-50 text-rose-700 border-rose-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  ERROR: 'bg-rose-50 text-rose-700 border-rose-200',
};

function Attr({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function StepDialog({
  traceId,
  open,
  onOpenChange,
}: {
  traceId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [stepType, setStepType] = useState<AiTraceStepType>('TOOL_CALL');
  const [outcome, setOutcome] = useState<AiStepOutcome>('COMPLETED');
  const [toolName, setToolName] = useState('');
  const [summary, setSummary] = useState('');
  const [sensitive, setSensitive] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      aiAgentTrailsService.addStep(traceId, {
        title: title.trim(),
        stepType,
        outcome,
        toolName: toolName.trim() || undefined,
        summary: summary.trim() || undefined,
        sensitiveDataAccessed: sensitive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiAgentTrace', traceId] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add step</DialogTitle>
          <DialogDescription>
            A tool call, policy decision, human approval, retrieval, or action.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="s-title">Title</Label>
            <Input
              id="s-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Called refund_tool"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={stepType}
                onValueChange={(v) => setStepType(v as AiTraceStepType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_TRACE_STEP_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {titleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Outcome</Label>
              <Select
                value={outcome}
                onValueChange={(v) => setOutcome(v as AiStepOutcome)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_STEP_OUTCOMES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {titleCase(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="s-tool">Tool name (optional)</Label>
            <Input
              id="s-tool"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="refund_tool"
            />
          </div>
          <div>
            <Label htmlFor="s-summary">Summary</Label>
            <Textarea
              id="s-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Sanitized review note — no chain-of-thought."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={sensitive} onCheckedChange={setSensitive} />
            Accessed sensitive data
          </label>
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
            disabled={title.trim().length === 0 || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add step'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AiTraceDetailPage() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [stepDialog, setStepDialog] = useState(false);

  const { data: trace, isLoading } = useQuery({
    queryKey: ['aiAgentTrace', id],
    queryFn: () => aiAgentTrailsService.getTrace(id),
    enabled: id.length > 0,
  });

  const delStep = useMutation({
    mutationFn: (stepId: string) => aiAgentTrailsService.removeStep(stepId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aiAgentTrace', id] }),
  });

  return (
    <PageTemplate
      title={trace?.agentName ?? 'Agent trace'}
      description="Sanitized execution and decision trace."
      actions={
        <Button asChild variant="outline">
          <Link to="/ai-trust/agent-trails">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to trails
          </Link>
        </Button>
      }
    >
      {isLoading || !trace ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="p-5">
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Attr label="Session" value={trace.sessionRef} />
              <Attr label="Status" value={titleCase(trace.status)} />
              <Attr label="User identity" value={trace.userIdentity || '—'} />
              <Attr label="Agent identity" value={trace.agentIdentity || '—'} />
              <Attr
                label="Model / provider"
                value={
                  [trace.model, trace.provider].filter(Boolean).join(' · ') ||
                  '—'
                }
              />
              <Attr label="Final action" value={trace.finalAction || '—'} />
              <Attr label="Related risk" value={trace.relatedRiskId || '—'} />
              <Attr
                label="Related incident"
                value={trace.relatedIncidentId || '—'}
              />
            </dl>
          </Card>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Steps</h2>
              <Button size="sm" onClick={() => setStepDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add step
              </Button>
            </div>
            {(trace.steps ?? []).length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No steps recorded. Add tool calls, policy decisions, and human
                approvals.
              </Card>
            ) : (
              <Card>
                <div className="divide-y">
                  {(trace.steps ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between px-4 py-3 gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">
                            #{s.stepIndex}
                          </span>
                          <p className="text-sm font-medium truncate">
                            {s.title}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {titleCase(s.stepType)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={OUTCOME_COLORS[s.outcome]}
                          >
                            {titleCase(s.outcome)}
                          </Badge>
                          {s.sensitiveDataAccessed ? (
                            <Badge
                              variant="outline"
                              className="text-xs text-rose-700 border-rose-200"
                            >
                              <ShieldAlert className="h-3 w-3 mr-1" />
                              Sensitive
                            </Badge>
                          ) : null}
                        </div>
                        {s.toolName ? (
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                            {s.toolName}
                          </p>
                        ) : null}
                        {s.summary ? (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.summary}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => delStep.mutate(s.id)}
                        aria-label="Delete step"
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {stepDialog ? (
        <StepDialog
          traceId={id}
          open={stepDialog}
          onOpenChange={setStepDialog}
        />
      ) : null}
    </PageTemplate>
  );
}
