import { useState, useEffect } from 'react';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Loader2,
  ArrowLeft,
  FileText,
  ShieldCheck,
  Workflow,
  Users,
  Clock3,
  Pencil,
  ExternalLink,
  AlertTriangle,
  Activity,
  Link2,
  Eye,
  ArrowRight,
  Target,
  Shield,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import {
  riskCenterService,
  type RiskStakeholder,
} from '@/services/api/riskCenter';
import {
  riskLibraryService,
  type UpdateRegisterEntryRequest,
  type RiskMappedControl,
  type RiskMappedFramework,
} from '@/services/api/risk-library';
import { scanFindingsService } from '@/services/api/scan-findings';
import { usersService } from '@/services/api/users';
import { controlsService } from '@/services/api/controls';
import { frameworksService } from '@/services/api/frameworks';
import {
  riskLevelVariant,
  riskStatusVariant,
  trendLabel,
} from '@/services/api/riskFormatting';
import { useIsAdmin, useCurrentUser } from '@/hooks/useCurrentUser';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { TestDetailPanel } from '@/app/pages/tests/TestDetailPanel';

// ─── Constants ────────────────────────────────────────────────────────────────

const IMPACT_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const LIKELIHOOD_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
const STATUS_OPTIONS = ['IDENTIFIED', 'ASSESSING', 'TREATING', 'MONITORING', 'CLOSED'] as const;
const TREATMENT_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'MITIGATE', label: 'Mitigate' },
  { value: 'ACCEPT', label: 'Accept' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'AVOID', label: 'Avoid' },
] as const;

const SCORE_WEIGHTS: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function calcScore(impact: string, likelihood: string): number {
  return (SCORE_WEIGHTS[impact] ?? 2) * (SCORE_WEIGHTS[likelihood] ?? 2);
}

function scoreColor(score: number): string {
  if (score >= 12) return 'text-red-600';
  if (score >= 6) return 'text-amber-600';
  if (score >= 3) return 'text-yellow-600';
  return 'text-green-600';
}

function scoreBgColor(score: number): string {
  if (score >= 12) return 'bg-red-50 border-red-200';
  if (score >= 6) return 'bg-amber-50 border-amber-200';
  if (score >= 3) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}

function levelBadgeColor(level: string): string {
  switch (level) {
    case 'CRITICAL': return 'bg-red-100 text-red-700';
    case 'HIGH': return 'bg-orange-100 text-orange-700';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
    case 'LOW': return 'bg-green-100 text-green-700';
    default: return 'bg-muted text-muted-foreground';
  }
}

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Inline select component ─────────────────────────────────────────────────

function InlineSelect({
  value,
  options,
  onChange,
  disabled,
  className = '',
}: {
  value: string;
  options: readonly { value: string; label: string }[] | readonly string[];
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const opts = options.map(o => typeof o === 'string' ? { value: o, label: statusLabel(o) } : o);
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${className}`}
    >
      {opts.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Stakeholder Edit Dialog ──────────────────────────────────────────────────

interface StakeholderDialogProps {
  open: boolean;
  onClose: () => void;
  stakeholders: RiskStakeholder[];
  riskId: string;
}

function EditStakeholdersDialog({
  open,
  onClose,
  stakeholders,
  riskId,
}: StakeholderDialogProps) {
  const qc = useQueryClient();
  const currentUser = useCurrentUser();
  const [draft, setDraft] = useState<RiskStakeholder[]>(() => [
    ...stakeholders,
  ]);
  const [error, setError] = useState('');

  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      return usersService.listUsers();
    },
    staleTime: STALE.USERS,
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      riskCenterService.updateStakeholders(
        riskId,
        { stakeholders: draft },
        currentUser?.name ?? currentUser?.email ?? 'Admin',
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskDetail(riskId) });
      qc.invalidateQueries({ queryKey: ['risk-register'] });
      qc.invalidateQueries({ queryKey: QK.activityLog() });
      onClose();
    },
    onError: () =>
      setError('Failed to save stakeholder changes. Please try again.'),
  });

  function updateRole(
    index: number,
    field: keyof RiskStakeholder,
    value: string,
  ) {
    setDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, [field]: value } as RiskStakeholder;
      return next;
    });
  }

  function selectUser(index: number, userId: string) {
    const user = usersData?.find((u) => u.id === userId);
    if (!user) return;
    setDraft((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index]!,
        name: user.name ?? user.email,
        userId: user.id,
      } as RiskStakeholder;
      return next;
    });
  }

  function addBackupOwner() {
    if (draft.some((s) => s.role === 'Backup owner')) return;
    setDraft((prev) => [...prev, { role: 'Backup owner', name: '', team: '' }]);
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
    } else {
      setDraft([...stakeholders]);
      setError('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Edit stakeholders
          </DialogTitle>
          <DialogDescription>
            Reassign technical, business, control, or backup ownership for this
            risk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {draft.map((person, index) => (
            <div
              key={person.role}
              className="space-y-2 rounded-xl border border-border p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {person.role}
              </p>

              {usersData && usersData.length > 0 ? (
                <select
                  value={person.userId ?? ''}
                  onChange={(e) => selectUser(index, e.target.value)}
                  className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select user...</option>
                  {usersData.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => updateRole(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              <input
                type="text"
                value={person.team}
                onChange={(e) => updateRole(index, 'team', e.target.value)}
                placeholder="Team"
                className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          {!draft.some((s) => s.role === 'Backup owner') && (
            <button
              type="button"
              onClick={addBackupOwner}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              + Add backup owner
            </button>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending || draft.some((s) => !s.name || !s.team)
            }
          >
            {mutation.isPending ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activity dot colour ──────────────────────────────────────────────────────

function activityDotColor(type: string): string {
  switch (type) {
    case 'DETECTED':
      return 'bg-red-500';
    case 'STAKEHOLDER_CHANGED':
      return 'bg-amber-500';
    case 'EVIDENCE':
      return 'bg-blue-500';
    case 'REMEDIATION':
      return 'bg-purple-500';
    case 'ACCEPTED':
      return 'bg-yellow-500';
    case 'ASSIGNED':
      return 'bg-green-500';
    default:
      return 'bg-foreground';
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RiskDetailPage() {
  const navigate = useNavigate();
  const { riskId = '' } = useParams();
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const { data, isLoading } = useQuery({
    queryKey: QK.riskDetail(riskId),
    queryFn: () => riskCenterService.getRiskDetail(riskId),
    staleTime: STALE.RISKS,
    enabled: Boolean(riskId),
  });

  const { data: findingsData } = useQuery({
    queryKey: ['risk-findings', riskId],
    queryFn: () => scanFindingsService.listByRisk(riskId),
    staleTime: STALE.RISKS,
    enabled: Boolean(riskId),
  });

  // Fetch users for owner assignment
  const { data: usersData } = useQuery({
    queryKey: QK.users(),
    queryFn: async () => {
      const res = await usersService.listUsers();
      return Array.isArray(res) ? res : [];
    },
    staleTime: STALE.USERS,
    enabled: Boolean(data),
  });

  // Fetch risk-control-framework mappings
  const { data: mappingsData } = useQuery({
    queryKey: QK.riskMappings(riskId),
    queryFn: async () => {
      const res = await riskLibraryService.getRiskMappings(riskId);
      const d = res.data ?? { controls: [], frameworks: [] };
      return {
        controls: Array.isArray(d.controls) ? d.controls : [],
        frameworks: Array.isArray(d.frameworks) ? d.frameworks : [],
      };
    },
    staleTime: STALE.RISKS,
    enabled: Boolean(riskId),
  });

  // Fetch org controls for picker
  const { data: allControls } = useQuery({
    queryKey: QK.controls(),
    queryFn: async () => {
      const res = await controlsService.getControls();
      const arr = res.data;
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE.CONTROLS,
    enabled: Boolean(data),
  });

  // Fetch available frameworks for picker
  const { data: allFrameworks } = useQuery({
    queryKey: QK.frameworkCatalog(),
    queryFn: async () => {
      const res = await frameworksService.listCatalog();
      const arr = res.data;
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE.CONTROLS,
    enabled: Boolean(data),
  });

  // Mapping state
  const [showControlPicker, setShowControlPicker] = useState(false);
  const [showFrameworkPicker, setShowFrameworkPicker] = useState(false);

  const linkControlMut = useMutation({
    mutationFn: (controlId: string) => riskLibraryService.linkControl(riskId, controlId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) });
      setShowControlPicker(false);
    },
  });

  const unlinkControlMut = useMutation({
    mutationFn: (controlId: string) => riskLibraryService.unlinkControl(riskId, controlId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) }),
  });

  const linkFrameworkMut = useMutation({
    mutationFn: (frameworkId: string) => riskLibraryService.linkFramework(riskId, frameworkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) });
      setShowFrameworkPicker(false);
    },
  });

  const unlinkFrameworkMut = useMutation({
    mutationFn: (frameworkId: string) => riskLibraryService.unlinkFramework(riskId, frameworkId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) }),
  });

  // Compute which controls/frameworks are already linked (to exclude from pickers)
  const linkedControlIds = new Set(mappingsData?.controls?.map(c => c.controlId) ?? []);
  const linkedFrameworkIds = new Set(mappingsData?.frameworks?.map(f => f.frameworkId) ?? []);

  // ── Draft state for editable fields ──
  const reg = data?.registerEntry;
  const [draft, setDraft] = useState({
    status: '',
    treatment: '',
    treatmentNotes: '',
    ownerId: '' as string | null,
    reviewDueAt: '',
    description: '',
    inherentImpact: '',
    inherentLikelihood: '',
    residualImpact: '',
    residualLikelihood: '',
  });

  // Sync draft when data loads
  useEffect(() => {
    if (reg) {
      setDraft({
        status: reg.status ?? 'IDENTIFIED',
        treatment: reg.treatment ?? '',
        treatmentNotes: reg.treatmentNotes ?? '',
        ownerId: reg.ownerId ?? null,
        reviewDueAt: reg.reviewDueAt ? reg.reviewDueAt.split('T')[0]! : '',
        description: reg.description ?? '',
        inherentImpact: reg.inherentImpact ?? 'MEDIUM',
        inherentLikelihood: reg.inherentLikelihood ?? 'MEDIUM',
        residualImpact: reg.residualImpact ?? 'MEDIUM',
        residualLikelihood: reg.residualLikelihood ?? 'MEDIUM',
      });
    }
  }, [reg]);

  // ── Mutation ──
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateRegisterEntryRequest) =>
      riskLibraryService.updateRegisterEntry(riskId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskDetail(riskId) });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  function saveField(fields: UpdateRegisterEntryRequest) {
    setSaveStatus('saving');
    updateMutation.mutate(fields);
  }

  // Computed scores
  const inherentScore = calcScore(draft.inherentImpact || 'MEDIUM', draft.inherentLikelihood || 'MEDIUM');
  const residualScore = calcScore(draft.residualImpact || 'MEDIUM', draft.residualLikelihood || 'MEDIUM');

  return (
    <PageTemplate
      title="Risk Detail"
      description=""
      actions={
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/risk/risks')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to register
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
        </div>
      ) : !data ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Risk not found.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* ── Header card ──────────────────────────────────────────────── */}
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={riskStatusVariant(data.risk.status)}>
                    {data.risk.status}
                  </Badge>
                  <Badge variant="outline">{data.risk.category}</Badge>
                  <Badge variant="outline">{data.risk.source}</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">
                  {data.risk.title}
                </h2>
                {/* Editable description */}
                <textarea
                  value={draft.description}
                  onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
                  onBlur={() => {
                    if (draft.description !== (reg?.description ?? '')) {
                      saveField({ description: draft.description });
                    }
                  }}
                  rows={2}
                  className="mt-2 w-full resize-none rounded-md border border-transparent bg-transparent px-0 py-1 text-sm leading-6 text-muted-foreground hover:border-border focus:border-border focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Add a description..."
                />
              </div>

              {/* Score cards */}
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div className={`rounded-xl border p-4 ${scoreBgColor(inherentScore)}`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Inherent
                  </p>
                  <p className={`mt-1 text-3xl font-bold ${scoreColor(inherentScore)}`}>
                    {inherentScore}
                  </p>
                </div>
                <div className={`rounded-xl border p-4 ${scoreBgColor(residualScore)}`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Residual
                  </p>
                  <p className={`mt-1 text-3xl font-bold ${scoreColor(residualScore)}`}>
                    {residualScore}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Two-column layout: Assessment + Details sidebar ─────────── */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              {/* ── Risk Assessment ─────────────────────────────────────── */}
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Target className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Risk Assessment</h3>
                </div>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {/* Inherent Risk */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Inherent Risk</p>
                    <p className="text-xs text-muted-foreground">
                      Risk level before any controls or mitigations are applied.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Impact</label>
                        <InlineSelect
                          value={draft.inherentImpact}
                          options={IMPACT_LEVELS}
                          onChange={val => {
                            setDraft(d => ({ ...d, inherentImpact: val }));
                            saveField({ inherentImpact: val, inherentLikelihood: draft.inherentLikelihood || undefined });
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Likelihood</label>
                        <InlineSelect
                          value={draft.inherentLikelihood}
                          options={LIKELIHOOD_LEVELS}
                          onChange={val => {
                            setDraft(d => ({ ...d, inherentLikelihood: val }));
                            saveField({ inherentLikelihood: val, inherentImpact: draft.inherentImpact || undefined });
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className={`rounded-lg border px-3 py-2 text-center ${scoreBgColor(inherentScore)}`}>
                      <span className="text-xs text-muted-foreground">Score: </span>
                      <span className={`text-lg font-bold ${scoreColor(inherentScore)}`}>{inherentScore}</span>
                    </div>
                  </div>

                  {/* Residual Risk */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Residual Risk</p>
                    <p className="text-xs text-muted-foreground">
                      Risk level after controls and mitigations are applied.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Impact</label>
                        <InlineSelect
                          value={draft.residualImpact}
                          options={IMPACT_LEVELS}
                          onChange={val => {
                            setDraft(d => ({ ...d, residualImpact: val }));
                            saveField({ residualImpact: val, residualLikelihood: draft.residualLikelihood || undefined });
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">Likelihood</label>
                        <InlineSelect
                          value={draft.residualLikelihood}
                          options={LIKELIHOOD_LEVELS}
                          onChange={val => {
                            setDraft(d => ({ ...d, residualLikelihood: val }));
                            saveField({ residualLikelihood: val, residualImpact: draft.residualImpact || undefined });
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div className={`rounded-lg border px-3 py-2 text-center ${scoreBgColor(residualScore)}`}>
                      <span className="text-xs text-muted-foreground">Score: </span>
                      <span className={`text-lg font-bold ${scoreColor(residualScore)}`}>{residualScore}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── Treatment Plan ──────────────────────────────────────── */}
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Treatment Plan</h3>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Treatment Strategy</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {TREATMENT_OPTIONS.filter(t => t.value).map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setDraft(d => ({ ...d, treatment: opt.value }));
                            saveField({ treatment: opt.value });
                          }}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                            draft.treatment === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-border bg-card text-muted-foreground hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Treatment Notes</label>
                    <textarea
                      value={draft.treatmentNotes}
                      onChange={e => setDraft(d => ({ ...d, treatmentNotes: e.target.value }))}
                      onBlur={() => {
                        if (draft.treatmentNotes !== (reg?.treatmentNotes ?? '')) {
                          saveField({ treatmentNotes: draft.treatmentNotes });
                        }
                      }}
                      rows={3}
                      className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe the treatment approach, timeline, and responsible parties..."
                    />
                  </div>
                </div>
              </Card>

              {/* ── Controls & Framework mapping ────────────────────────── */}
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <h3 className="text-base font-semibold">
                    Control & Framework Mapping
                  </h3>
                </div>
                <div className="mt-5 space-y-5">
                  {/* Linked controls */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Linked Controls
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowControlPicker(p => !p)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>

                    {showControlPicker && (
                      <div className="mt-2 rounded-lg border border-border bg-card p-3">
                        <select
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) linkControlMut.mutate(e.target.value);
                          }}
                          disabled={linkControlMut.isPending}
                          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a control to link...</option>
                          {allControls
                            ?.filter(c => !linkedControlIds.has(c.id))
                            .map(c => (
                              <option key={c.id} value={c.id}>
                                {c.isoReference} — {c.title}
                              </option>
                            ))}
                        </select>
                        {linkControlMut.isPending && (
                          <p className="mt-1.5 text-xs text-muted-foreground">Linking...</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      {(mappingsData?.controls ?? []).length > 0 ? (
                        mappingsData!.controls.map((ctrl) => (
                          <div
                            key={ctrl.controlId}
                            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {ctrl.isoReference ?? 'Control'}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {ctrl.controlTitle ?? ctrl.controlId}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => unlinkControlMut.mutate(ctrl.controlId)}
                              disabled={unlinkControlMut.isPending}
                              className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              title="Remove control"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No controls linked yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Linked frameworks */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Impacted Frameworks
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowFrameworkPicker(p => !p)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>

                    {showFrameworkPicker && (
                      <div className="mt-2 rounded-lg border border-border bg-card p-3">
                        <select
                          defaultValue=""
                          onChange={e => {
                            if (e.target.value) linkFrameworkMut.mutate(e.target.value);
                          }}
                          disabled={linkFrameworkMut.isPending}
                          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a framework to link...</option>
                          {allFrameworks
                            ?.filter(f => !linkedFrameworkIds.has(f.id))
                            .map(f => (
                              <option key={f.id} value={f.id}>
                                {f.name} ({f.version})
                              </option>
                            ))}
                        </select>
                        {linkFrameworkMut.isPending && (
                          <p className="mt-1.5 text-xs text-muted-foreground">Linking...</p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      {(mappingsData?.frameworks ?? []).length > 0 ? (
                        mappingsData!.frameworks.map((fw) => (
                          <div
                            key={fw.frameworkId}
                            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {fw.frameworkName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {fw.frameworkSlug} v{fw.frameworkVersion}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => unlinkFrameworkMut.mutate(fw.frameworkId)}
                              disabled={unlinkFrameworkMut.isPending}
                              className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              title="Remove framework"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No frameworks linked yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Right sidebar: Details ────────────────────────────────── */}
            <div className="space-y-6">
              {/* Details card */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground">Details</h3>
                <div className="mt-4 space-y-4">
                  {/* Status */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
                    <InlineSelect
                      value={draft.status}
                      options={STATUS_OPTIONS}
                      onChange={val => {
                        setDraft(d => ({ ...d, status: val }));
                        saveField({ status: val });
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Owner</label>
                    <select
                      value={draft.ownerId ?? ''}
                      onChange={e => {
                        const val = e.target.value || null;
                        setDraft(d => ({ ...d, ownerId: val }));
                        saveField({ ownerId: val });
                      }}
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {usersData?.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Review Due Date */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Review Due Date</label>
                    <input
                      type="date"
                      value={draft.reviewDueAt}
                      onChange={e => {
                        setDraft(d => ({ ...d, reviewDueAt: e.target.value }));
                        saveField({ reviewDueAt: e.target.value || null });
                      }}
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Category</label>
                    <p className="text-sm text-foreground">{data.risk.category}</p>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Source</label>
                    <p className="text-sm text-foreground">{data.risk.source}</p>
                  </div>

                  {/* Created */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Created</label>
                    <p className="text-sm text-foreground">
                      {new Date(data.risk.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Stakeholders card */}
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Stakeholders</h3>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setStakeholderDialogOpen(true)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  {data.stakeholders.length > 0 ? (
                    data.stakeholders.map((person) => (
                      <div key={person.role} className="rounded-lg bg-muted px-3 py-2.5">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {person.role}
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {person.name}
                        </p>
                        {person.team && (
                          <p className="text-xs text-muted-foreground">{person.team}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No stakeholders assigned.</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────── */}
          <Tabs defaultValue="findings" className="gap-4">
            <TabsList>
              <TabsTrigger value="findings">
                Findings{findingsData?.meta ? ` (${findingsData.meta.open})` : ''}
              </TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="remediation">Remediation</TabsTrigger>
            </TabsList>

            {/* ── Findings tab ─────────────────────────────────────────── */}
            <TabsContent value="findings">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  <h3 className="text-base font-semibold">
                    Scan findings
                  </h3>
                  {findingsData?.meta && (
                    <Badge variant="outline">
                      {findingsData.meta.open} open / {findingsData.meta.total} total
                    </Badge>
                  )}
                </div>
                <div className="mt-5 space-y-3">
                  {(!findingsData?.data || findingsData.data.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No scan findings linked to this risk.
                    </p>
                  )}
                  {findingsData?.data?.map((finding) => (
                    <div
                      key={finding.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {finding.resourceName ?? finding.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {finding.title}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge
                            variant={
                              finding.status === 'OPEN'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {finding.status}
                          </Badge>
                          <Badge variant="outline">{finding.severity}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                        <span>
                          First seen:{' '}
                          {new Date(finding.firstSeenAt).toLocaleDateString()}
                        </span>
                        <span>
                          Last seen:{' '}
                          {new Date(finding.lastSeenAt).toLocaleDateString()}
                        </span>
                        <span>
                          Source: {finding.sourceType?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* ── Evidence tab ───────────────────────────────────────────── */}
            <TabsContent value="evidence">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <FileText className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Evidence timeline</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {data.evidence.length === 0 && (
                    <p className="text-sm text-muted-foreground">No evidence collected yet.</p>
                  )}
                  {data.evidence.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.summary}
                          </p>
                        </div>
                        <Badge variant="outline">{item.provider}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-5 text-xs text-muted-foreground">
                        <span>
                          Captured {new Date(item.capturedAt).toLocaleString()}
                        </span>
                        <span>{item.hash}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* ── Activity tab ──────────────────────────────────────────── */}
            <TabsContent value="activity">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock3 className="h-4 w-4" />
                  <h3 className="text-base font-semibold">Activity history</h3>
                </div>
                <div className="mt-5 space-y-4">
                  {data.activities.length === 0 && (
                    <p className="text-sm text-muted-foreground">No activity recorded.</p>
                  )}
                  {data.activities.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-xl border border-border p-4"
                    >
                      <div
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${activityDotColor(item.type)}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {item.title}
                          </p>
                          {item.type === 'STAKEHOLDER_CHANGED' && (
                            <Badge variant="outline" className="text-xs">
                              Ownership
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.actor} &middot;{' '}
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                        {item.meta && (
                          <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                            <span className="font-medium">
                              {item.meta.field}:
                            </span>{' '}
                            <span className="line-through text-red-600">
                              {item.meta.oldValue}
                            </span>{' '}
                            <ArrowRight className="inline h-3 w-3 text-muted-foreground/70" />{' '}
                            <span className="text-green-700">
                              {item.meta.newValue}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* ── Remediation tab ───────────────────────────────────────── */}
            <TabsContent value="remediation">
              <div className="space-y-6">
                {/* Generated-from origin panel */}
                {data.origin.testId && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 text-foreground">
                      <Link2 className="h-4 w-4" />
                      <h3 className="text-base font-semibold">Generated from</h3>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This risk was created by the risk engine from a failing
                      control test.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Test name
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {data.origin.testName}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Control
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {data.origin.controlName}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border p-4">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Provider
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {data.origin.provider}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTestId(data.origin.testId)}
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        View test detail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/risk/engine')}
                      >
                        <Activity className="mr-1.5 h-3.5 w-3.5" />
                        View in risk engine
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Enriched remediation workflow */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 text-foreground">
                    <Workflow className="h-4 w-4" />
                    <h3 className="text-base font-semibold">
                      Remediation workflow
                    </h3>
                  </div>
                  <div className="mt-5 space-y-4">
                    {data.enrichedRemediationSteps.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No remediation steps defined yet.
                      </p>
                    )}
                    {data.enrichedRemediationSteps.map((step, index) => (
                      <div
                        key={step.label}
                        className="rounded-xl border border-border p-4"
                      >
                        <div className="flex gap-4">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-white">
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              {step.label}
                            </p>

                            {(step.linkedTestId || step.linkedControlName) && (
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {step.linkedTestId && (
                                  <span className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Test: {step.linkedTestId}
                                  </span>
                                )}
                                {step.linkedControlName && (
                                  <span className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Control: {step.linkedControlName}
                                  </span>
                                )}
                              </div>
                            )}

                            {step.failureReason && (
                              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>{step.failureReason}</span>
                              </div>
                            )}

                            {step.affectedResource && (
                              <p className="text-xs text-muted-foreground">
                                Affected resource:{' '}
                                <span className="font-medium text-foreground">
                                  {step.affectedResource}
                                </span>
                              </p>
                            )}

                            {step.recommendedFix && (
                              <p className="text-xs text-muted-foreground">
                                Recommended: {step.recommendedFix}
                              </p>
                            )}

                            {step.evidenceSummary && (
                              <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                                <span className="font-medium">Evidence:</span>{' '}
                                {step.evidenceSummary}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2 pt-1">
                              {step.linkedTestId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    setSelectedTestId(step.linkedTestId ?? null)
                                  }
                                >
                                  <Eye className="mr-1 h-3 w-3" />
                                  View test result
                                </Button>
                              )}
                              {step.evidenceSnapshotId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => navigate('/risk/engine')}
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  View evidence
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* ── Dialogs ──────────────────────────────────────────────────── */}
          {isAdmin && (
            <EditStakeholdersDialog
              open={stakeholderDialogOpen}
              onClose={() => setStakeholderDialogOpen(false)}
              stakeholders={data.stakeholders}
              riskId={riskId}
            />
          )}
          {selectedTestId && (
            <TestDetailPanel
              testId={selectedTestId}
              onClose={() => setSelectedTestId(null)}
            />
          )}
        </div>
      )}
    </PageTemplate>
  );
}
