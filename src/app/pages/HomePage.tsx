import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
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

  const compliance = complianceRaw ?? null;
  const riskOverview = riskRaw ?? null;
  const recentActivity = activityRaw ?? [];
  const readiness = readinessRaw ?? [];
  const testSummary = testSummaryRaw ?? null;

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: QK.complianceStats() });
    qc.invalidateQueries({ queryKey: QK.riskOverview() });
    qc.invalidateQueries({ queryKey: QK.testSummary() });
    qc.invalidateQueries({ queryKey: QK.activityLog(8) });
    qc.invalidateQueries({ queryKey: ['frameworks', 'readiness-summary'] });
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ── Recent Activity ── */}
          <Card className="p-6 flex flex-col h-72">
            {/* fixed header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                Recent Activity
              </h2>
              <Activity className="w-5 h-5 text-muted-foreground/70" />
            </div>

            {/* scrollable body — only this area scrolls */}
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

          {/* ── Risk Distribution ── */}
          <Card
            className="p-6 flex flex-col h-72 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate('/risk/risks')}
          >
            {/* fixed header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                Risk Distribution
              </h2>
              <TrendingUp className="w-5 h-5 text-muted-foreground/70" />
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {loadingRisks ? (
                <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground/70">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading risk data…
                </div>
              ) : !riskOverview ? (
                <p className="text-sm text-muted-foreground/70 py-6">
                  Could not load risk data.
                </p>
              ) : (
                <div className="space-y-3">
                  {[
                    {
                      level: 'Critical',
                      count: riskOverview.critical,
                      color: 'bg-red-500',
                    },
                    {
                      level: 'High',
                      count: riskOverview.high,
                      color: 'bg-orange-500',
                    },
                    {
                      level: 'Medium',
                      count: riskOverview.medium,
                      color: 'bg-yellow-500',
                    },
                    {
                      level: 'Low',
                      count: riskOverview.low,
                      color: 'bg-green-500',
                    },
                  ].map((risk) => (
                    <div key={risk.level} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                      <span className="text-sm text-foreground flex-1">
                        {risk.level}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {risk.count}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
                    <span>{riskOverview.open} open</span>
                    <span>{riskOverview.mitigated} mitigated</span>
                    <span>{riskOverview.total} total</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* ── Framework Readiness ── */}
          <Card
            className="p-6 flex flex-col h-72 cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => navigate('/compliance/frameworks')}
          >
            {/* fixed header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-foreground">
                Framework Readiness
              </h2>
              <ShieldCheck className="w-5 h-5 text-muted-foreground/70" />
            </div>

            {/* body */}
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

          {/* ── Quick Actions ── */}
          <Card className="p-6 flex flex-col h-72">
            {/* fixed header */}
            <div className="shrink-0 mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Quick Actions
              </h2>
            </div>

            {/* body — fills remaining height, grid centres itself naturally */}
            <div className="flex-1 grid grid-cols-2 gap-3 content-start">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/compliance/policies')}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm">New Policy</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/tests')}
              >
                <Shield className="w-5 h-5" />
                <span className="text-sm">Run Test</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/reports')}
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">Report Risk</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/vendors')}
              >
                <Users className="w-5 h-5" />
                <span className="text-sm">Add Vendor</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
