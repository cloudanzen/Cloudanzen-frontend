/**
 * AiRuntimePage.tsx — AI Runtime Risk Monitor (slice 1).
 *
 * Route /ai-trust/runtime. Two sections: eval runs (pass/warn/fail history)
 * and runtime findings (threshold violations, drift, prompt injection, etc.).
 * Manual add + delete; findings can be resolved. Feeds the dashboard
 * runtimeRisk (latest eval status) + driftThreshold (open findings) cards.
 *
 * Ingestion (POST .../upsert) is API-only for now; manual entry here covers
 * the demo + reviewed-incident path.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  Activity,
  AlertTriangle,
} from 'lucide-react';

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
  AI_EVAL_TYPES,
  AI_EVAL_STATUSES,
  AI_FINDING_TYPES,
  AI_FINDING_SEVERITIES,
  aiRuntimeService,
  type AiEvalType,
  type AiEvalStatus,
  type AiRuntimeFindingType,
  type AiFindingSeverity,
} from '@/services/api/aiRuntime';
import {
  MetricsSection,
  ThresholdsSection,
  ModelEventsSection,
} from './AiRuntimeConfigSections';

const titleCase = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

const EVAL_STATUS_COLORS: Record<AiEvalStatus, string> = {
  PASSED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WARN: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const SEVERITY_COLORS: Record<AiFindingSeverity, string> = {
  LOW: 'bg-gray-50 text-gray-600 border-gray-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
};

function EvalRunDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [evalType, setEvalType] = useState<AiEvalType>('QUALITY');
  const [status, setStatus] = useState<AiEvalStatus>('PASSED');
  const [environment, setEnvironment] = useState('production');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      aiRuntimeService.createEvalRun({
        name: name.trim(),
        evalType,
        status,
        environment: environment.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiEvalRuns'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add eval run</DialogTitle>
          <DialogDescription>
            Record the outcome of an evaluation run for an AI system.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="er-name">Name</Label>
            <Input
              id="er-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nightly hallucination suite"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={evalType}
                onValueChange={(v) => setEvalType(v as AiEvalType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_EVAL_TYPES.map((t) => (
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
                onValueChange={(v) => setStatus(v as AiEvalStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_EVAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="er-env">Environment</Label>
            <Input
              id="er-env"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="production"
            />
          </div>
          <div>
            <Label htmlFor="er-notes">Notes</Label>
            <Textarea
              id="er-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              'Add eval run'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FindingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [findingType, setFindingType] = useState<AiRuntimeFindingType>(
    'THRESHOLD_VIOLATION',
  );
  const [severity, setSeverity] = useState<AiFindingSeverity>('MEDIUM');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      aiRuntimeService.createFinding({
        title: title.trim(),
        findingType,
        severity,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRuntimeFindings'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add runtime finding</DialogTitle>
          <DialogDescription>
            A threshold violation, drift, injection, or override observed at
            runtime.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="f-title">Title</Label>
            <Input
              id="f-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hallucination rate above 5% threshold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={findingType}
                onValueChange={(v) => setFindingType(v as AiRuntimeFindingType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_FINDING_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {titleCase(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severity</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as AiFindingSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_FINDING_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="f-desc">Description</Label>
            <Textarea
              id="f-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
            disabled={title.trim().length === 0 || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Add finding'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AiRuntimePage() {
  const qc = useQueryClient();
  const [evalDialog, setEvalDialog] = useState(false);
  const [findingDialog, setFindingDialog] = useState(false);

  const invalidateDash = () =>
    qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });

  const { data: evalRuns, isLoading: evalLoading } = useQuery({
    queryKey: ['aiEvalRuns'],
    queryFn: () => aiRuntimeService.listEvalRuns(),
  });
  const { data: findings, isLoading: findingLoading } = useQuery({
    queryKey: ['aiRuntimeFindings'],
    queryFn: () => aiRuntimeService.listFindings(),
  });

  const deleteEval = useMutation({
    mutationFn: (id: string) => aiRuntimeService.removeEvalRun(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiEvalRuns'] });
      invalidateDash();
    },
  });
  const resolveFinding = useMutation({
    mutationFn: (id: string) => aiRuntimeService.resolveFinding(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRuntimeFindings'] });
      invalidateDash();
    },
  });
  const deleteFinding = useMutation({
    mutationFn: (id: string) => aiRuntimeService.removeFinding(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRuntimeFindings'] });
      invalidateDash();
    },
  });

  return (
    <PageTemplate
      title="Runtime Risk Monitor"
      description="Eval results and runtime findings for your AI systems — connect an eval source or add results manually."
    >
      <div className="space-y-6">
        {/* Eval runs */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Eval runs
            </h2>
            <Button size="sm" onClick={() => setEvalDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add eval run
            </Button>
          </div>
          {evalLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (evalRuns ?? []).length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No eval runs yet. Connect eval results or add a run to start
              tracking pass/fail history.
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {(evalRuns ?? []).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3 gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <Badge
                          variant="outline"
                          className={EVAL_STATUS_COLORS[r.status]}
                        >
                          {titleCase(r.status)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {titleCase(r.evalType)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {[r.environment, new Date(r.runAt).toLocaleString()]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEval.mutate(r.id)}
                      aria-label="Delete eval run"
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        {/* Findings */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Runtime findings
            </h2>
            <Button size="sm" onClick={() => setFindingDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add finding
            </Button>
          </div>
          {findingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (findings ?? []).length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No runtime findings. Threshold violations, drift, and injection
              events will show here.
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {(findings ?? []).map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between px-4 py-3 gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            f.status === 'RESOLVED'
                              ? 'text-muted-foreground line-through'
                              : ''
                          }`}
                        >
                          {f.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={SEVERITY_COLORS[f.severity]}
                        >
                          {titleCase(f.severity)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {titleCase(f.findingType)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {f.status === 'OPEN' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-700"
                          onClick={() => resolveFinding.mutate(f.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Resolved
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteFinding.mutate(f.id)}
                        aria-label="Delete finding"
                      >
                        <Trash2 className="h-4 w-4 text-rose-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        <MetricsSection />
        <ThresholdsSection />
        <ModelEventsSection />
      </div>

      {evalDialog ? (
        <EvalRunDialog open={evalDialog} onOpenChange={setEvalDialog} />
      ) : null}
      {findingDialog ? (
        <FindingDialog open={findingDialog} onOpenChange={setFindingDialog} />
      ) : null}
    </PageTemplate>
  );
}
