import { EditStakeholdersDialog } from './riskDetail/EditStakeholdersDialog';
import {
  IMPACT_LEVELS,
  InlineSelect,
  LIKELIHOOD_LEVELS,
  STATUS_OPTIONS,
  TREATMENT_OPTIONS,
  calcScore,
  errorMessage,
  scoreBgColor,
  scoreColor,
} from './riskDetail/shared';
import { ActivityTab } from './riskDetail/ActivityTab';
import { ControlsMappingSection } from './riskDetail/ControlsMappingSection';
import { EvidenceTab } from './riskDetail/EvidenceTab';
import { FindingsTab } from './riskDetail/FindingsTab';
import { RemediationTab } from './riskDetail/RemediationTab';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';

import {
  Loader2,
  ArrowLeft,
  Pencil,
  Target,
  Shield,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { riskCenterService } from '@/services/api/riskCenter';
import {
  riskLibraryService,
  type UpdateRegisterEntryRequest,
} from '@/services/api/risk-library';
import { scanFindingsService } from '@/services/api/scan-findings';
import { usersService } from '@/services/api/users';
import { controlsService } from '@/services/api/controls';
import { frameworksService } from '@/services/api/frameworks';
import { policiesService } from '@/services/api/policies';
import { riskStatusVariant } from '@/services/api/riskFormatting';
import { useIsAdmin } from '@/hooks/useCurrentUser';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';
import { TestDetailPanel } from '@/app/pages/tests/TestDetailPanel';

// ─── Constants ────────────────────────────────────────────────────────────────

export function RiskDetailPage() {
  const { t } = useTranslation('risk');
  const navigate = useNavigate();
  const { riskId = '' } = useParams();
  const isAdmin = useIsAdmin();
  const qc = useQueryClient();
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  );

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
    mutationFn: (controlId: string) =>
      riskLibraryService.linkControl(riskId, controlId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) });
      setShowControlPicker(false);
    },
  });

  const unlinkControlMut = useMutation({
    mutationFn: (controlId: string) =>
      riskLibraryService.unlinkControl(riskId, controlId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) }),
  });

  const linkFrameworkMut = useMutation({
    mutationFn: (frameworkId: string) =>
      riskLibraryService.linkFramework(riskId, frameworkId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) });
      setShowFrameworkPicker(false);
    },
  });

  const unlinkFrameworkMut = useMutation({
    mutationFn: (frameworkId: string) =>
      riskLibraryService.unlinkFramework(riskId, frameworkId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: QK.riskMappings(riskId) }),
  });

  // R3a — Risk ↔ Policy treatment linkage
  const { data: treatmentPoliciesRes } = useQuery({
    queryKey: QK.riskTreatmentPolicies(riskId),
    queryFn: () => riskLibraryService.listTreatmentPolicies(riskId),
    enabled: Boolean(riskId),
  });
  const treatmentPolicies = treatmentPoliciesRes?.data ?? [];

  const { data: allPolicies, isLoading: policiesLoading } = useQuery({
    queryKey: ['policies', 'all-for-picker'],
    queryFn: async () => {
      const res = await policiesService.getPolicies();
      const arr = res.data;
      return Array.isArray(arr) ? arr : [];
    },
    enabled: Boolean(data),
  });

  const [showPolicyPicker, setShowPolicyPicker] = useState(false);

  const linkPolicyMut = useMutation({
    mutationFn: (policyId: string) =>
      riskLibraryService.linkTreatmentPolicy(riskId, policyId),
    onSuccess: (response) => {
      const policy = response.data?.policy;
      toast.success(`${policy?.name ?? 'Policy'} linked as a treatment`);
      qc.invalidateQueries({ queryKey: QK.riskTreatmentPolicies(riskId) });
      if (response.data?.policyId) {
        qc.invalidateQueries({
          queryKey: QK.policyTreatmentRisks(response.data.policyId),
        });
      }
      setShowPolicyPicker(false);
    },
    onError: (error) =>
      toast.error(errorMessage(error, 'Failed to link treatment policy')),
  });

  const unlinkPolicyMut = useMutation({
    mutationFn: (policyId: string) =>
      riskLibraryService.unlinkTreatmentPolicy(riskId, policyId),
    onSuccess: (_, policyId) => {
      const removed = treatmentPolicies.find(
        (link) => link.policyId === policyId,
      );
      toast.success(
        `${removed?.policy.name ?? 'Policy'} removed from treatments`,
      );
      qc.invalidateQueries({ queryKey: QK.riskTreatmentPolicies(riskId) });
      qc.invalidateQueries({ queryKey: QK.policyTreatmentRisks(policyId) });
    },
    onError: (error) =>
      toast.error(errorMessage(error, 'Failed to remove treatment policy')),
  });

  const linkedPolicyIds = new Set(treatmentPolicies.map((p) => p.policyId));
  const availablePolicies = (allPolicies ?? []).filter(
    (p) => !linkedPolicyIds.has(p.id),
  );

  // Compute which controls/frameworks are already linked (to exclude from pickers)
  const linkedControlIds = new Set(
    mappingsData?.controls?.map((c) => c.controlId) ?? [],
  );
  const linkedFrameworkIds = new Set(
    mappingsData?.frameworks?.map((f) => f.frameworkId) ?? [],
  );

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
      // AI-risk toggle feeds the AI Trust dashboard openAiRisks card.
      qc.invalidateQueries({ queryKey: ['ai-trust', 'dashboard'] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  function saveField(fields: UpdateRegisterEntryRequest) {
    setSaveStatus('saving');
    updateMutation.mutate(fields);
  }

  // Computed scores
  const inherentScore = calcScore(
    draft.inherentImpact || 'MEDIUM',
    draft.inherentLikelihood || 'MEDIUM',
  );
  const residualScore = calcScore(
    draft.residualImpact || 'MEDIUM',
    draft.residualLikelihood || 'MEDIUM',
  );

  return (
    <PageTemplate
      title={t('detail.title')}
      description=""
      actions={
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />{' '}
              {t('detail.saving')}
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t('detail.saved')}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/risk/risks')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('detail.backToRegister')}
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
          {t('detail.notFound')}
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
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  onBlur={() => {
                    if (draft.description !== (reg?.description ?? '')) {
                      saveField({ description: draft.description });
                    }
                  }}
                  rows={2}
                  className="mt-2 w-full resize-none rounded-md border border-transparent bg-transparent px-0 py-1 text-sm leading-6 text-muted-foreground hover:border-border focus:border-border focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={t('detail.descriptionPlaceholder')}
                />
                {/* AI TrustOps: tag as an AI-related risk */}
                <label className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Switch
                    checked={reg?.isAiRisk ?? false}
                    onCheckedChange={(v) => saveField({ isAiRisk: v })}
                  />
                  AI-related risk
                </label>
              </div>

              {/* Score cards */}
              <div className="grid min-w-[220px] gap-3 sm:grid-cols-2">
                <div
                  className={`rounded-xl border p-4 ${scoreBgColor(inherentScore)}`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('detail.inherent')}
                  </p>
                  <p
                    className={`mt-1 text-3xl font-bold ${scoreColor(inherentScore)}`}
                  >
                    {inherentScore}
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-4 ${scoreBgColor(residualScore)}`}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('detail.residual')}
                  </p>
                  <p
                    className={`mt-1 text-3xl font-bold ${scoreColor(residualScore)}`}
                  >
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
                  <h3 className="text-base font-semibold">
                    {t('detail.assessment.title')}
                  </h3>
                </div>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  {/* Inherent Risk */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      {t('detail.assessment.inherentRisk')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('detail.assessment.inherentDesc')}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t('detail.assessment.impact')}
                        </label>
                        <InlineSelect
                          value={draft.inherentImpact}
                          options={IMPACT_LEVELS.map((v) => ({
                            value: v,
                            label: t(`impact.${v}`),
                          }))}
                          onChange={(val) => {
                            setDraft((d) => ({ ...d, inherentImpact: val }));
                            saveField({
                              inherentImpact: val,
                              inherentLikelihood:
                                draft.inherentLikelihood || undefined,
                            });
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t('detail.assessment.likelihood')}
                        </label>
                        <InlineSelect
                          value={draft.inherentLikelihood}
                          options={LIKELIHOOD_LEVELS.map((v) => ({
                            value: v,
                            label: t(`impact.${v}`),
                          }))}
                          onChange={(val) => {
                            setDraft((d) => ({
                              ...d,
                              inherentLikelihood: val,
                            }));
                            saveField({
                              inherentLikelihood: val,
                              inherentImpact: draft.inherentImpact || undefined,
                            });
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div
                      className={`rounded-lg border px-3 py-2 text-center ${scoreBgColor(inherentScore)}`}
                    >
                      <span className="text-xs text-muted-foreground">
                        {t('detail.assessment.score')}{' '}
                      </span>
                      <span
                        className={`text-lg font-bold ${scoreColor(inherentScore)}`}
                      >
                        {inherentScore}
                      </span>
                    </div>
                  </div>

                  {/* Residual Risk */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      {t('detail.assessment.residualRisk')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('detail.assessment.residualDesc')}
                    </p>
                    <div className="space-y-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t('detail.assessment.impact')}
                        </label>
                        <InlineSelect
                          value={draft.residualImpact}
                          options={IMPACT_LEVELS.map((v) => ({
                            value: v,
                            label: t(`impact.${v}`),
                          }))}
                          onChange={(val) => {
                            setDraft((d) => ({ ...d, residualImpact: val }));
                            saveField({
                              residualImpact: val,
                              residualLikelihood:
                                draft.residualLikelihood || undefined,
                            });
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted-foreground">
                          {t('detail.assessment.likelihood')}
                        </label>
                        <InlineSelect
                          value={draft.residualLikelihood}
                          options={LIKELIHOOD_LEVELS.map((v) => ({
                            value: v,
                            label: t(`impact.${v}`),
                          }))}
                          onChange={(val) => {
                            setDraft((d) => ({
                              ...d,
                              residualLikelihood: val,
                            }));
                            saveField({
                              residualLikelihood: val,
                              residualImpact: draft.residualImpact || undefined,
                            });
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div
                      className={`rounded-lg border px-3 py-2 text-center ${scoreBgColor(residualScore)}`}
                    >
                      <span className="text-xs text-muted-foreground">
                        {t('detail.assessment.score')}{' '}
                      </span>
                      <span
                        className={`text-lg font-bold ${scoreColor(residualScore)}`}
                      >
                        {residualScore}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── Treatment Plan ──────────────────────────────────────── */}
              <Card className="p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4" />
                  <h3 className="text-base font-semibold">
                    {t('detail.treatmentPlan.title')}
                  </h3>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      {t('detail.treatmentPlan.strategy')}
                    </label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {TREATMENT_OPTIONS.filter((o) => o.value).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setDraft((d) => ({ ...d, treatment: opt.value }));
                            saveField({ treatment: opt.value });
                          }}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                            draft.treatment === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-border bg-card text-muted-foreground hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          {t(`treatment.${opt.value}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      {t('detail.treatmentPlan.notes')}
                    </label>
                    <textarea
                      value={draft.treatmentNotes}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          treatmentNotes: e.target.value,
                        }))
                      }
                      onBlur={() => {
                        if (
                          draft.treatmentNotes !== (reg?.treatmentNotes ?? '')
                        ) {
                          saveField({ treatmentNotes: draft.treatmentNotes });
                        }
                      }}
                      rows={3}
                      className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('detail.treatmentPlan.notesPlaceholder')}
                    />
                  </div>

                  {/* R3a — Treatment Policies */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Treatment Policies
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowPolicyPicker((p) => !p)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                    </div>

                    {showPolicyPicker && (
                      <div className="mt-2 rounded-lg border border-border bg-card p-3">
                        {policiesLoading ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading policies…
                          </div>
                        ) : availablePolicies.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {(allPolicies ?? []).length > 0
                              ? 'All policies are already linked.'
                              : 'No policies available.'}
                          </p>
                        ) : (
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value)
                                linkPolicyMut.mutate(e.target.value);
                            }}
                            disabled={linkPolicyMut.isPending}
                            className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a policy…</option>
                            {availablePolicies.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (v{p.versionNumber}) — {p.status}
                              </option>
                            ))}
                          </select>
                        )}
                        {linkPolicyMut.isPending && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Linking…
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      {treatmentPolicies.length > 0 ? (
                        treatmentPolicies.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {link.policy.name}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                v{link.policy.versionNumber} ·{' '}
                                {link.policy.status}
                                {link.policy.owner
                                  ? ` · ${link.policy.owner.name ?? link.policy.owner.email}`
                                  : ''}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                unlinkPolicyMut.mutate(link.policyId)
                              }
                              disabled={unlinkPolicyMut.isPending}
                              className="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                              title="Remove policy"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No treatment policies linked.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── Controls & Framework mapping ────────────────────────── */}
              <ControlsMappingSection
                mappingsData={mappingsData}
                allControls={allControls}
                allFrameworks={allFrameworks}
                linkedControlIds={linkedControlIds}
                linkedFrameworkIds={linkedFrameworkIds}
                showControlPicker={showControlPicker}
                setShowControlPicker={setShowControlPicker}
                showFrameworkPicker={showFrameworkPicker}
                setShowFrameworkPicker={setShowFrameworkPicker}
                linkControlMut={linkControlMut}
                unlinkControlMut={unlinkControlMut}
                linkFrameworkMut={linkFrameworkMut}
                unlinkFrameworkMut={unlinkFrameworkMut}
              />
            </div>

            {/* ── Right sidebar: Details ────────────────────────────────── */}
            <div className="space-y-6">
              {/* Details card */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-foreground">
                  {t('detail.details.title')}
                </h3>
                <div className="mt-4 space-y-4">
                  {/* Status */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('detail.details.status')}
                    </label>
                    <InlineSelect
                      value={draft.status}
                      options={STATUS_OPTIONS.map((s) => ({
                        value: s,
                        label: t(`status.${s}`),
                      }))}
                      onChange={(val) => {
                        setDraft((d) => ({ ...d, status: val }));
                        saveField({ status: val });
                      }}
                      className="w-full"
                    />
                  </div>

                  {/* Owner */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('detail.details.owner')}
                    </label>
                    <select
                      value={draft.ownerId ?? ''}
                      onChange={(e) => {
                        const val = e.target.value || null;
                        setDraft((d) => ({ ...d, ownerId: val }));
                        saveField({ ownerId: val });
                      }}
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('detail.details.unassigned')}</option>
                      {usersData?.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Review Due Date */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('detail.details.reviewDueDate')}
                    </label>
                    <input
                      type="date"
                      value={draft.reviewDueAt}
                      onChange={(e) => {
                        setDraft((d) => ({
                          ...d,
                          reviewDueAt: e.target.value,
                        }));
                        saveField({ reviewDueAt: e.target.value || null });
                      }}
                      className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('detail.details.category')}
                    </label>
                    <p className="text-sm text-foreground">
                      {data.risk.category}
                    </p>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('detail.details.source')}
                    </label>
                    <p className="text-sm text-foreground">
                      {data.risk.source}
                    </p>
                  </div>

                  {/* Created */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {t('detail.details.created')}
                    </label>
                    <p className="text-sm text-foreground">
                      {new Date(data.risk.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Stakeholders card */}
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('detail.stakeholders.title')}
                  </h3>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setStakeholderDialogOpen(true)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      {t('detail.stakeholders.edit')}
                    </Button>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  {data.stakeholders.length > 0 ? (
                    data.stakeholders.map((person) => (
                      <div
                        key={person.role}
                        className="rounded-lg bg-muted px-3 py-2.5"
                      >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {person.role}
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {person.name}
                        </p>
                        {person.team && (
                          <p className="text-xs text-muted-foreground">
                            {person.team}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t('detail.stakeholders.noStakeholders')}
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* ── Tabs ─────────────────────────────────────────────────────── */}
          <Tabs defaultValue="findings" className="gap-4">
            <TabsList>
              <TabsTrigger value="findings">
                {t('detail.tabs.findings')}
                {findingsData?.meta ? ` (${findingsData.meta.open})` : ''}
              </TabsTrigger>
              <TabsTrigger value="evidence">
                {t('detail.tabs.evidence')}
              </TabsTrigger>
              <TabsTrigger value="activity">
                {t('detail.tabs.activity')}
              </TabsTrigger>
              <TabsTrigger value="remediation">
                {t('detail.tabs.remediation')}
              </TabsTrigger>
            </TabsList>

            {/* ── Findings tab ─────────────────────────────────────────── */}
            <TabsContent value="findings">
              <FindingsTab findingsData={findingsData} />
            </TabsContent>

            {/* ── Evidence tab ───────────────────────────────────────────── */}
            <TabsContent value="evidence">
              <EvidenceTab data={data} />
            </TabsContent>

            {/* ── Activity tab ──────────────────────────────────────────── */}
            <TabsContent value="activity">
              <ActivityTab data={data} />
            </TabsContent>

            {/* ── Remediation tab ───────────────────────────────────────── */}
            <TabsContent value="remediation">
              <RemediationTab
                data={data}
                navigate={navigate}
                setSelectedTestId={setSelectedTestId}
              />
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
