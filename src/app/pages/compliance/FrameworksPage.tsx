/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { Separator } from '@/app/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import {
  ShieldCheck,
  Target,
  Activity,
  ClipboardList,
  Plus,
  ArrowRight,
  Loader2,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Archive,
  BookOpen,
  Eye,
} from 'lucide-react';
import {
  frameworksService,
  type OrgFrameworkDto,
  type FrameworkDto,
} from '@/services/api/frameworks';
import { authService } from '@/services/api/auth';

// ── Framework icon / color catalog (static metadata) ─────────────────────────
const FRAMEWORK_META: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    description: string;
    requirementCount: number;
  }
> = {
  'iso-27001': {
    icon: ShieldCheck,
    color: 'bg-blue-600',
    description:
      'International standard for information security management systems (ISMS). 93 Annex A controls across 4 themes.',
    requirementCount: 93,
  },
  'soc-2': {
    icon: Target,
    color: 'bg-violet-600',
    description:
      'AICPA Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.',
    requirementCount: 32,
  },
  'nist-csf': {
    icon: Activity,
    color: 'bg-emerald-600',
    description:
      'NIST Cybersecurity Framework 2.0 — 6 functions, 22 categories, 106 subcategories.',
    requirementCount: 106,
  },
  hipaa: {
    icon: ClipboardList,
    color: 'bg-rose-600',
    description:
      'HIPAA Security Rule safeguards for electronic protected health information (ePHI).',
    requirementCount: 20,
  },
};

function getFrameworkMeta(slug: string) {
  return (
    FRAMEWORK_META[slug] ?? {
      icon: BookOpen,
      color: 'bg-gray-600',
      description: 'Compliance framework',
      requirementCount: 0,
    }
  );
}

// ── Status badge helper ───────────────────────────────────────────────────────
function statusBadge(status: OrgFrameworkDto['status']) {
  if (status === 'active')
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200">
        Active
      </Badge>
    );
  if (status === 'setup_in_progress')
    return (
      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
        Setting up
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Archived
    </Badge>
  );
}

// ── Active framework card ─────────────────────────────────────────────────────
function ActiveFrameworkCard({
  orgFw,
  entitled,
  canManageScope,
  onRemove,
  onUpgrade,
}: {
  orgFw: OrgFrameworkDto;
  entitled: boolean;
  canManageScope: boolean;
  onRemove: (orgFw: OrgFrameworkDto) => void;
  onUpgrade: (orgFw: OrgFrameworkDto) => void;
}) {
  const navigate = useNavigate();
  const meta = getFrameworkMeta(orgFw.frameworkSlug);
  const Icon = meta.icon;

  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center flex-shrink-0`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">
                {orgFw.frameworkName}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                v{orgFw.frameworkVersion}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!entitled && (
              <Badge
                variant="outline"
                className="text-amber-700 border-amber-300"
              >
                View only
              </Badge>
            )}
            {statusBadge(orgFw.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Coverage</span>
            <span className="font-semibold text-foreground">
              {orgFw.controlCoveragePct != null
                ? `${orgFw.controlCoveragePct}%`
                : '—%'}
            </span>
          </div>
          <Progress value={orgFw.controlCoveragePct ?? 0} className="h-2" />
          {orgFw.openGaps != null && orgFw.openGaps > 0 && (
            <p className="text-[11px] text-amber-600 mt-1">
              {orgFw.openGaps} open gaps
            </p>
          )}
          {orgFw.controlCoveragePct == null && (
            <p className="text-[11px] text-muted-foreground/70 mt-1">
              No coverage snapshot yet
            </p>
          )}
        </div>
        {orgFw.activatedAt && (
          <p className="text-xs text-muted-foreground/70">
            Activated {new Date(orgFw.activatedAt).toLocaleDateString()}
          </p>
        )}
        <Separator />
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() =>
              navigate(`/compliance/frameworks/${orgFw.frameworkSlug}`)
            }
          >
            View readiness <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
          {canManageScope ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground/70 hover:text-red-600"
              onClick={() => (entitled ? onRemove(orgFw) : onUpgrade(orgFw))}
              title={
                entitled
                  ? 'Remove from active scope'
                  : 'Upgrade to manage scope'
              }
            >
              {entitled ? (
                <Archive className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Available framework card ──────────────────────────────────────────────────
function AvailableFrameworkCard({
  fw,
  entitled,
  canManageScope,
  onActivate,
  onUpgrade,
  activating,
}: {
  fw: FrameworkDto;
  entitled: boolean;
  canManageScope: boolean;
  onActivate: (fw: FrameworkDto) => void;
  onUpgrade: (fw: FrameworkDto) => void;
  activating: boolean;
}) {
  const meta = getFrameworkMeta(fw.slug);
  const Icon = meta.icon;

  return (
    <Card className="border-border shadow-sm opacity-90">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm leading-tight">{fw.name}</CardTitle>
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              v{fw.version} · {meta.requirementCount} requirements
            </p>
          </div>
          {!entitled && (
            <Lock className="w-4 h-4 text-muted-foreground/70 flex-shrink-0 mt-1" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {fw.description ?? meta.description}
        </p>
        <Button
          size="sm"
          variant={entitled && canManageScope ? 'default' : 'outline'}
          className="w-full"
          disabled={activating || (!canManageScope && entitled)}
          onClick={() => {
            if (!canManageScope) return;
            if (entitled) onActivate(fw);
            else onUpgrade(fw);
          }}
        >
          {activating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />{' '}
              Activating…
            </>
          ) : !canManageScope ? (
            <>
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Contact admin
            </>
          ) : entitled ? (
            <>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add to scope
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 mr-1.5" /> Upgrade to add
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function EntitlementDialog({
  framework,
  canManageScope,
  onClose,
}: {
  framework:
    | Pick<FrameworkDto, 'name' | 'slug'>
    | Pick<OrgFrameworkDto, 'frameworkName' | 'frameworkSlug'>
    | null;
  canManageScope: boolean;
  onClose: () => void;
}) {
  if (!framework) return null;
  const name = 'name' in framework ? framework.name : framework.frameworkName;
  const slug = 'slug' in framework ? framework.slug : framework.frameworkSlug;

  return (
    <Dialog open={!!framework} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-500" />
            {canManageScope ? 'Upgrade required' : 'Admin action required'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {canManageScope
              ? `${name} is not included in your current entitlement. Upgrade your plan to activate or manage this framework.`
              : `${name} can be viewed, but only an org admin can add or remove frameworks from active scope.`}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Framework: <span className="font-medium">{name}</span>
          <span className="text-amber-600"> ({slug})</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Remove-from-scope dialog ──────────────────────────────────────────────────
function RemoveDialog({
  orgFw,
  onClose,
  onConfirm,
  loading,
}: {
  orgFw: OrgFrameworkDto | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  if (!orgFw) return null;
  return (
    <Dialog open={!!orgFw} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Remove from active scope?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            <strong>{orgFw.frameworkName}</strong> will be moved to Archived.
            All controls, tests, policies, evidence, and historical reports will
            be preserved. This framework can be re-added at any time.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-1">
          <Label htmlFor="reason" className="text-sm font-medium">
            Reason (optional)
          </Label>
          <Textarea
            id="reason"
            placeholder="e.g. Pausing audit cycle for this quarter…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : null}
            Remove from active scope
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function FrameworksPage() {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cachedUser = authService.getCachedUser();
  const canManageScope =
    cachedUser?.role === 'ORG_ADMIN' || cachedUser?.role === 'SUPER_ADMIN';
  const [removingFw, setRemovingFw] = useState<OrgFrameworkDto | null>(null);
  const [activatingSlug, setActivatingSlug] = useState<string | null>(null);
  const [upgradeTarget, setUpgradeTarget] = useState<
    FrameworkDto | OrgFrameworkDto | null
  >(null);

  const { data: catalogRes, isLoading: catalogLoading } = useQuery({
    queryKey: ['frameworks', 'catalog'],
    queryFn: () => frameworksService.listCatalog(),
  });

  const { data: orgFwRes, isLoading: orgFwLoading } = useQuery({
    queryKey: ['frameworks', 'org'],
    queryFn: () => frameworksService.listOrgFrameworks(),
  });

  const catalog: FrameworkDto[] = useMemo(
    () => catalogRes?.data ?? [],
    [catalogRes?.data],
  );
  const orgFrameworks: OrgFrameworkDto[] = useMemo(
    () => orgFwRes?.data ?? [],
    [orgFwRes?.data],
  );

  const entitlementQueries = useQueries({
    queries: [
      ...catalog,
      ...orgFrameworks.map((fw) => ({ slug: fw.frameworkSlug })),
    ].map((fw) => ({
      queryKey: ['frameworks', 'entitlement', fw.slug],
      queryFn: () => frameworksService.checkEntitlement(fw.slug),
      staleTime: 60_000,
      enabled: !!fw.slug,
    })),
  });

  const entitlementMap = useMemo(() => {
    const entries = [
      ...catalog,
      ...orgFrameworks.map((fw) => ({ slug: fw.frameworkSlug })),
    ].map(
      (fw, index) =>
        [
          fw.slug,
          entitlementQueries[index]?.data?.data?.entitled ?? true,
        ] as const,
    );
    return Object.fromEntries(entries);
  }, [catalog, entitlementQueries, orgFrameworks]);

  // Slugs already active for this org
  const activeSlugSet = new Set(orgFrameworks.map((f) => f.frameworkSlug));

  // Available = in catalog but not yet active for this org
  const available = catalog.filter((fw) => !activeSlugSet.has(fw.slug));

  const activateMutation = useMutation({
    mutationFn: (fw: FrameworkDto) =>
      frameworksService.activateFramework({ frameworkSlug: fw.slug }),
    onMutate: (fw) => setActivatingSlug(fw.slug),
    onSuccess: (res, fw) => {
      qc.invalidateQueries({ queryKey: ['frameworks', 'org'] });
      // Redirect to activation summary screen
      navigate(`/compliance/frameworks/${fw.slug}/activated`, {
        state: {
          summary: res.summary,
          orgFramework: res.data,
        },
      });
    },
    onError: (err: any, fw) => {
      if (err?.error === 'FRAMEWORK_NOT_ENTITLED' || err?.statusCode === 403) {
        setUpgradeTarget(fw);
      }
      setActivatingSlug(null);
    },
    onSettled: () => {
      setActivatingSlug(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      frameworksService.removeFramework(slug, { reason }),
    onSettled: () => {
      setRemovingFw(null);
      qc.invalidateQueries({ queryKey: ['frameworks', 'org'] });
    },
  });

  const loading = catalogLoading || orgFwLoading;

  return (
    <PageTemplate
      title={t('frameworks.title')}
      description={t('frameworks.description')}
    >
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin text-muted-foreground/70" />
        </div>
      )}

      {!loading && (
        <div className="space-y-10">
          {/* ── Active frameworks ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  {t('frameworks.activeFrameworks')}
                  {orgFrameworks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {orgFrameworks.length}
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('frameworks.activeDesc')}
                </p>
              </div>
            </div>

            {orgFrameworks.length === 0 ? (
              <Card className="border-dashed border-border bg-muted">
                <CardContent className="py-12 text-center">
                  <ShieldCheck className="w-10 h-10 text-muted-foreground/70 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('frameworks.noFrameworks')}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {t('frameworks.noFrameworksDesc')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {orgFrameworks.map((fw) => (
                  <ActiveFrameworkCard
                    key={fw.id}
                    orgFw={fw}
                    entitled={entitlementMap[fw.frameworkSlug] ?? true}
                    canManageScope={canManageScope}
                    onRemove={setRemovingFw}
                    onUpgrade={setUpgradeTarget}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Available frameworks ── */}
          {available.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  {t('frameworks.availableFrameworks')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('frameworks.availableDesc')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {available.map((fw) => (
                  <AvailableFrameworkCard
                    key={fw.id}
                    fw={fw}
                    entitled={entitlementMap[fw.slug] ?? true}
                    canManageScope={canManageScope}
                    onActivate={(f) => activateMutation.mutate(f)}
                    onUpgrade={setUpgradeTarget}
                    activating={activatingSlug === fw.slug}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Remove dialog */}
      <RemoveDialog
        orgFw={removingFw}
        onClose={() => setRemovingFw(null)}
        onConfirm={(reason) =>
          removingFw &&
          removeMutation.mutate({ slug: removingFw.frameworkSlug, reason })
        }
        loading={removeMutation.isPending}
      />

      <EntitlementDialog
        framework={upgradeTarget}
        canManageScope={canManageScope}
        onClose={() => setUpgradeTarget(null)}
      />
    </PageTemplate>
  );
}
