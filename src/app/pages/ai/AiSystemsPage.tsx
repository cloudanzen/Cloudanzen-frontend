/**
 * AiSystemsPage.tsx — AI Systems Registry (Phase 4 slice 1).
 *
 * Route /ai-trust/systems. The first real AI TrustOps system of record:
 * the org's inventory of AI features/products. Feeds the dashboard
 * `aiSystems` card + `register_ai_systems` checklist item.
 *
 * Slice 1 = system CRUD (list / create / edit / delete). Use-case
 * management + CSV import land in a follow-up; the BE already supports both.
 */

import { useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Edit3, Boxes, Upload } from 'lucide-react';

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
  AI_LIFECYCLE_STAGES,
  AI_RISK_TIERS,
  AI_HUMAN_OVERSIGHTS,
  AI_DATA_EXPOSURES,
  aiSystemsService,
  type AiSystem,
  type AiLifecycleStage,
  type AiRiskTier,
  type AiHumanOversight,
  type AiDataExposure,
} from '@/services/api/aiSystems';
import { parseCsv, rowsToPayload, CSV_TEMPLATE } from './aiSystemsCsv';

const RISK_TIER_COLORS: Record<AiRiskTier, string> = {
  MINIMAL: 'bg-gray-50 text-gray-600 border-gray-200',
  LIMITED: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  UNACCEPTABLE: 'bg-rose-50 text-rose-700 border-rose-200',
};

const HUMAN_OVERSIGHT_LABELS: Record<AiHumanOversight, string> = {
  NONE: 'No oversight',
  HUMAN_IN_LOOP: 'Human in the loop',
  HUMAN_ON_LOOP: 'Human on the loop',
  HUMAN_OVER_LOOP: 'Human over the loop',
};

const DATA_EXPOSURE_LABELS: Record<AiDataExposure, string> = {
  NONE: 'No customer data',
  INTERNAL: 'Internal data',
  CUSTOMER_PII: 'Customer PII',
  SENSITIVE: 'Sensitive data',
};

const titleCase = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

interface FormState {
  name: string;
  description: string;
  productArea: string;
  modelProvider: string;
  lifecycleStage: AiLifecycleStage;
  riskTier: AiRiskTier;
  humanOversight: AiHumanOversight;
  customerDataExposure: AiDataExposure;
  customerFacing: boolean;
  ragUsage: boolean;
  fineTuned: boolean;
}

function emptyForm(): FormState {
  return {
    name: '',
    description: '',
    productArea: '',
    modelProvider: '',
    lifecycleStage: 'PROPOSED',
    riskTier: 'LIMITED',
    humanOversight: 'NONE',
    customerDataExposure: 'NONE',
    customerFacing: false,
    ragUsage: false,
    fineTuned: false,
  };
}

function fromSystem(s: AiSystem): FormState {
  return {
    name: s.name,
    description: s.description ?? '',
    productArea: s.productArea ?? '',
    modelProvider: s.modelProvider ?? '',
    lifecycleStage: s.lifecycleStage,
    riskTier: s.riskTier,
    humanOversight: s.humanOversight,
    customerDataExposure: s.customerDataExposure,
    customerFacing: s.customerFacing,
    ragUsage: s.ragUsage,
    fineTuned: s.fineTuned,
  };
}

function SystemDialog({
  open,
  initial,
  systemId,
  onOpenChange,
}: {
  open: boolean;
  initial: FormState;
  systemId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(initial);
  const isEdit = systemId !== null;

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        productArea: form.productArea.trim() || undefined,
        modelProvider: form.modelProvider.trim() || undefined,
        lifecycleStage: form.lifecycleStage,
        riskTier: form.riskTier,
        humanOversight: form.humanOversight,
        customerDataExposure: form.customerDataExposure,
        customerFacing: form.customerFacing,
        ragUsage: form.ragUsage,
        fineTuned: form.fineTuned,
      };
      return isEdit
        ? aiSystemsService.update(systemId, payload)
        : aiSystemsService.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiSystems'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit AI system' : 'Register AI system'}
          </DialogTitle>
          <DialogDescription>
            Inventory an AI feature or product so its risk posture, data
            exposure, and oversight are on record for buyers and auditors.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="sys-name">Name</Label>
            <Input
              id="sys-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Support Triage Copilot"
            />
          </div>
          <div>
            <Label htmlFor="sys-desc">Description</Label>
            <Textarea
              id="sys-desc"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="What the system does and where it runs."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sys-area">Product area</Label>
              <Input
                id="sys-area"
                value={form.productArea}
                onChange={(e) =>
                  setForm({ ...form, productArea: e.target.value })
                }
                placeholder="Support, Sales, ..."
              />
            </div>
            <div>
              <Label htmlFor="sys-provider">Model provider</Label>
              <Input
                id="sys-provider"
                value={form.modelProvider}
                onChange={(e) =>
                  setForm({ ...form, modelProvider: e.target.value })
                }
                placeholder="OpenAI, Anthropic, self-hosted"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lifecycle stage</Label>
              <Select
                value={form.lifecycleStage}
                onValueChange={(v) =>
                  setForm({ ...form, lifecycleStage: v as AiLifecycleStage })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_LIFECYCLE_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {titleCase(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Risk tier</Label>
              <Select
                value={form.riskTier}
                onValueChange={(v) =>
                  setForm({ ...form, riskTier: v as AiRiskTier })
                }
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Human oversight</Label>
              <Select
                value={form.humanOversight}
                onValueChange={(v) =>
                  setForm({ ...form, humanOversight: v as AiHumanOversight })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_HUMAN_OVERSIGHTS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {HUMAN_OVERSIGHT_LABELS[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Customer data exposure</Label>
              <Select
                value={form.customerDataExposure}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    customerDataExposure: v as AiDataExposure,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_DATA_EXPOSURES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DATA_EXPOSURE_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.customerFacing}
                onCheckedChange={(v) => setForm({ ...form, customerFacing: v })}
              />
              Customer-facing
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.ragUsage}
                onCheckedChange={(v) => setForm({ ...form, ragUsage: v })}
              />
              Uses RAG
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.fineTuned}
                onCheckedChange={(v) => setForm({ ...form, fineTuned: v })}
              />
              Fine-tuned
            </label>
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
            disabled={form.name.trim().length === 0 || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Register'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const parsed = text.trim()
    ? rowsToPayload(parseCsv(text))
    : { rows: [], error: null };

  const mutation = useMutation({
    mutationFn: () => aiSystemsService.importCsv(parsed.rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiSystems'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import AI systems from CSV</DialogTitle>
          <DialogDescription>
            Paste CSV with a header row. externalId + name are required; rows
            upsert by externalId, so re-importing updates in place.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={CSV_TEMPLATE}
            className="font-mono text-xs min-h-[180px]"
          />
          {parsed.error ? (
            <p className="text-sm text-amber-700">{parsed.error}</p>
          ) : parsed.rows.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {parsed.rows.length} row{parsed.rows.length === 1 ? '' : 's'}{' '}
              ready to import.
            </p>
          ) : null}
          {mutation.isError ? (
            <p className="text-sm text-red-600">
              {(mutation.error as Error)?.message ?? 'Import failed'}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              parsed.rows.length === 0 ||
              parsed.error !== null ||
              mutation.isPending
            }
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Import ${parsed.rows.length || ''}`.trim()
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AiSystemsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<FormState>(emptyForm());

  const { data: systems, isLoading } = useQuery({
    queryKey: ['aiSystems'],
    queryFn: () => aiSystemsService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiSystemsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiSystems'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setInitialForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (s: AiSystem) => {
    setEditingId(s.id);
    setInitialForm(fromSystem(s));
    setDialogOpen(true);
  };

  return (
    <PageTemplate
      title="AI Systems Registry"
      description="Every AI feature or product you run, with its risk tier, data exposure, and human oversight on record."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Register AI system
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (systems ?? []).length === 0 ? (
        <Card className="p-8 text-center">
          <Boxes className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No AI systems registered yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Register each AI feature so its risk posture and data handling are
            documented for buyers and auditors.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Register first system
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {(systems ?? []).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-4 py-3 gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/ai-trust/systems/${s.id}`}
                      className="text-sm font-medium truncate hover:underline"
                    >
                      {s.name}
                    </Link>
                    <Badge
                      variant="outline"
                      className={RISK_TIER_COLORS[s.riskTier]}
                    >
                      {titleCase(s.riskTier)}
                    </Badge>
                    {s.customerFacing ? (
                      <Badge variant="outline" className="text-xs">
                        Customer-facing
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {[
                      titleCase(s.lifecycleStage),
                      s.productArea,
                      s.modelProvider,
                      DATA_EXPOSURE_LABELS[s.customerDataExposure],
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(s)}
                    aria-label="Edit"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(s.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {dialogOpen ? (
        <SystemDialog
          open={dialogOpen}
          initial={initialForm}
          systemId={editingId}
          onOpenChange={setDialogOpen}
        />
      ) : null}
      {importOpen ? (
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      ) : null}
    </PageTemplate>
  );
}
