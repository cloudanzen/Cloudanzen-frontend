/**
 * AiRuntimeConfigSections.tsx — Runtime Risk Monitor slice 2 UI.
 *
 * Three sections rendered under the eval-runs / findings sections on the
 * runtime page: metrics (timeseries points), thresholds (config), and model
 * version events (change log). A metric that breaches an enabled threshold
 * raises a finding server-side, so posting a metric can surface a new finding.
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Plus,
  Trash2,
  Gauge,
  SlidersHorizontal,
  GitCommit,
} from 'lucide-react';

import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
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
  AI_THRESHOLD_COMPARATORS,
  AI_FINDING_SEVERITIES,
  AI_MODEL_CHANGE_TYPES,
  aiRuntimeService,
  type AiThresholdComparator,
  type AiFindingSeverity,
  type AiModelChangeType,
} from '@/services/api/aiRuntime';
import { titleCase } from '@/lib/format';
import { SEVERITY_COLORS } from '@/lib/statusColors';

const COMPARATOR_LABEL: Record<AiThresholdComparator, string> = {
  GT: '>',
  GTE: '≥',
  LT: '<',
  LTE: '≤',
};

function SectionHeader({
  icon: Icon,
  title,
  onAdd,
}: {
  icon: typeof Gauge;
  title: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {title}
      </h2>
      <Button size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add
      </Button>
    </div>
  );
}

// ── Metrics ─────────────────────────────────────────────────────────────────

function MetricDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [metricKey, setMetricKey] = useState('');
  const [value, setValue] = useState('');
  const [environment, setEnvironment] = useState('production');

  const mutation = useMutation({
    mutationFn: () =>
      aiRuntimeService.createMetric({
        metricKey: metricKey.trim(),
        value: Number(value),
        environment: environment.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRuntimeMetrics'] });
      // A breach raises a finding, so refresh findings + dashboard too.
      qc.invalidateQueries({ queryKey: ['aiRuntimeFindings'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  const valid =
    metricKey.trim().length > 0 &&
    value.trim() !== '' &&
    !Number.isNaN(Number(value));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record metric</DialogTitle>
          <DialogDescription>
            A runtime metric point. If it breaches an enabled threshold, a
            finding is raised automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="m-key">Metric key</Label>
            <Input
              id="m-key"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              placeholder="hallucination_rate"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="m-value">Value</Label>
              <Input
                id="m-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.09"
              />
            </div>
            <div>
              <Label htmlFor="m-env">Environment</Label>
              <Input
                id="m-env"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
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
              'Record'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MetricsSection() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['aiRuntimeMetrics'],
    queryFn: () => aiRuntimeService.listMetrics(),
  });
  const del = useMutation({
    mutationFn: (id: string) => aiRuntimeService.removeMetric(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aiRuntimeMetrics'] }),
  });

  return (
    <section>
      <SectionHeader icon={Gauge} title="Metrics" onAdd={() => setOpen(true)} />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No metrics yet. Record drift, hallucination, fallback, or override
          rates — or push them via the API.
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {(data ?? []).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.metricKey}: <span className="font-mono">{m.value}</span>
                    {m.unit ? ` ${m.unit}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {[m.environment, new Date(m.recordedAt).toLocaleString()]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => del.mutate(m.id)}
                  aria-label="Delete metric"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      {open ? <MetricDialog open={open} onOpenChange={setOpen} /> : null}
    </section>
  );
}

// ── Thresholds ────────────────────────────────────────────────────────────

function ThresholdDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [metricKey, setMetricKey] = useState('');
  const [comparator, setComparator] = useState<AiThresholdComparator>('GT');
  const [thresholdValue, setThresholdValue] = useState('');
  const [severity, setSeverity] = useState<AiFindingSeverity>('MEDIUM');

  const mutation = useMutation({
    mutationFn: () =>
      aiRuntimeService.createThreshold({
        metricKey: metricKey.trim(),
        comparator,
        thresholdValue: Number(thresholdValue),
        severity,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRiskThresholds'] });
      onOpenChange(false);
    },
  });

  const valid =
    metricKey.trim().length > 0 &&
    thresholdValue.trim() !== '' &&
    !Number.isNaN(Number(thresholdValue));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add threshold</DialogTitle>
          <DialogDescription>
            When a metric with this key breaches the value, a finding is raised
            at the given severity.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t-key">Metric key</Label>
            <Input
              id="t-key"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              placeholder="hallucination_rate"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Comparator</Label>
              <Select
                value={comparator}
                onValueChange={(v) => setComparator(v as AiThresholdComparator)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_THRESHOLD_COMPARATORS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {COMPARATOR_LABEL[c]} ({c})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="t-val">Value</Label>
              <Input
                id="t-val"
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                placeholder="0.05"
              />
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
              'Add threshold'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ThresholdsSection() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['aiRiskThresholds'],
    queryFn: () => aiRuntimeService.listThresholds(),
  });
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['aiRiskThresholds'] });
  const toggle = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) =>
      aiRuntimeService.updateThreshold(v.id, { enabled: v.enabled }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: (id: string) => aiRuntimeService.removeThreshold(id),
    onSuccess: invalidate,
  });

  return (
    <section>
      <SectionHeader
        icon={SlidersHorizontal}
        title="Thresholds"
        onAdd={() => setOpen(true)}
      />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No thresholds. Define limits so breaching metrics raise findings
          automatically.
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {(data ?? []).map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {t.metricKey}{' '}
                      <span className="font-mono">
                        {COMPARATOR_LABEL[t.comparator]} {t.thresholdValue}
                      </span>
                    </p>
                    <Badge
                      variant="outline"
                      className={SEVERITY_COLORS[t.severity]}
                    >
                      {titleCase(t.severity)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={(v) =>
                        toggle.mutate({ id: t.id, enabled: v })
                      }
                    />
                    {t.enabled ? 'On' : 'Off'}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => del.mutate(t.id)}
                    aria-label="Delete threshold"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {open ? <ThresholdDialog open={open} onOpenChange={setOpen} /> : null}
    </section>
  );
}

// ── Model version events ────────────────────────────────────────────────────

function ModelEventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [modelName, setModelName] = useState('');
  const [toVersion, setToVersion] = useState('');
  const [fromVersion, setFromVersion] = useState('');
  const [changeType, setChangeType] = useState<AiModelChangeType>('DEPLOY');

  const mutation = useMutation({
    mutationFn: () =>
      aiRuntimeService.createModelEvent({
        modelName: modelName.trim(),
        toVersion: toVersion.trim(),
        fromVersion: fromVersion.trim() || undefined,
        changeType,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiModelEvents'] });
      onOpenChange(false);
    },
  });

  const valid = modelName.trim().length > 0 && toVersion.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log model change</DialogTitle>
          <DialogDescription>
            Record a model or version change for the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="mv-name">Model name</Label>
            <Input
              id="mv-name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="support-copilot"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mv-from">From version</Label>
              <Input
                id="mv-from"
                value={fromVersion}
                onChange={(e) => setFromVersion(e.target.value)}
                placeholder="gpt-4o-2024"
              />
            </div>
            <div>
              <Label htmlFor="mv-to">To version</Label>
              <Input
                id="mv-to"
                value={toVersion}
                onChange={(e) => setToVersion(e.target.value)}
                placeholder="gpt-4o-2025"
              />
            </div>
          </div>
          <div>
            <Label>Change type</Label>
            <Select
              value={changeType}
              onValueChange={(v) => setChangeType(v as AiModelChangeType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODEL_CHANGE_TYPES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {titleCase(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              'Log change'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModelEventsSection() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['aiModelEvents'],
    queryFn: () => aiRuntimeService.listModelEvents(),
  });
  const del = useMutation({
    mutationFn: (id: string) => aiRuntimeService.removeModelEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aiModelEvents'] }),
  });

  return (
    <section>
      <SectionHeader
        icon={GitCommit}
        title="Model changes"
        onAdd={() => setOpen(true)}
      />
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No model changes logged. Track deploys, rollbacks, and retrains.
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {(data ?? []).map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {e.modelName}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {titleCase(e.changeType)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {[
                      [e.fromVersion, e.toVersion].filter(Boolean).join(' → '),
                      new Date(e.occurredAt).toLocaleString(),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => del.mutate(e.id)}
                  aria-label="Delete model event"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
      {open ? <ModelEventDialog open={open} onOpenChange={setOpen} /> : null}
    </section>
  );
}
