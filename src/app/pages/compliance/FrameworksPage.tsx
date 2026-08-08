/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  Eye,
  FileText,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Archive,
  AlertTriangle,
  Search,
} from 'lucide-react';

import { PageTemplate } from '@/app/components/PageTemplate';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/app/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { FRAMEWORK_CATALOG } from '@/app/pages/compliance/frameworkCatalog/catalogConfig';
import { authService } from '@/services/api/auth';
import {
  frameworksService,
  type FrameworkDto,
  type FrameworkRecommendationDto,
  type OrgFrameworkCardDto,
} from '@/services/api/frameworks';
import { QK } from '@/lib/queryKeys';

const FRAMEWORK_META: Record<
  string,
  { color: string; requirementCount: number }
> = {
  'iso-27001': { color: 'bg-blue-600', requirementCount: 93 },
  'soc-2': { color: 'bg-violet-600', requirementCount: 32 },
  'nist-csf': { color: 'bg-emerald-600', requirementCount: 106 },
  hipaa: { color: 'bg-rose-600', requirementCount: 20 },
  // T-102: ISO/IEC 42001 AI management system.
  'iso-42001': { color: 'bg-fuchsia-600', requirementCount: 70 },
};

function ProgressRing({ value, label }: { value: number; label: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative h-20 w-20 cursor-default">
          <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-muted/40"
            />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              className="text-primary transition-all"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground">
            {progress}%
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function statusBadge(status: OrgFrameworkCardDto['status']) {
  if (status === 'active')
    return (
      <Badge className="border-green-200 bg-green-100 text-green-700">
        Active
      </Badge>
    );
  if (status === 'setup_in_progress')
    return (
      <Badge className="border-amber-200 bg-amber-100 text-amber-700">
        Setting up
      </Badge>
    );
  return <Badge variant="outline">Archived</Badge>;
}

type CatalogCardData = {
  fw: FrameworkDto;
  isActive: boolean;
  coveragePct: number | null;
  openGaps: number | null;
  overlapPct: number | null;
  /** Six-state catalog flag computed by the backend; falls back to NOT_PURCHASED. */
  accessState: NonNullable<FrameworkDto['accessState']>;
  pendingRequestId: string | null;
  domains: string[];
};

function FrameworkCatalogCard({
  card,
  canManageScope,
  isOrgAdmin,
  onActivate,
  onUpgrade,
  onRequestAccess,
}: {
  card: CatalogCardData;
  canManageScope: boolean;
  isOrgAdmin: boolean;
  onActivate: (fw: FrameworkDto) => void;
  onUpgrade: (fw: FrameworkDto) => void;
  onRequestAccess: (fw: FrameworkDto) => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('compliance');
  const meta = FRAMEWORK_META[card.fw.slug] ?? {
    color: 'bg-slate-600',
    requirementCount: 0,
  };
  const catalogMeta = FRAMEWORK_CATALOG[card.fw.slug];
  const value = card.isActive
    ? (card.coveragePct ?? 0)
    : (card.overlapPct ?? 0);
  const tooltip = card.isActive
    ? t('frameworks.coverageTooltip', { pct: value })
    : t('frameworks.overlapTooltip', { pct: value });

  return (
    <Card className="h-full border-border bg-gradient-to-br from-white to-slate-50/50 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${meta.color} text-sm font-semibold text-white`}
            >
              {card.fw.name.slice(0, 1)}
            </div>
            <CardTitle className="text-base">{card.fw.name}</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              v{card.fw.version} · {meta.requirementCount}{' '}
              {t('frameworks.requirements')}
            </p>
            {catalogMeta?.tagline ? (
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {catalogMeta.tagline}
              </p>
            ) : null}
          </div>
          {card.isActive ? statusBadge('active') : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {card.domains.map((domain) => (
            <Badge key={domain} variant="outline" className="text-xs">
              {domain}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="flex items-center gap-4">
          <ProgressRing value={value} label={tooltip} />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {card.isActive
                ? t('frameworks.coverage')
                : t('frameworks.headStart')}
            </p>
            <p className="mt-1 text-xs leading-5">
              {card.isActive
                ? t('frameworks.coverageTooltip', { pct: value })
                : t('frameworks.overlapTooltip', { pct: value })}
            </p>
            {card.isActive && card.openGaps != null ? (
              <p className="mt-2 text-xs text-amber-600">
                {t('frameworks.openGaps', { count: card.openGaps })}
              </p>
            ) : null}
          </div>
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
          {card.fw.description ?? catalogMeta?.overview}
        </p>
        <div className="flex flex-wrap gap-2">
          {card.isActive ? (
            <Button
              onClick={() => navigate(`/compliance/frameworks/${card.fw.slug}`)}
            >
              {t('frameworks.manageFramework')}{' '}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/compliance/frameworks/${card.fw.slug}/explore`)
              }
            >
              {t('frameworks.exploreFramework')}
            </Button>
          )}
          {/* CTA driven by accessState — see FrameworkDto.accessState. */}
          {!card.isActive &&
            (() => {
              switch (card.accessState) {
                case 'PURCHASED_NOT_ACTIVE':
                  if (!canManageScope) {
                    return (
                      <Button variant="outline" disabled>
                        <Eye className="mr-1 h-4 w-4" />{' '}
                        {t('frameworks.contactAdmin')}
                      </Button>
                    );
                  }
                  return (
                    <Button onClick={() => onActivate(card.fw)}>
                      <Plus className="mr-1 h-4 w-4" />{' '}
                      {t('frameworks.activateFramework', {
                        name: card.fw.name,
                      })}
                    </Button>
                  );
                case 'PENDING_REQUEST':
                  return (
                    <Button variant="outline" disabled>
                      <Lock className="mr-1 h-4 w-4" />{' '}
                      {t('frameworks.requestPending')}
                    </Button>
                  );
                case 'PARTIAL_GRANT':
                  return (
                    <Button
                      variant="outline"
                      disabled
                      title={t('frameworks.partialGrantTitle')}
                    >
                      <Lock className="mr-1 h-4 w-4" />{' '}
                      {t('frameworks.partialGrant')}
                    </Button>
                  );
                case 'NOT_PURCHASED':
                default:
                  if (isOrgAdmin) {
                    return (
                      <Button
                        variant="outline"
                        onClick={() => onRequestAccess(card.fw)}
                      >
                        <Lock className="mr-1 h-4 w-4" />{' '}
                        {t('frameworks.requestAccess')}
                      </Button>
                    );
                  }
                  return (
                    <Button
                      variant="outline"
                      disabled
                      onClick={() => onUpgrade(card.fw)}
                    >
                      <Lock className="mr-1 h-4 w-4" />{' '}
                      {t('frameworks.upgradeRequired')}
                    </Button>
                  );
              }
            })()}
        </div>
      </CardContent>
    </Card>
  );
}

function EntitlementDialog({
  framework,
  canManageScope,
  onClose,
}: {
  framework: Pick<FrameworkDto, 'name' | 'slug'> | null;
  canManageScope: boolean;
  onClose: () => void;
}) {
  if (!framework) return null;
  return (
    <Dialog open={!!framework} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" />
            {canManageScope ? 'Upgrade required' : 'Admin action required'}
          </DialogTitle>
          <DialogDescription>
            {canManageScope
              ? `${framework.name} is not included in your current entitlement.`
              : `${framework.name} can be explored, but only an admin can activate it.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveDialog({
  orgFw,
  onClose,
  onConfirm,
  loading,
}: {
  orgFw: OrgFrameworkCardDto | null;
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
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Remove from active scope?
          </DialogTitle>
          <DialogDescription>
            {orgFw.frameworkName} will be moved to Archived.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FrameworksPage() {
  const { t } = useTranslation('compliance');
  const qc = useQueryClient();
  const navigate = useNavigate();
  const cachedUser = authService.getCachedUser();
  const canManageScope =
    cachedUser?.role === 'ORG_ADMIN' || cachedUser?.role === 'SUPER_ADMIN';
  const isOrgAdmin = cachedUser?.role === 'ORG_ADMIN';
  // Read ?tab= from the URL so notifications and other deep-links can land
  // directly on the Available tab (e.g. when a request is approved).
  const initialTab = (() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'available' || tab === 'updates' || tab === 'active')
      return tab;
    return 'active';
  })();
  const [activeTab, setActiveTab] = useState<
    'active' | 'available' | 'updates'
  >(initialTab);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [release, setRelease] = useState('ALL');
  const [removingFw, setRemovingFw] = useState<OrgFrameworkCardDto | null>(
    null,
  );
  const [upgradeTarget, setUpgradeTarget] = useState<FrameworkDto | null>(null);

  const { data: orgFwRes, isLoading: orgFwLoading } = useQuery({
    queryKey: QK.orgFrameworks(),
    queryFn: () => frameworksService.listOrgFrameworks('card'),
  });
  const { data: catalogRes, isLoading: catalogLoading } = useQuery({
    queryKey: QK.frameworkCatalog(),
    queryFn: () => frameworksService.listCatalog(),
  });
  const { data: entitlementsRes } = useQuery({
    queryKey: QK.entitlements(),
    queryFn: () => frameworksService.listEntitlements(),
  });
  const { data: recommendationsRes } = useQuery({
    queryKey: QK.frameworkRecommendations(),
    queryFn: () => frameworksService.getRecommendations(),
    enabled: !orgFwLoading,
  });

  const orgFrameworks = useMemo(
    () => (orgFwRes?.data ?? []) as OrgFrameworkCardDto[],
    [orgFwRes?.data],
  );
  const catalog = useMemo(() => catalogRes?.data ?? [], [catalogRes?.data]);
  const recommendationRows = useMemo(
    () => (recommendationsRes?.data ?? []) as FrameworkRecommendationDto[],
    [recommendationsRes?.data],
  );

  const activeMap = useMemo(
    () => new Map(orgFrameworks.map((fw) => [fw.frameworkSlug, fw])),
    [orgFrameworks],
  );
  const recMap = useMemo(
    () => new Map(recommendationRows.map((row) => [row.slug, row])),
    [recommendationRows],
  );
  const entitlementSet = useMemo(
    () =>
      new Set(
        (entitlementsRes?.data ?? [])
          .filter((entry) => entry.isActive)
          .map((entry) => entry.frameworkSlug),
      ),
    [entitlementsRes?.data],
  );

  const allFrameworkCards = useMemo<CatalogCardData[]>(
    () =>
      catalog.map((fw) => {
        // Backend annotates each catalog row with accessState. When it is missing
        // (legacy/SUPER_ADMIN response), fall back to the existing client-side
        // signals so the card still renders sensibly.
        const fallbackState: CatalogCardData['accessState'] = activeMap.has(
          fw.slug,
        )
          ? 'ACTIVE'
          : entitlementSet.has(fw.slug)
            ? 'PURCHASED_NOT_ACTIVE'
            : 'NOT_PURCHASED';
        return {
          fw,
          isActive: activeMap.has(fw.slug) || fw.accessState === 'ACTIVE',
          coveragePct: activeMap.get(fw.slug)?.controlCoveragePct ?? null,
          openGaps: activeMap.get(fw.slug)?.openGaps ?? null,
          overlapPct: recMap.get(fw.slug)?.overlapPct ?? null,
          accessState: fw.accessState ?? fallbackState,
          pendingRequestId: fw.pendingRequestId ?? null,
          domains: FRAMEWORK_CATALOG[fw.slug]?.domains ?? [],
        };
      }),
    [catalog, activeMap, recMap, entitlementSet],
  );

  const recommendations = allFrameworkCards
    .filter((card) => !card.isActive)
    .slice(0, 2);
  const filteredCards = allFrameworkCards.filter((card) => {
    const searchValue = search.trim().toLowerCase();
    const matchesSearch =
      !searchValue ||
      card.fw.name.toLowerCase().includes(searchValue) ||
      (card.fw.description ?? '').toLowerCase().includes(searchValue);
    const matchesCategory =
      category === 'ALL' || card.domains.includes(category);
    const matchesRelease = release === 'ALL' || card.fw.version === release;
    return matchesSearch && matchesCategory && matchesRelease;
  });

  const activateMutation = useMutation({
    mutationFn: (fw: FrameworkDto) =>
      frameworksService.activateFramework({ frameworkSlug: fw.slug }),
    onSuccess: (res, fw) => {
      qc.invalidateQueries({ queryKey: QK.orgFrameworks() });
      navigate(`/compliance/frameworks/${fw.slug}/activated`, {
        state: { summary: res.summary, orgFramework: res.data },
      });
    },
    onError: (err: any, fw) => {
      if (err?.error === 'FRAMEWORK_NOT_ENTITLED' || err?.statusCode === 403)
        setUpgradeTarget(fw);
    },
  });

  const requestAccessMutation = useMutation({
    mutationFn: (fw: FrameworkDto) =>
      frameworksService.requestFrameworkAccess(fw.slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.frameworkCatalog() });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ slug, reason }: { slug: string; reason: string }) =>
      frameworksService.removeFramework(slug, { reason }),
    onSettled: () => {
      setRemovingFw(null);
      qc.invalidateQueries({ queryKey: QK.orgFrameworks() });
    },
  });

  const loading = catalogLoading || orgFwLoading;
  const domainOptions = Array.from(
    new Set(Object.values(FRAMEWORK_CATALOG).flatMap((entry) => entry.domains)),
  );
  const releaseOptions = Array.from(
    new Set(catalog.map((fw) => fw.version)),
  ).sort();
  const filteredRecommendationSlugs = new Set(
    filteredCards.filter((card) => !card.isActive).map((card) => card.fw.slug),
  );
  const visibleRecommendations = recommendations.filter((card) =>
    filteredRecommendationSlugs.has(card.fw.slug),
  );

  return (
    <PageTemplate
      title={t('frameworks.title')}
      description={t('frameworks.description')}
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/70" />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="space-y-6"
        >
          <TabsList className="h-auto flex-wrap justify-start rounded-2xl bg-slate-100 p-1">
            <TabsTrigger value="active">
              {t('frameworks.activeFrameworks')} ({orgFrameworks.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              {t('frameworks.tabAvailable')} (
              {allFrameworkCards.length - orgFrameworks.length})
            </TabsTrigger>
            <TabsTrigger value="updates">
              {t('frameworks.tabUpdateNotes')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-0">
            {orgFrameworks.length === 0 ? (
              <Card className="border-dashed border-border bg-muted">
                <CardContent className="py-12 text-center">
                  <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/70" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('frameworks.noFrameworks')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {t('frameworks.noFrameworksDesc')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {orgFrameworks.map((fw) => (
                  <Card
                    key={fw.id}
                    className="border-border shadow-sm hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">
                            {fw.frameworkName}
                          </CardTitle>
                          <p className="mt-1 text-xs text-muted-foreground">
                            v{fw.frameworkVersion}
                          </p>
                        </div>
                        {statusBadge(fw.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ProgressRing
                        value={fw.controlCoveragePct ?? 0}
                        label={t('frameworks.coverageTooltip', {
                          pct: fw.controlCoveragePct ?? 0,
                        })}
                      />
                      {fw.openGaps != null ? (
                        <p className="text-xs text-amber-600">
                          {t('frameworks.openGaps', { count: fw.openGaps })}
                        </p>
                      ) : null}
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            navigate(
                              `/compliance/frameworks/${fw.frameworkSlug}`,
                            )
                          }
                        >
                          {t('frameworks.manageFramework')}
                        </Button>
                        {canManageScope ? (
                          <Button
                            variant="ghost"
                            onClick={() => setRemovingFw(fw)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-6 mt-0">
            <Card className="p-4">
              <div className="grid gap-3 md:grid-cols-[1.8fr_1fr_1fr_auto]">
                <label className="relative block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('frameworks.searchAvailable')}
                    className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm"
                  />
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="ALL">{t('frameworks.filterCategory')}</option>
                  {domainOptions.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
                <select
                  value={release}
                  onChange={(e) => setRelease(e.target.value)}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="ALL">Release</option>
                  {releaseOptions.map((version) => (
                    <option key={version} value={version}>
                      {version}
                    </option>
                  ))}
                </select>
                <a
                  href="mailto:hello@cloudanzen.com?subject=Framework%20request"
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
                >
                  {t('frameworks.lookingForFramework')}
                </a>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{filteredCards.length} frameworks shown</span>
                {search || category !== 'ALL' || release !== 'ALL' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setCategory('ALL');
                      setRelease('ALL');
                    }}
                    className="text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </Card>

            {visibleRecommendations.length > 0 ? (
              <section className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {t('frameworks.recommendedForYou')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('frameworks.recommendedDesc')}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {visibleRecommendations.map((card) => (
                    <FrameworkCatalogCard
                      key={`rec-${card.fw.slug}`}
                      card={card}
                      canManageScope={canManageScope}
                      isOrgAdmin={isOrgAdmin}
                      onActivate={(fw) => activateMutation.mutate(fw)}
                      onUpgrade={setUpgradeTarget}
                      onRequestAccess={(fw) => requestAccessMutation.mutate(fw)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {t('frameworks.allFrameworks')}
                </h2>
              </div>
              {filteredCards.length ? (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCards.map((card) => (
                    <FrameworkCatalogCard
                      key={card.fw.slug}
                      card={card}
                      canManageScope={canManageScope}
                      isOrgAdmin={isOrgAdmin}
                      onActivate={(fw) => activateMutation.mutate(fw)}
                      onUpgrade={setUpgradeTarget}
                      onRequestAccess={(fw) => requestAccessMutation.mutate(fw)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed border-border bg-muted/40 p-8 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No frameworks match the current filters.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try broadening the search, category, or release filters.
                  </p>
                </Card>
              )}
            </section>
          </TabsContent>

          <TabsContent value="updates" className="mt-0">
            <div className="py-16 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm">{t('frameworks.updateNotesEmpty')}</p>
            </div>
          </TabsContent>
        </Tabs>
      )}

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
