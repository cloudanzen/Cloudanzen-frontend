/**
 * AiRuntimeConfigSections.tsx — Runtime Risk Monitor slice 2 UI.
 *
 * Three sections rendered under the eval-runs / findings sections on the
 * runtime page: metrics (timeseries points), thresholds (config), and model
 * version events (change log). A metric that breaches an enabled threshold
 * raises a finding server-side, so posting a metric can surface a new finding.
 */

import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('ai');

  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {title}
      </h2>
      <Button size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        {t('runtimeConfig.add')}
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
  const { t } = useTranslation('ai');
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
          <DialogTitle>{t('runtimeConfig.recordMetric')}</DialogTitle>
          <DialogDescription>
            A runtime metric point. If it breaches an enabled threshold, a
            finding is raised automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="m-key">{t('runtimeConfig.fields.metricKey')}</Label>
            <Input
              id="m-key"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              placeholder={t('runtimeConfig.placeholders.metricKey')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="m-value">{t('runtimeConfig.fields.value')}</Label>
              <Input
                id="m-value"
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={t('runtimeConfig.placeholders.value')}
              />
            </div>
            <div>
              <Label htmlFor="m-env">
                {t('runtimeConfig.fields.environment')}
              </Label>
              <Input
                id="m-env"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
              />
            </div>
          </div>
          {mutation.isError ? (
            <p className="text-sm text-red-600">
              {(mutation.error as Error)?.message ??
                t('runtimeConfig.saveFailed')}
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
              t('runtimeConfig.record')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MetricsSection() {
  const { t } = useTranslation('ai');
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
      <SectionHeader
        icon={Gauge}
        title={t('runtimeConfig.metrics')}
        onAdd={() => setOpen(true)}
      />
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
                  aria-label={t('runtimeConfig.deleteMetric')}
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
  const { t } = useTranslation('ai');
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
          <DialogTitle>{t('runtimeConfig.addThreshold')}</DialogTitle>
          <DialogDescription>
            When a metric with this key breaches the value, a finding is raised
            at the given severity.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="t-key">{t('runtimeConfig.fields.metricKey')}</Label>
            <Input
              id="t-key"
              value={metricKey}
              onChange={(e) => setMetricKey(e.target.value)}
              placeholder={t('runtimeConfig.placeholders.metricKey')}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{t('runtimeConfig.fields.comparator')}</Label>
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
              <Label htmlFor="t-val">{t('runtimeConfig.fields.value')}</Label>
              <Input
                id="t-val"
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                placeholder={t('runtimeConfig.placeholders.threshold')}
              />
            </div>
            <div>
              <Label>{t('runtimeConfig.fields.severity')}</Label>
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
              {(mutation.error as Error)?.message ??
                t('runtimeConfig.saveFailed')}
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
  const { t } = useTranslation('ai');
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
        title={t('runtimeConfig.thresholds')}
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
            {(data ?? []).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {item.metricKey}{' '}
                      <span className="font-mono">
                        {COMPARATOR_LABEL[item.comparator]}{' '}
                        {item.thresholdValue}
                      </span>
                    </p>
                    <Badge
                      variant="outline"
                      className={SEVERITY_COLORS[item.severity]}
                    >
                      {titleCase(item.severity)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch
                      checked={item.enabled}
                      onCheckedChange={(v) =>
                        toggle.mutate({ id: item.id, enabled: v })
                      }
                    />
                    {item.enabled ? 'On' : 'Off'}
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => del.mutate(item.id)}
                    aria-label={t('runtimeConfig.deleteThreshold')}
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
  const { t } = useTranslation('ai');
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
          <DialogTitle>{t('runtimeConfig.logModelChange')}</DialogTitle>
          <DialogDescription>
            Record a model or version change for the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="mv-name">
              {t('runtimeConfig.fields.modelName')}
            </Label>
            <Input
              id="mv-name"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={t('runtimeConfig.placeholders.modelName')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="mv-from">
                {t('runtimeConfig.fields.fromVersion')}
              </Label>
              <Input
                id="mv-from"
                value={fromVersion}
                onChange={(e) => setFromVersion(e.target.value)}
                placeholder={t('runtimeConfig.placeholders.fromVersion')}
              />
            </div>
            <div>
              <Label htmlFor="mv-to">
                {t('runtimeConfig.fields.toVersion')}
              </Label>
              <Input
                id="mv-to"
                value={toVersion}
                onChange={(e) => setToVersion(e.target.value)}
                placeholder={t('runtimeConfig.placeholders.toVersion')}
              />
            </div>
          </div>
          <div>
            <Label>{t('runtimeConfig.fields.changeType')}</Label>
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
              {(mutation.error as Error)?.message ??
                t('runtimeConfig.saveFailed')}
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
              t('runtimeConfig.logChange')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ModelEventsSection() {
  const { t } = useTranslation('ai');
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
        title={t('runtimeConfig.modelChanges')}
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
                  aria-label={t('runtimeConfig.deleteModelEvent')}
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
