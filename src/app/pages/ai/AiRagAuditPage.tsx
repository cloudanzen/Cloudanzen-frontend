/**
 * AiRagAuditPage.tsx — AI TrustOps RAG + Data Pipeline Audit MVP.
 *
 * Route /ai-trust/rag-audit. Two sections: RAG sources (documents/datasets
 * feeding retrieval, with license / PII-scan / retention status) and
 * data-hygiene findings (PII exposure, secrets, license, poisoning, IP
 * leakage). Feeds the dashboard ragHygiene card (open findings).
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  Database,
  ShieldAlert,
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
  AI_RAG_SOURCE_TYPES,
  AI_DATA_EXPOSURES,
  AI_LICENSE_STATUSES,
  AI_PII_SCAN_STATUSES,
  AI_RETENTION_STATUSES,
  AI_HYGIENE_FINDING_TYPES,
  AI_FINDING_SEVERITIES,
  aiRagService,
  type AiRagSourceType,
  type AiDataExposure,
  type AiLicenseStatus,
  type AiPiiScanStatus,
  type AiRetentionStatus,
  type AiHygieneFindingType,
  type AiFindingSeverity,
  type AiPiiScanStatus as PiiStatus,
} from '@/services/api/aiRag';

const titleCase = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');

const SEVERITY_COLORS: Record<AiFindingSeverity, string> = {
  LOW: 'bg-gray-50 text-gray-600 border-gray-200',
  MEDIUM: 'bg-blue-50 text-blue-700 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
};

const PII_COLORS: Record<PiiStatus, string> = {
  NOT_SCANNED: 'bg-gray-50 text-gray-600 border-gray-200',
  CLEAN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PII_FOUND: 'bg-amber-50 text-amber-700 border-amber-200',
  SECRETS_FOUND: 'bg-rose-50 text-rose-700 border-rose-200',
};

// ── Source dialog ─────────────────────────────────────────────────────────

function SourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<AiRagSourceType>('DOCUMENT');
  const [pipelineName, setPipelineName] = useState('');
  const [owner, setOwner] = useState('');
  const [dataClass, setDataClass] = useState<AiDataExposure>('NONE');
  const [licenseStatus, setLicenseStatus] =
    useState<AiLicenseStatus>('UNKNOWN');
  const [piiScanStatus, setPiiScanStatus] =
    useState<AiPiiScanStatus>('NOT_SCANNED');
  const [retentionStatus, setRetentionStatus] =
    useState<AiRetentionStatus>('UNKNOWN');

  const mutation = useMutation({
    mutationFn: () =>
      aiRagService.createSource({
        name: name.trim(),
        sourceType,
        pipelineName: pipelineName.trim() || undefined,
        owner: owner.trim() || undefined,
        dataClass,
        licenseStatus,
        piiScanStatus,
        retentionStatus,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRagSources'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  const sel = <T extends string>(
    label: string,
    value: T,
    options: readonly T[],
    onChange: (v: T) => void,
  ) => (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {titleCase(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add RAG source</DialogTitle>
          <DialogDescription>
            A document, dataset, or index feeding retrieval — with its license,
            PII-scan, and retention status.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="rs-name">Name</Label>
            <Input
              id="rs-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Support KB corpus"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sel('Type', sourceType, AI_RAG_SOURCE_TYPES, setSourceType)}
            <div>
              <Label htmlFor="rs-pipeline">Pipeline / index</Label>
              <Input
                id="rs-pipeline"
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                placeholder="support-index"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sel('Data class', dataClass, AI_DATA_EXPOSURES, setDataClass)}
            <div>
              <Label htmlFor="rs-owner">Owner</Label>
              <Input
                id="rs-owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {sel(
              'License',
              licenseStatus,
              AI_LICENSE_STATUSES,
              setLicenseStatus,
            )}
            {sel(
              'PII scan',
              piiScanStatus,
              AI_PII_SCAN_STATUSES,
              setPiiScanStatus,
            )}
            {sel(
              'Retention',
              retentionStatus,
              AI_RETENTION_STATUSES,
              setRetentionStatus,
            )}
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
              'Add source'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Finding dialog ────────────────────────────────────────────────────────

function FindingDialog({
  sources,
  open,
  onOpenChange,
}: {
  sources: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [findingType, setFindingType] =
    useState<AiHygieneFindingType>('PII_EXPOSURE');
  const [severity, setSeverity] = useState<AiFindingSeverity>('MEDIUM');
  const [ragSourceId, setRagSourceId] = useState<string>('none');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      aiRagService.createFinding({
        title: title.trim(),
        findingType,
        severity,
        ragSourceId: ragSourceId === 'none' ? undefined : ragSourceId,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRagFindings'] });
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add data-hygiene finding</DialogTitle>
          <DialogDescription>
            A PII/secrets exposure, license issue, poisoning, or IP-leakage
            concern on a RAG source.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="hf-title">Title</Label>
            <Input
              id="hf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="PII found in support KB export"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select
                value={findingType}
                onValueChange={(v) => setFindingType(v as AiHygieneFindingType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_HYGIENE_FINDING_TYPES.map((t) => (
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
            <Label>Source (optional)</Label>
            <Select value={ragSourceId} onValueChange={setRagSourceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="hf-desc">Description</Label>
            <Textarea
              id="hf-desc"
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

export function AiRagAuditPage() {
  const qc = useQueryClient();
  const [sourceDialog, setSourceDialog] = useState(false);
  const [findingDialog, setFindingDialog] = useState(false);

  const invalidateDash = () =>
    qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['aiRagSources'],
    queryFn: () => aiRagService.listSources(),
  });
  const { data: findings, isLoading: findingsLoading } = useQuery({
    queryKey: ['aiRagFindings'],
    queryFn: () => aiRagService.listFindings(),
  });

  const delSource = useMutation({
    mutationFn: (id: string) => aiRagService.removeSource(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRagSources'] });
      invalidateDash();
    },
  });
  const resolveFinding = useMutation({
    mutationFn: (id: string) => aiRagService.resolveFinding(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRagFindings'] });
      invalidateDash();
    },
  });
  const delFinding = useMutation({
    mutationFn: (id: string) => aiRagService.removeFinding(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['aiRagFindings'] });
      invalidateDash();
    },
  });

  return (
    <PageTemplate
      title="RAG / Data Pipeline Audit"
      description="Map your RAG sources and track data-hygiene findings — license, PII/secrets, poisoning, and retention."
    >
      <div className="space-y-6">
        {/* Sources */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              Sources
            </h2>
            <Button size="sm" onClick={() => setSourceDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add source
            </Button>
          </div>
          {sourcesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (sources ?? []).length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No RAG sources yet. Map source documents, datasets, and indexes —
              or push them via the API.
            </Card>
          ) : (
            <Card>
              <div className="divide-y">
                {(sources ?? []).map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {titleCase(s.sourceType)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={PII_COLORS[s.piiScanStatus]}
                        >
                          {titleCase(s.piiScanStatus)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {[
                          s.pipelineName,
                          titleCase(s.dataClass),
                          `License: ${titleCase(s.licenseStatus)}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => delSource.mutate(s.id)}
                      aria-label="Delete source"
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
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              Data-hygiene findings
            </h2>
            <Button size="sm" onClick={() => setFindingDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add finding
            </Button>
          </div>
          {findingsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (findings ?? []).length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No findings. PII/secrets exposure, license issues, poisoning, and
              IP-leakage concerns show here.
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        onClick={() => delFinding.mutate(f.id)}
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
      </div>

      {sourceDialog ? (
        <SourceDialog open={sourceDialog} onOpenChange={setSourceDialog} />
      ) : null}
      {findingDialog ? (
        <FindingDialog
          sources={(sources ?? []).map((s) => ({ id: s.id, name: s.name }))}
          open={findingDialog}
          onOpenChange={setFindingDialog}
        />
      ) : null}
    </PageTemplate>
  );
}
