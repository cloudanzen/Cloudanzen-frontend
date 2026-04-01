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

  const compliance = complianceRaw ?? null;
  const riskOverview = riskRaw ?? null;
  const recentActivity = activityRaw ?? [];
  const readiness = readinessRaw ?? [];
  const testSummary = testSummaryRaw ?? null;
  const policies = policiesRaw ?? [];
  const docStats = docsRaw ?? null;

  // Derived policy stats
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

  // Derived display values — fall back to skeleton dashes while loading
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
      change: null,
      icon: Shield,
      color: 'text-blue-600',
      path: '/compliance/controls',
    },
    {
      label: 'Open Risks',
      value: openRisks,
      change: null,
      icon: AlertTriangle,
      color: 'text-red-600',
      path: '/risk/risks',
    },
    {
      label: 'Compliance Score',
      value: complianceScore,
      change: null,
      icon: CheckCircle,
      color: 'text-green-600',
      path: '/compliance/frameworks',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      change: null,
      icon: Clock,
      color: 'text-orange-600',
      path: '/my-security-tasks',
    },
  ];

  return (
    <PageTemplate
      title="Dashboard"
      description="Welcome back! Here's an overview of your security posture."
      actions={
        <div className="flex items-center gap-2">
          {/* Quick Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Quick Actions
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/compliance/policies')}>
                <FileText className="w-4 h-4" />
                New Policy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/tests')}>
                <Shield className="w-4 h-4" />
                Run Test
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/risk/risks')}>
                <AlertTriangle className="w-4 h-4" />
                Report Risk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/vendors')}>
                <Users className="w-4 h-4" />
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isLive = stat.value === null; // still loading
            return (
              <Card
                key={stat.label}
                className="p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
                onClick={() => navigate(stat.path)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                  {stat.change !== null && (
                    <span className="text-sm text-green-600 font-medium">
                      {stat.change}
                    </span>
                  )}
                </div>
                {isLive ? (
                  <div className="flex items-center gap-2 h-9 mb-1">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/70" />
                  </div>
                ) : (
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            );
          })}
        </div>

        {/* ── Progress Tiles (mid row) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tests Progress */}
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate('/tests')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Tests</h3>
              <ClipboardCheck className="w-4 h-4 text-muted-foreground/70" />
            </div>
            {loadingTests ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground/70">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : !testSummary ? (
              <p className="text-xs text-muted-foreground/70">No data</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${testSummary.passPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-9 text-right">
                    {testSummary.passPercentage}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {testSummary.completed} done
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {testSummary.overdue} overdue
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    {testSummary.dueSoon} due soon
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {testSummary.total} total tests
                </p>
              </>
            )}
          </Card>

          {/* Risk Distribution */}
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate('/risk/risks')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Risks</h3>
              <TrendingUp className="w-4 h-4 text-muted-foreground/70" />
            </div>
            {loadingRisks ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground/70">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : !riskOverview ? (
              <p className="text-xs text-muted-foreground/70">No data</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                  {[
                    { label: 'Critical', count: riskOverview.critical, color: 'bg-red-500' },
                    { label: 'High', count: riskOverview.high, color: 'bg-orange-500' },
                    { label: 'Medium', count: riskOverview.medium, color: 'bg-yellow-500' },
                    { label: 'Low', count: riskOverview.low, color: 'bg-green-500' },
                  ].map((r) => (
                    <span key={r.label} className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${r.color}`} />
                      {r.label} <strong className="text-foreground">{r.count}</strong>
                    </span>
                  ))}
                </div>
                <div className="text-[11px] text-muted-foreground/60 flex gap-2">
                  <span>{riskOverview.open} open</span>
                  <span>·</span>
                  <span>{riskOverview.mitigated} mitigated</span>
                  <span>·</span>
                  <span>{riskOverview.total} total</span>
                </div>
              </>
            )}
          </Card>

          {/* Policy Progress */}
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate('/compliance/policies')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Policies</h3>
              <FileText className="w-4 h-4 text-muted-foreground/70" />
            </div>
            {loadingPolicies ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground/70">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : policyStats.total === 0 ? (
              <p className="text-xs text-muted-foreground/70">No policies yet</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.round((policyStats.published / policyStats.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-9 text-right">
                    {Math.round((policyStats.published / policyStats.total) * 100)}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    {policyStats.published} published
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    {policyStats.draft} draft
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {policyStats.review} review
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {policyStats.total} total policies
                </p>
              </>
            )}
          </Card>

          {/* Document Progress */}
          <Card
            className="p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate('/compliance/documents')}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Documents</h3>
              <FileCheck className="w-4 h-4 text-muted-foreground/70" />
            </div>
            {loadingDocs ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground/70">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : !docStats ? (
              <p className="text-xs text-muted-foreground/70">No documents yet</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${docStats.total > 0 ? Math.round((docStats.current / docStats.total) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-9 text-right">
                    {docStats.total > 0 ? Math.round((docStats.current / docStats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    {docStats.current} current
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    {docStats.pending} pending
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {docStats.needsReview} review
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  {docStats.total} total documents
                </p>
              </>
            )}
          </Card>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ── Framework Readiness (bottom-left) ── */}
          <Card
            className="p-6 flex flex-col h-72 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate('/compliance/frameworks')}
          >
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                Framework Readiness
              </h2>
              <ShieldCheck className="w-5 h-5 text-muted-foreground/70" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingReadiness ? (
                <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground/70">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading framework data…
                </div>
              ) : readiness.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground/70 mb-2" />
                  <p className="text-sm text-muted-foreground/70">No active frameworks</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Add a framework to track readiness
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {readiness.map((fw) => (
                    <div key={fw.slug} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {fw.name}
                        </span>
                        <span className="text-xs font-semibold text-blue-700 ml-2 shrink-0">
                          {fw.controlCoveragePct != null
                            ? `${fw.controlCoveragePct}%`
                            : '—'}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${fw.controlCoveragePct ?? 0}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-muted-foreground/70">
                        <span>{fw.openGaps ?? 0} open gaps</span>
                        <span>
                          {fw.covered ?? 0}/{fw.applicable ?? 0} covered
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* ── Recent Activity (bottom-right) ── */}
          <Card className="p-6 flex flex-col h-72">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h2>
              <Activity className="w-5 h-5 text-muted-foreground/70" />
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              {loadingActivity ? (
                <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground/70">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading activity…
                </div>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground/70 py-6 text-center">
                  No activity yet. Actions like creating risks, policies, or
                  uploading files will appear here.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
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
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
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
    </PageTemplate>
  );
}
