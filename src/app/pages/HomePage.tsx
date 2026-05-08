import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/app/components/ui/dropdown-menu';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  AlertTriangle,
  Clock,
  TrendingUp,
  FileText,
  Users,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Zap,
  ChevronDown,
  ClipboardCheck,
  FileCheck,
  Building2,
} from 'lucide-react';
import {
  dashboardService,
  type DashboardSummary,
} from '@/services/api/dashboard';
import { type FrameworkReadinessDto } from '@/services/api/frameworks';
import { STALE } from '@/lib/queryClient';
import { ComplianceLaunchpad } from './ComplianceLaunchpad';

const DASHBOARD_QUERY_KEY = ['dashboard', 'summary'] as const;

const EMPTY_POLICY_STATS = { total: 0, published: 0, draft: 0, review: 0 } as const;

// Risk severity bars consume flat critical/high/medium/low counts. The
// /api/dashboard/summary risks payload exposes them via severityBreakdown
// (an array keyed by inherent_impact level), so we project to the flat shape
// the existing UI already expects.
type RiskSeverityLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
function severityCount(
  raw: DashboardSummary['sections']['risks']['data'],
  label: RiskSeverityLabel,
): number {
  if (!raw) return 0;
  return raw.severityBreakdown.find((b) => b.label === label)?.count ?? 0;
}

export function HomePage() {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ── Single-roundtrip dashboard summary ───────────────────────────────────────
  // Replaces seven parallel useQuery calls with one /api/dashboard/summary
  // request. Section-level errors are isolated: a downed loader makes its
  // section render its empty state instead of blanking the whole page.

  const {
    data: summary,
    isLoading: loadingAll,
    isFetching: fetchingAll,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: () => dashboardService.getSummary(),
    staleTime: STALE.DASHBOARD,
    retry: (count, err: unknown) => {
      if ((err as { statusCode?: number })?.statusCode === 401) {
        window.location.href = '/login';
        return false;
      }
      return count < 1;
    },
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const compliance = useMemo(
    () => summary?.sections.compliance.data ?? null,
    [summary],
  );

  const rawRisks = useMemo(
    () => summary?.sections.risks.data ?? null,
    [summary],
  );

  // Project the risks payload to the flat shape the UI bars expect.
  const riskOverview = useMemo(() => {
    if (!rawRisks) return null;
    return {
      total: rawRisks.total,
      open: rawRisks.open,
      monitoring: rawRisks.monitoring,
      closed: rawRisks.closed,
      critical: severityCount(rawRisks, 'CRITICAL'),
      high: severityCount(rawRisks, 'HIGH'),
      medium: severityCount(rawRisks, 'MEDIUM'),
      low: severityCount(rawRisks, 'LOW'),
      mitigated: rawRisks.closed,
    };
  }, [rawRisks]);

  const readiness: FrameworkReadinessDto[] = useMemo(
    () => summary?.sections.frameworks.data ?? [],
    [summary],
  );

  const testSummary = useMemo(
    () => summary?.sections.tests.data ?? null,
    [summary],
  );

  const policyStats = useMemo(
    () => summary?.sections.policies.data ?? EMPTY_POLICY_STATS,
    [summary],
  );

  const docStats = useMemo(
    () => summary?.sections.documents.data ?? null,
    [summary],
  );

  const vendorStats = useMemo(
    () => summary?.sections.vendors.data ?? null,
    [summary],
  );

  // Single bundled query, so all section loading flags share one boolean.
  // The granular flags below are kept so the existing per-card render logic
  // (skeletons, empty states) doesn't have to change.
  const loadingCompliance = loadingAll;
  const loadingRisks = loadingAll;
  const loadingReadiness = loadingAll;
  const loadingTests = loadingAll;
  const loadingPolicies = loadingAll;
  const loadingDocs = loadingAll;
  const loadingVendors = loadingAll;
  const fetchingCompliance = fetchingAll;

  const vendorNeedAttention = vendorStats?.needAttention ?? 0;

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
  };

  const vendorsAttention = loadingVendors
    ? null
    : String(vendorNeedAttention);

  const activeControls = loadingCompliance
    ? null
    : compliance
      ? String(compliance.total)
      : '—';

  const openRisks = loadingRisks
    ? null
    : riskOverview
      ? String(riskOverview.open)
      : '—';

  const pendingTasks = loadingTests
    ? null
    : testSummary
      ? String(testSummary.total - testSummary.completed)
      : '0';

  const stats = [
    {
      key: 'controls',
      label: t('stats.activeControls'),
      value: activeControls,
      icon: Shield,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      path: '/compliance/controls',
    },
    {
      key: 'risks',
      label: t('stats.openRisks'),
      value: openRisks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/40',
      path: '/risk/risks',
    },
    {
      key: 'vendors',
      label: t('stats.vendorsNeedAttention'),
      value: vendorsAttention,
      icon: Building2,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      path: '/vendors',
    },
    {
      key: 'tasks',
      label: t('stats.pendingTasks'),
      value: pendingTasks,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      path: '/onboarding-tasks',
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <PageTemplate
      title={t('title')}
      description={t('description')}
      actions={
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 rounded-md px-3 text-sm font-semibold border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{t('quickActions')}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => navigate('/compliance/policies')}>
                <FileText className="w-4 h-4 mr-2" />
                {t('newPolicy')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/validations')}>
                <Shield className="w-4 h-4 mr-2" />
                {t('runTest')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/risk/risks')}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                {t('reportRisk')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/vendors')}>
                <Users className="w-4 h-4 mr-2" />
                {t('addVendor')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={fetchingCompliance}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${fetchingCompliance ? 'animate-spin' : ''}`}
            />
            {tc('actions.refresh')}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {!loadingReadiness && readiness.length === 0 ? (
          <ComplianceLaunchpad
            policyStats={policyStats}
            riskOverview={riskOverview}
            testSummary={testSummary}
            loadingPolicies={loadingPolicies}
            loadingRisks={loadingRisks}
            loadingTests={loadingTests}
          />
        ) : (
          <>
            {/* ── KPI Stats ── */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                const isLive = stat.value === null;
                return (
                  <Card
                    key={stat.key}
                    className="cursor-pointer p-5 transition-shadow duration-200 hover:shadow-md"
                    onClick={() => navigate(stat.path)}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                          <Icon className={`h-4 w-4 ${stat.color}`} />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">{stat.label}</h3>
                      </div>
                      {isLive ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
                      ) : (
                        <span className="text-2xl font-extrabold tracking-tight text-foreground">
                          {stat.value}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* ── Progress Overview ── */}
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t('progressOverview')}
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Tests */}
                <Card
                  className="cursor-pointer p-5 transition-shadow duration-200 hover:shadow-md"
                  onClick={() => navigate('/validations')}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                        <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{t('tests.title')}</h3>
                    </div>
                    {!loadingTests && testSummary && (
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        {testSummary.passPercentage}%
                      </span>
                    )}
                  </div>
                  {loadingTests ? (
                    <LoadingSkeleton />
                  ) : !testSummary ? (
                    <EmptyState label={t('tests.noTests')} />
                  ) : (
                    <>
                      <div className="mb-3 h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${testSummary.passPercentage}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        <StatDot color="bg-emerald-500" label={t('tests.done')} count={testSummary.completed} />
                        <StatDot color="bg-red-500" label={t('tests.overdue')} count={testSummary.overdue} />
                        <StatDot color="bg-amber-400" label={t('tests.dueSoon')} count={testSummary.dueSoon} />
                      </div>
                      <p className="mt-2.5 text-xs font-medium text-muted-foreground/50">
                        {t('tests.total', { count: testSummary.total })}
                      </p>
                    </>
                  )}
                </Card>

                {/* Risks */}
                <Card
                  className="cursor-pointer p-5 transition-shadow duration-200 hover:shadow-md"
                  onClick={() => navigate('/risk/risks')}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40">
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{t('risks.title')}</h3>
                    </div>
                    {!loadingRisks && riskOverview && (
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        {riskOverview.total}
                      </span>
                    )}
                  </div>
                  {loadingRisks ? (
                    <LoadingSkeleton />
                  ) : !riskOverview ? (
                    <EmptyState label={t('risks.noRisks')} />
                  ) : (
                    <>
                      <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
                        {riskOverview.total > 0 && (
                          <>
                            <div className="h-2.5 bg-red-500" style={{ width: `${(riskOverview.critical / riskOverview.total) * 100}%` }} />
                            <div className="h-2.5 bg-orange-500" style={{ width: `${(riskOverview.high / riskOverview.total) * 100}%` }} />
                            <div className="h-2.5 bg-yellow-400" style={{ width: `${(riskOverview.medium / riskOverview.total) * 100}%` }} />
                            <div className="h-2.5 bg-green-500" style={{ width: `${(riskOverview.low / riskOverview.total) * 100}%` }} />
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        <StatDot color="bg-red-500" label={t('risks.critical')} count={riskOverview.critical} />
                        <StatDot color="bg-orange-500" label={t('risks.high')} count={riskOverview.high} />
                        <StatDot color="bg-yellow-400" label={t('risks.medium')} count={riskOverview.medium} />
                        <StatDot color="bg-green-500" label={t('risks.low')} count={riskOverview.low} />
                      </div>
                      <p className="mt-2.5 text-xs font-medium text-muted-foreground/50">
                        {t('risks.openMitigated', { open: riskOverview.open, mitigated: riskOverview.mitigated })}
                      </p>
                    </>
                  )}
                </Card>

                {/* Policies */}
                <Card
                  className="cursor-pointer p-5 transition-shadow duration-200 hover:shadow-md"
                  onClick={() => navigate('/compliance/policies')}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{t('policies.title')}</h3>
                    </div>
                    {!loadingPolicies && policyStats.total > 0 && (
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        {Math.round((policyStats.published / policyStats.total) * 100)}%
                      </span>
                    )}
                  </div>
                  {loadingPolicies ? (
                    <LoadingSkeleton />
                  ) : policyStats.total === 0 ? (
                    <EmptyState label={t('policies.noPolicies')} />
                  ) : (
                    <>
                      <div className="mb-3 h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-blue-500 transition-all"
                          style={{ width: `${Math.round((policyStats.published / policyStats.total) * 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        <StatDot color="bg-blue-500" label={t('policies.published')} count={policyStats.published} />
                        <StatDot color="bg-gray-400" label={t('policies.draft')} count={policyStats.draft} />
                        <StatDot color="bg-amber-500" label={t('policies.review')} count={policyStats.review} />
                      </div>
                      <p className="mt-2.5 text-xs font-medium text-muted-foreground/50">
                        {t('policies.total', { count: policyStats.total })}
                      </p>
                    </>
                  )}
                </Card>

                {/* Documents */}
                <Card
                  className="cursor-pointer p-5 transition-shadow duration-200 hover:shadow-md"
                  onClick={() => navigate('/compliance/documents')}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
                        <FileCheck className="h-4 w-4 text-violet-600" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{t('documents.title')}</h3>
                    </div>
                    {!loadingDocs && docStats && docStats.total > 0 && (
                      <span className="text-2xl font-extrabold tracking-tight text-foreground">
                        {Math.round((docStats.current / docStats.total) * 100)}%
                      </span>
                    )}
                  </div>
                  {loadingDocs ? (
                    <LoadingSkeleton />
                  ) : !docStats || docStats.total === 0 ? (
                    <EmptyState label={t('documents.noDocuments')} />
                  ) : (
                    <>
                      <div className="mb-3 h-2.5 w-full rounded-full bg-muted">
                        <div
                          className="h-2.5 rounded-full bg-violet-500 transition-all"
                          style={{ width: `${Math.round((docStats.current / docStats.total) * 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                        <StatDot color="bg-violet-500" label={t('documents.current')} count={docStats.current} />
                        <StatDot color="bg-gray-400" label={t('documents.pending')} count={docStats.pending} />
                        <StatDot color="bg-amber-500" label={t('documents.review')} count={docStats.needsReview} />
                      </div>
                      <p className="mt-2.5 text-xs font-medium text-muted-foreground/50">
                        {t('documents.total', { count: docStats.total })}
                      </p>
                    </>
                  )}
                </Card>
              </div>
            </div>

            {/* ── Framework Readiness ── */}
            <div>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                {t('frameworkReadiness')}
              </h2>
              {loadingReadiness ? (
                <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground/70">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">{t('loadingFrameworks')}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {readiness.map((fw) => {
                    const pct = fw.controlCoveragePct ?? 0;
                    const barColor =
                      pct >= 80 ? 'bg-emerald-500' :
                      pct >= 50 ? 'bg-blue-500' :
                      pct >= 25 ? 'bg-amber-500' :
                      'bg-red-500';
                    return (
                      <Card
                        key={fw.slug}
                        className="cursor-pointer p-5 transition-shadow duration-200 hover:shadow-md"
                        onClick={() => navigate(`/compliance/frameworks/${fw.slug}`)}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
                              <ShieldCheck className="h-4 w-4 text-indigo-600" />
                            </div>
                            <h3 className="truncate text-sm font-bold text-foreground">
                              {fw.name}
                            </h3>
                          </div>
                          <span className="ml-2 shrink-0 text-2xl font-extrabold tracking-tight text-foreground">
                            {pct}%
                          </span>
                        </div>
                        <div className="mb-3 h-2.5 w-full rounded-full bg-muted">
                          <div
                            className={`${barColor} h-2.5 rounded-full transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {t('framework.openGaps', { count: fw.openGaps ?? 0 })}
                          </span>
                          <span className="text-muted-foreground">
                            {t('framework.covered', { covered: fw.covered ?? 0, applicable: fw.applicable ?? 0 })}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PageTemplate>
  );
}

// ── Shared micro-components ──────────────────────────────────────────────────

function StatDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="font-bold text-foreground">{count}</span> {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground/50">
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium text-muted-foreground/50 py-6 text-center">{label}</p>
  );
}
