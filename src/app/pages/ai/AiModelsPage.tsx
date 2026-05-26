/**
 * AiModelsPage.tsx — AI model registry CRUD (T-102).
 *
 * Backs the ISO 42001 model-card requirements (A.6.2.3, A.6.2.7,
 * A.8.2) and the `ai-model-registry` evaluator landed in PR 7.
 *
 * Customers list, register, edit, and retire AI models. Each
 * PRODUCTION model should have a `modelCardDocumentId` and a recent
 * `lastReviewedAt` — the evaluator passes when both are present.
 */

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Edit3, Brain } from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  AI_MODEL_CLASSIFICATIONS,
  type AiModel,
  type AiModelClassification,
  aiModelsService,
} from '@/services/api/aiModels';

const CLASSIFICATION_LABELS: Record<AiModelClassification, string> = {
  DEVELOPMENT: 'Development',
  TESTING: 'Testing',
  PRODUCTION: 'Production',
  RETIRED: 'Retired',
};

const CLASSIFICATION_COLORS: Record<AiModelClassification, string> = {
  DEVELOPMENT: 'bg-blue-50 text-blue-700 border-blue-200',
  TESTING: 'bg-amber-50 text-amber-700 border-amber-200',
  PRODUCTION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RETIRED: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface ModelFormState {
  name: string;
  vendor: string;
  version: string;
  classification: AiModelClassification;
}

function emptyForm(): ModelFormState {
  return {
    name: '',
    vendor: '',
    version: '',
    classification: 'DEVELOPMENT',
  };
}

function fromModel(m: AiModel): ModelFormState {
  return {
    name: m.name,
    vendor: m.vendor ?? '',
    version: m.version ?? '',
    classification: m.classification,
  };
}

function ModelDialog({
  open,
  initial,
  modelId,
  onOpenChange,
}: {
  open: boolean;
  initial: ModelFormState;
  modelId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ModelFormState>(initial);
  const isEdit = modelId !== null;

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        vendor: form.vendor.trim() || undefined,
        version: form.version.trim() || undefined,
        classification: form.classification,
      };
      return isEdit
        ? aiModelsService.update(modelId, payload)
        : aiModelsService.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiModels'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit AI model' : 'Register AI model'}
          </DialogTitle>
          <DialogDescription>
            Track production AI systems so model-card and review-cadence
            controls have a registry to read from.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="ai-model-name">Name</Label>
            <Input
              id="ai-model-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Support Triage Assistant"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ai-model-vendor">Vendor</Label>
              <Input
                id="ai-model-vendor"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="OpenAI, Anthropic, ..."
              />
            </div>
            <div>
              <Label htmlFor="ai-model-version">Version</Label>
              <Input
                id="ai-model-version"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                placeholder="gpt-4o, claude-3-5-sonnet, ..."
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ai-model-class">Classification</Label>
            <Select
              value={form.classification}
              onValueChange={(v) =>
                setForm({ ...form, classification: v as AiModelClassification })
              }
            >
              <SelectTrigger id="ai-model-class">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODEL_CLASSIFICATIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CLASSIFICATION_LABELS[c]}
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

export function AiModelsPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<ModelFormState>(emptyForm());

  const { data: models, isLoading } = useQuery({
    queryKey: ['aiModels'],
    queryFn: () => aiModelsService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiModelsService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['aiModels'] }),
  });

  const openCreate = () => {
    setEditingId(null);
    setInitialForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (m: AiModel) => {
    setEditingId(m.id);
    setInitialForm(fromModel(m));
    setDialogOpen(true);
  };

  const grouped = useMemo(() => {
    const out: Record<AiModelClassification, AiModel[]> = {
      DEVELOPMENT: [],
      TESTING: [],
      PRODUCTION: [],
      RETIRED: [],
    };
    for (const m of models ?? []) out[m.classification].push(m);
    return out;
  }, [models]);

  return (
    <PageTemplate
      title="AI Model Registry"
      description="Production AI systems registered for ISO/IEC 42001. Each PRODUCTION model needs a model card and a review within the past 12 months."
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Register AI model
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (models ?? []).length === 0 ? (
        <Card className="p-8 text-center">
          <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No AI models registered yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Register every production AI system so the model-registry evaluator
            and the model-card control have something to check.
          </p>
          <Button className="mt-4" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Register first model
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {(AI_MODEL_CLASSIFICATIONS as readonly AiModelClassification[]).map(
            (cls) => {
              const rows = grouped[cls];
              if (rows.length === 0) return null;
              return (
                <div key={cls} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {CLASSIFICATION_LABELS[cls]}
                    </h3>
                    <Badge
                      variant="outline"
                      className={CLASSIFICATION_COLORS[cls]}
                    >
                      {rows.length}
                    </Badge>
                  </div>
                  <Card>
                    <div className="divide-y">
                      {rows.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {m.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[m.vendor, m.version]
                                .filter(Boolean)
                                .join(' · ') || '—'}
                            </p>
                            {m.classification === 'PRODUCTION' &&
                            !m.modelCardDocumentId ? (
                              <p className="text-xs text-amber-700 mt-1">
                                Model card not attached — evaluator will fail.
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(m)}
                              aria-label="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Delete AI model "${m.name}"? This cannot be undone.`,
                                  )
                                ) {
                                  deleteMutation.mutate(m.id);
                                }
                              }}
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              );
            },
          )}
        </div>
      )}

      <ModelDialog
        open={dialogOpen}
        initial={initialForm}
        modelId={editingId}
        onOpenChange={setDialogOpen}
      />
    </PageTemplate>
  );
}
