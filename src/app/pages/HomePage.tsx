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
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Users,
  Activity,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Zap,
  ChevronDown,
  ClipboardCheck,
  FileCheck,
} from 'lucide-react';
import { controlsService } from '@/services/api/controls';
import { riskLibraryService } from '@/services/api/risk-library';
import { testsService, type TestSummary } from '@/services/api/tests';
import {
  activityLogsService,
  ActivityLogEntry,
} from '@/services/api/activityLogs';
import {
  frameworksService,
  type FrameworkReadinessDto,
} from '@/services/api/frameworks';
import { policiesService } from '@/services/api/policies';
import {
  complianceDocumentService,
  type ComplianceDocumentStats,
} from '@/services/api/compliance-documents';
import { type Policy } from '@/services/api/types';
import { QK } from '@/lib/queryKeys';
import { STALE } from '@/lib/queryClient';

interface ComplianceStats {
  total: number;
  implemented: number;
  partiallyImplemented: number;
  notImplemented: number;
  compliancePercentage: number;
}

interface RiskOverview {
  total: number;
  open: number;
  mitigated: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function HomePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  // ── Queries ──────────────────────────────────────────────────────────────────

  const {
    data: complianceRaw,
    isLoading: loadingCompliance,
    isFetching: fetchingCompliance,
  } = useQuery({
    queryKey: QK.complianceStats(),
    queryFn: async () => {
      const res = await controlsService.getControlCompliance();
      return ((res as { data?: ComplianceStats })?.data ??
        res) as ComplianceStats;
    },
    staleTime: STALE.DASHBOARD,
    retry: (count, err: unknown) => {
      if ((err as { statusCode?: number })?.statusCode === 401) {
        window.location.href = '/login';
        return false;
      }
      return count < 1;
    },
  });

  const { data: riskRaw, isLoading: loadingRisks } = useQuery({
    queryKey: QK.riskOverview(),
    queryFn: async () => {
      const res = await riskLibraryService.getRegisterOverview();
      return ((res as { data?: RiskOverview })?.data ?? res) as RiskOverview;
    },
    staleTime: STALE.DASHBOARD,
  });

  const { data: activityRaw, isLoading: loadingActivity } = useQuery({
    queryKey: QK.activityLog(8),
    queryFn: async () => {
      const res = await activityLogsService.getRecentActivity(8);
      return ((res as { data?: ActivityLogEntry[] })?.data ??
        []) as ActivityLogEntry[];
    },
    staleTime: STALE.ACTIVITY,
  });

  const { data: readinessRaw, isLoading: loadingReadiness } = useQuery({
    queryKey: ['frameworks', 'readiness-summary'],
    queryFn: async () => {
      try {
        const res = await frameworksService.getReadinessSummary();
        return (res?.data ?? []) as FrameworkReadinessDto[];
      } catch {
        return [] as FrameworkReadinessDto[];
      }
    },
    staleTime: STALE.DASHBOARD,
  });

  const { data: testSummaryRaw, isLoading: loadingTests } = useQuery({
    queryKey: QK.testSummary(),
    queryFn: async () => {
      const res = await testsService.getTestSummary();
      return ((res as { data?: TestSummary })?.data ?? res) as TestSummary;
    },
    staleTime: STALE.DASHBOARD,
  });

  const { data: policiesRaw, isLoading: loadingPolicies } = useQuery({
    queryKey: QK.policies(),
    queryFn: async () => {
      const res = await policiesService.getPolicies();
      return ((res as { data?: Policy[] })?.data ?? []) as Policy[];
    },
    staleTime: STALE.DASHBOARD,
  });

  const { data: docsRaw, isLoading: loadingDocs } = useQuery({
    queryKey: ['compliance-documents', 'dashboard'],
    queryFn: async () => {
      const res = await complianceDocumentService.list();
      return (res as unknown as { stats?: ComplianceDocumentStats })?.stats ?? null;
    },
    staleTime: STALE.DASHBOARD,
  });

  // ── Derived data ─────────────────────────────────────────────────────────────

  const compliance = complianceRaw ?? null;
  const riskOverview = riskRaw ?? null;
  const recentActivity = activityRaw ?? [];
  const readiness = readinessRaw ?? [];
  const testSummary = testSummaryRaw ?? null;
  const policies = policiesRaw ?? [];
  const docStats = docsRaw ?? null;

  const policyStats = {
    total: policies.length,
    published: policies.filter((p) => p.status === 'PUBLISHED').length,
    draft: policies.filter((p) => p.status === 'DRAFT').length,
    review: policies.filter((p) => p.status === 'REVIEW').length,
  };

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: QK.complianceStats() });
    qc.invalidateQueries({ queryKey: QK.riskOverview() });
    qc.invalidateQueries({ queryKey: QK.testSummary() });
    qc.invalidateQueries({ queryKey: QK.activityLog(8) });
    qc.invalidateQueries({ queryKey: ['frameworks', 'readiness-summary'] });
    qc.invalidateQueries({ queryKey: QK.policies() });
    qc.invalidateQueries({ queryKey: ['compliance-documents', 'dashboard'] });
  };

  const complianceScore = loadingCompliance
    ? null
    : compliance
      ? `${compliance.compliancePercentage.toFixed(1)}%`
      : '—';

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
      label: 'Active Controls',
      value: activeControls,
      icon: Shield,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      path: '/compliance/controls',
    },
    {
      label: 'Open Risks',
      value: openRisks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/40',
      path: '/risk/risks',
    },
    {
      label: 'Compliance Score',
      value: complianceScore,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/40',
      path: '/compliance/frameworks',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      path: '/my-security-tasks',
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <PageTemplate
      title="Dashboard"
      description="Welcome back! Here's an overview of your security posture."
      actions={
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 h-8 rounded-md px-3 text-sm font-medium border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Actions</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => navigate('/compliance/policies')}>
                <FileText className="w-4 h-4 mr-2" />
                New Policy
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/tests')}>
                <Shield className="w-4 h-4 mr-2" />
                Run Test
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/risk/risks')}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Risk
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/vendors')}>
                <Users className="w-4 h-4 mr-2" />
                Add Vendor
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
            Refresh
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── KPI Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isLive = stat.value === null;
            return (
              <Card
                key={stat.label}
                className="p-5 cursor-pointer hover:shadow-md transition-shadow duration-200 group"
                onClick={() => navigate(stat.path)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    {isLive ? (
                      <div className="flex items-center h-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50" />
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-foreground leading-tight">
                        {stat.value}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground transition-colors">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── Progress Overview ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Progress Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tests */}
            <Card
              className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate('/tests')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                    <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Tests</h3>
                </div>
                {!loadingTests && testSummary && (
                  <span className="text-lg font-bold text-foreground">
                    {testSummary.passPercentage}%
                  </span>
                )}
              </div>
              {loadingTests ? (
                <LoadingSkeleton />
              ) : !testSummary ? (
                <EmptyState label="No tests" />
              ) : (
                <>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${testSummary.passPercentage}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <StatDot color="bg-emerald-500" label="Done" count={testSummary.completed} />
                    <StatDot color="bg-red-500" label="Overdue" count={testSummary.overdue} />
                    <StatDot color="bg-amber-400" label="Due soon" count={testSummary.dueSoon} />
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 mt-2">
                    {testSummary.total} total
                  </p>
                </>
              )}
            </Card>

            {/* Risks */}
            <Card
              className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate('/risk/risks')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Risks</h3>
                </div>
                {!loadingRisks && riskOverview && (
                  <span className="text-lg font-bold text-foreground">
                    {riskOverview.total}
                  </span>
                )}
              </div>
              {loadingRisks ? (
                <LoadingSkeleton />
              ) : !riskOverview ? (
                <EmptyState label="No risks" />
              ) : (
                <>
                  {/* Stacked bar */}
                  <div className="w-full bg-muted rounded-full h-2 mb-3 flex overflow-hidden">
                    {riskOverview.total > 0 && (
                      <>
                        <div className="bg-red-500 h-2" style={{ width: `${(riskOverview.critical / riskOverview.total) * 100}%` }} />
                        <div className="bg-orange-500 h-2" style={{ width: `${(riskOverview.high / riskOverview.total) * 100}%` }} />
                        <div className="bg-yellow-400 h-2" style={{ width: `${(riskOverview.medium / riskOverview.total) * 100}%` }} />
                        <div className="bg-green-500 h-2" style={{ width: `${(riskOverview.low / riskOverview.total) * 100}%` }} />
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <StatDot color="bg-red-500" label="Critical" count={riskOverview.critical} />
                    <StatDot color="bg-orange-500" label="High" count={riskOverview.high} />
                    <StatDot color="bg-yellow-400" label="Medium" count={riskOverview.medium} />
                    <StatDot color="bg-green-500" label="Low" count={riskOverview.low} />
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 mt-2">
                    {riskOverview.open} open · {riskOverview.mitigated} mitigated
                  </p>
                </>
              )}
            </Card>

            {/* Policies */}
            <Card
              className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate('/compliance/policies')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Policies</h3>
                </div>
                {!loadingPolicies && policyStats.total > 0 && (
                  <span className="text-lg font-bold text-foreground">
                    {Math.round((policyStats.published / policyStats.total) * 100)}%
                  </span>
                )}
              </div>
              {loadingPolicies ? (
                <LoadingSkeleton />
              ) : policyStats.total === 0 ? (
                <EmptyState label="No policies" />
              ) : (
                <>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((policyStats.published / policyStats.total) * 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <StatDot color="bg-blue-500" label="Published" count={policyStats.published} />
                    <StatDot color="bg-gray-400" label="Draft" count={policyStats.draft} />
                    <StatDot color="bg-amber-500" label="Review" count={policyStats.review} />
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 mt-2">
                    {policyStats.total} total
                  </p>
                </>
              )}
            </Card>

            {/* Documents */}
            <Card
              className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate('/compliance/documents')}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center">
                    <FileCheck className="w-3.5 h-3.5 text-violet-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Documents</h3>
                </div>
                {!loadingDocs && docStats && docStats.total > 0 && (
                  <span className="text-lg font-bold text-foreground">
                    {Math.round((docStats.current / docStats.total) * 100)}%
                  </span>
                )}
              </div>
              {loadingDocs ? (
                <LoadingSkeleton />
              ) : !docStats || docStats.total === 0 ? (
                <EmptyState label="No documents" />
              ) : (
                <>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className="bg-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((docStats.current / docStats.total) * 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <StatDot color="bg-violet-500" label="Current" count={docStats.current} />
                    <StatDot color="bg-gray-400" label="Pending" count={docStats.pending} />
                    <StatDot color="bg-amber-500" label="Review" count={docStats.needsReview} />
                  </div>
                  <p className="text-[11px] text-muted-foreground/50 mt-2">
                    {docStats.total} total
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>

        {/* ── Detail Panels ── */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Details
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Framework Readiness — spans 2 cols on lg */}
            <Card
              className="p-5 flex flex-col min-h-[20rem] lg:col-span-2 cursor-pointer hover:shadow-md transition-shadow duration-200"
              onClick={() => navigate('/compliance/frameworks')}
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Framework Readiness
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground/60">
                  {readiness.length} framework{readiness.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {loadingReadiness ? (
                  <div className="flex items-center gap-3 py-8 justify-center text-sm text-muted-foreground/70">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading framework data…
                  </div>
                ) : readiness.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShieldCheck className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground/70">No active frameworks</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Activate a framework to track compliance readiness
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {readiness.map((fw) => (
                      <div key={fw.slug} className="p-3 rounded-lg bg-muted/40 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {fw.name}
                          </span>
                          <span className="text-sm font-bold text-blue-600 ml-2 shrink-0">
                            {fw.controlCoveragePct != null ? `${fw.controlCoveragePct}%` : '—'}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${fw.controlCoveragePct ?? 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground/60">
                          <span>{fw.openGaps ?? 0} open gaps</span>
                          <span>{fw.covered ?? 0}/{fw.applicable ?? 0} covered</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Activity — right column */}
            <Card className="p-5 flex flex-col min-h-[20rem]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    Recent Activity
                  </h3>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-1">
                {loadingActivity ? (
                  <div className="flex items-center gap-3 py-8 justify-center text-sm text-muted-foreground/70">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading activity…
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground/70">No activity yet</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Actions will appear here as you work
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            activity.status === 'success'
                              ? 'bg-green-500'
                              : activity.status === 'warning'
                                ? 'bg-orange-500'
                                : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-snug">
                            {activity.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                            {activity.user.name} · {activity.timeAgo}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageTemplate>
  );
}

// ── Shared micro-components ──────────────────────────────────────────────────

function StatDot({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-foreground font-medium">{count}</span> {label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground/50">
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-xs text-muted-foreground/50 py-4 text-center">{label}</p>
  );
}
